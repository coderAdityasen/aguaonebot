import { FastifyPluginAsync } from 'fastify';
import { config } from '../config/env';
import { isDuplicateMessage, getSession, updateSession } from '../memory/session-cache';
import { routeConversation } from '../bot/router';
import { 
  sendWhatsAppMessage, 
  buildInteractiveListPayload, 
  buildTextPayload 
} from './client';
import { broadcastMessage, broadcastContactUpdate } from '../websocket/socket';
import { statements, db } from '../database/db';
import { getAutoVerifyToken } from './subscriptions';

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. GET /webhook: Meta Handshake Verification
  fastify.get('/webhook', async (req, reply) => {
    const query = req.query as Record<string, string>;
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    console.log(`\n======================================================`);
    console.log(`🔑 [META WEBHOOK VERIFICATION REQUEST]`);
    console.log(`⏰ Time:     ${new Date().toISOString()}`);
    console.log(`📋 Mode:     ${mode}`);
    console.log(`🔑 Token:    ${token ? token.slice(0, 6) + '***' : 'none'}`);
    
    const autoToken = getAutoVerifyToken();
    const tokenMatches = token === config.whatsappVerifyToken || token === autoToken;

    if (mode === 'subscribe' && tokenMatches) {
      console.log(`✅ [RESULT]: Verification SUCCESS! Returning challenge.`);
      console.log(`======================================================\n`);
      return reply.code(200).send(challenge);
    }

    console.warn(`❌ [RESULT]: Verification FAILED! Verify token did not match.`);
    console.log(`======================================================\n`);
    return reply.code(403).send('Forbidden');
  });

  // 2. POST /webhook: Inbound WhatsApp Events Ingestion
  fastify.post('/webhook', async (req, reply) => {
    // Acknowledge Meta immediately within <1ms to prevent retries
    reply.code(200).send('EVENT_RECEIVED');

    const body = req.body as any;
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const message = changes?.messages?.[0];

    // If payload is a delivery status ping (sent/delivered/read)
    if (!message) {
      const statusObj = changes?.statuses?.[0];
      if (statusObj) {
        console.log(`[WhatsApp Status] Message ${statusObj.id} -> ${statusObj.status} (recipient: ${statusObj.recipient_id})`);
        try {
          db.prepare('UPDATE messages SET status = ? WHERE whatsapp_message_id = ?')
            .run(statusObj.status, statusObj.id);
        } catch {
          // Status tracking is best effort
        }
      }
      return;
    }

    const phone = message.from;
    const messageId = message.id;

    // Deduplication check
    if (isDuplicateMessage(messageId)) {
      console.log(`⚠️  [WEBHOOK DUPLICATE IGNORED] Message ID: ${messageId} from +${phone}`);
      return;
    }

    // Extract message content
    let incomingText = '';
    let selectedOption = '';
    let selectedTitle = '';

    if (message.type === 'text') {
      incomingText = message.text?.body?.trim() || '';
    } else if (message.type === 'interactive') {
      const interactive = message.interactive;
      if (interactive.type === 'list_reply') {
        selectedOption = interactive.list_reply?.id || '';
        selectedTitle = interactive.list_reply?.title || '';
        incomingText = selectedTitle;
      } else if (interactive.type === 'button_reply') {
        selectedOption = interactive.button_reply?.id || '';
        selectedTitle = interactive.button_reply?.title || '';
        incomingText = selectedTitle;
      }
    }

    const customerName = changes.contacts?.[0]?.profile?.name || 'Customer';
    const phoneNumberId = changes.metadata?.phone_number_id || config.whatsappPhoneNumberId;

    // Structured Console Log for Received Message
    console.log(`\n======================================================`);
    console.log(`📥 [INBOUND WHATSAPP MESSAGE RECEIVED]`);
    console.log(`⏰ Time:       ${new Date().toISOString()}`);
    console.log(`📱 From:       +${phone} (${customerName})`);
    console.log(`🆔 Message ID: ${messageId}`);
    console.log(`📦 Type:       ${message.type}${selectedOption ? ` (${message.interactive?.type})` : ''}`);
    console.log(`💬 Message:    "${incomingText || selectedTitle}"`);
    if (selectedOption) {
      console.log(`🎯 Option ID:  ${selectedOption}`);
      console.log(`🏷️ Option Title:${selectedTitle}`);
    }

    // Process asynchronously without blocking webhook event loop
    setImmediate(async () => {
      try {
        const session = getSession(phone);
        const stateBefore = session.state;
        const botWasActive = session.bot_active === 1 && session.lead_status !== 'HANDOFF';

        console.log(`🔄 State Before: ${stateBefore} | Bot Mode: ${botWasActive ? '🤖 BOT ACTIVE' : '🙋 HUMAN MODE'}`);

        if (customerName && customerName !== 'Customer' && session.name === 'Customer') {
          session.name = customerName;
        }

        session.unread_count = (session.unread_count || 0) + 1;
        session.last_message = incomingText || selectedTitle;

        // Ensure contact exists in DB first to satisfy foreign key constraint
        statements.upsertContact.run(session);

        // Save incoming customer message in SQLite
        statements.insertMessage.run({
          whatsapp_message_id: messageId,
          phone,
          direction: 'inbound',
          sender_type: 'customer',
          message_type: selectedOption ? 'interactive' : 'text',
          content: incomingText || selectedTitle,
          selected_option: selectedOption || null,
          selected_title: selectedTitle || null,
          status: 'delivered'
        });

        // Broadcast to React Agent Dashboard in real time
        broadcastMessage({
          whatsapp_message_id: messageId,
          phone,
          direction: 'inbound',
          sender_type: 'customer',
          message_type: selectedOption ? 'interactive' : 'text',
          content: incomingText || selectedTitle,
          selected_option: selectedOption || null,
          selected_title: selectedTitle || null,
          status: 'delivered',
          timestamp: new Date().toISOString()
        });

        // Run through AGUAONE Conversation State Machine
        const routeResult = routeConversation(session, incomingText, selectedOption, selectedTitle);

        // Update session in RAM and trigger async DB persistence
        updateSession(routeResult.updatedSession);
        broadcastContactUpdate(routeResult.updatedSession);

        console.log(`🎯 State After:  ${routeResult.updatedSession.state} | Action: ${routeResult.action}`);
        console.log(`⭐ Qualified:    ${routeResult.updatedSession.qualified ? 'YES' : 'NO'}`);

        // If bot is silent (Human Takeover or Qualified Handoff)
        if (!routeResult.shouldReply || routeResult.replyType === 'none') {
          console.log(`🙋 [BOT SILENT]: Handoff active. Pushed message to Human Agent UI.`);
          console.log(`======================================================\n`);
          return;
        }

        // If bot decided to reply
        let payload: any;
        if (routeResult.replyType === 'list') {
          payload = buildInteractiveListPayload(phone, routeResult.replyText, routeResult.options);
        } else {
          payload = buildTextPayload(phone, routeResult.replyText);
        }

        console.log(`📤 [DISPATCHING BOT REPLY]`);
        console.log(`📦 Reply Type: ${routeResult.replyType.toUpperCase()}`);
        console.log(`💬 Content:    "${routeResult.replyText.replace(/\n/g, ' ')}"`);
        if (routeResult.options.length > 0) {
          console.log(`🔘 Options:    ${routeResult.options.map(o => o.title).join(', ')}`);
        }

        // Dispatch reply to WhatsApp Cloud API via persistent socket
        const sendRes = await sendWhatsAppMessage(phoneNumberId, payload);
        const botMsgId = sendRes.messageId || `bot_${Date.now()}`;

        if (sendRes.success) {
          console.log(`✅ [BOT REPLY SENT SUCCESSFULLY] (Meta ID: ${botMsgId})`);
        } else {
          console.error(`❌ [BOT REPLY FAILED]:`, sendRes.error);
        }
        console.log(`======================================================\n`);

        // Record outbound bot message in SQLite
        statements.insertMessage.run({
          whatsapp_message_id: botMsgId,
          phone,
          direction: 'outbound',
          sender_type: 'bot',
          message_type: routeResult.replyType,
          content: routeResult.replyText,
          selected_option: null,
          selected_title: null,
          status: sendRes.success ? 'sent' : 'failed'
        });

        // Broadcast bot message to Agent UI
        broadcastMessage({
          whatsapp_message_id: botMsgId,
          phone,
          direction: 'outbound',
          sender_type: 'bot',
          message_type: routeResult.replyType,
          content: routeResult.replyText,
          selected_option: null,
          selected_title: null,
          status: sendRes.success ? 'sent' : 'failed',
          timestamp: new Date().toISOString()
        });

      } catch (err) {
        console.error('❌ [Webhook Error]:', err);
        console.log(`======================================================\n`);
      }
    });
  });
};
