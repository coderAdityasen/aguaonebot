import { FastifyPluginAsync } from 'fastify';
import { statements } from '../database/db';
import { config } from '../config/env';
import { sendWhatsAppMessage, buildTextPayload } from '../whatsapp/client';
import { broadcastMessage, broadcastContactUpdate } from '../websocket/socket';
import { getSession, updateSession } from '../memory/session-cache';

export const messageRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/contacts/:phone/messages
  fastify.get('/api/contacts/:phone/messages', async (req) => {
    const { phone } = req.params as { phone: string };
    const messages = statements.getMessagesByPhone.all(phone);
    return { messages };
  });

  // POST /api/messages/send (Human Agent replies via WhatsApp)
  fastify.post('/api/messages/send', async (req, reply) => {
    const body = req.body as { phone: string; text: string };
    const phone = body.phone?.trim();
    const text = body.text?.trim();

    if (!phone || !text) {
      return reply.code(400).send({ error: 'Phone and text are required' });
    }

    const payload = buildTextPayload(phone, text);
    const sendResult = await sendWhatsAppMessage(config.whatsappPhoneNumberId, payload);

    const messageId = sendResult.messageId || `agent_${Date.now()}`;

    // Automatically pause bot when a human agent sends a manual message
    const session = getSession(phone);
    session.bot_active = 0;
    session.last_message = text;
    updateSession(session);
    statements.upsertContact.run(session);

    // Record outbound agent message in SQLite
    statements.insertMessage.run({
      whatsapp_message_id: messageId,
      phone,
      direction: 'outbound',
      sender_type: 'agent',
      message_type: 'text',
      content: text,
      selected_option: null,
      selected_title: null,
      status: sendResult.success ? 'sent' : 'failed'
    });

    const newMsg = {
      whatsapp_message_id: messageId,
      phone,
      direction: 'outbound',
      sender_type: 'agent',
      message_type: 'text',
      content: text,
      selected_option: null,
      selected_title: null,
      status: sendResult.success ? 'sent' : 'failed',
      timestamp: new Date().toISOString()
    };

    // Broadcast live event to all connected dashboard windows
    broadcastMessage(newMsg);
    broadcastContactUpdate(session);

    return {
      success: sendResult.success,
      message: newMsg,
      error: sendResult.error
    };
  });
};
