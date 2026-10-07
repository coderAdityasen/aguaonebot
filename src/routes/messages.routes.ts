import { FastifyPluginAsync } from 'fastify';
import fs from 'fs';
import path from 'path';
import { statements } from '../database/db';
import { config } from '../config/env';
import { 
  sendWhatsAppMessage, 
  buildTextPayload, 
  uploadMediaToMeta, 
  sendWhatsAppMediaMessage 
} from '../whatsapp/client';
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
      media_url: '',
      caption: '',
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
      media_url: '',
      caption: '',
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

  // POST /api/messages/send-media (Upload image/video/document and send to WhatsApp customer)
  fastify.post('/api/messages/send-media', async (req, reply) => {
    let fileBuffer: Buffer | null = null;
    let fileName = '';
    let mimeType = '';
    let phone = '';
    let caption = '';
    let mediaType: 'image' | 'video' | 'document' | 'audio' = 'image';

    try {
      const parts = req.parts({ limits: { fileSize: 50 * 1024 * 1024 } });
      for await (const part of parts) {
        if (part.type === 'file') {
          fileBuffer = await part.toBuffer();
          if (!fileName && part.filename) {
            fileName = part.filename;
          }
          mimeType = part.mimetype;
        } else {
          if (part.fieldname === 'filename' && part.value) {
            fileName = ((part.value as string) || '').trim();
          }
          if (part.fieldname === 'phone') phone = ((part.value as string) || '').trim();
          if (part.fieldname === 'caption') caption = ((part.value as string) || '').trim();
          if (part.fieldname === 'type') {
            const t = ((part.value as string) || '').trim().toLowerCase();
            if (t === 'image' || t === 'video' || t === 'document' || t === 'audio') {
              mediaType = t as any;
            }
          }
        }
      }
    } catch (err: any) {
      console.error('❌ [Media Upload] Multipart stream error:', err.message);
      return reply.code(400).send({ error: 'File upload error: ' + err.message });
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return reply.code(400).send({ error: 'No media file uploaded' });
    }
    if (!phone) {
      return reply.code(400).send({ error: 'Recipient phone number is required' });
    }

    // Auto-detect mediaType if not specified
    if (!mediaType || mediaType === 'image') {
      if (mimeType.startsWith('video/')) mediaType = 'video';
      else if (mimeType.startsWith('audio/')) mediaType = 'audio';
      else if (!mimeType.startsWith('image/')) mediaType = 'document';
    }

    // Sanitize and preserve real original filename
    let cleanOriginalName = (fileName || '').replace(/[\/\\]/g, '_').trim();
    if (!cleanOriginalName || cleanOriginalName.toLowerCase() === 'blob' || cleanOriginalName.toLowerCase() === 'untitled') {
      cleanOriginalName = mediaType === 'document' ? 'Document.pdf' : mediaType === 'video' ? 'Video.mp4' : 'Image.jpg';
    }
    let ext = path.extname(cleanOriginalName);
    if (!ext) {
      if (mediaType === 'video') ext = '.mp4';
      else if (mediaType === 'document') ext = mimeType.includes('pdf') ? '.pdf' : '.bin';
      else if (mediaType === 'audio') ext = '.mp3';
      else ext = '.jpg';
      cleanOriginalName = `${cleanOriginalName}${ext}`;
    }

    // Disk filename keeps original name with timestamp to prevent collisions
    const sanitizedBase = path.basename(cleanOriginalName, ext).replace(/[^\w\s.-]/gi, '_').trim() || mediaType;
    const safeFilename = `${Date.now()}_${sanitizedBase}${ext}`;
    const uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const localFilePath = path.join(uploadsDir, safeFilename);
    fs.writeFileSync(localFilePath, fileBuffer);

    const relativeMediaUrl = `/uploads/${safeFilename}`;
    const fileSizeKb = (fileBuffer.length / 1024).toFixed(1);

    console.log(`\n======================================================`);
    console.log(`📤 [OUTBOUND MEDIA DISPATCH]`);
    console.log(`📱 Recipient:    +${phone}`);
    console.log(`📦 Media Type:   ${mediaType.toUpperCase()}`);
    console.log(`📁 File Name:    ${cleanOriginalName} (${fileSizeKb} KB)`);
    console.log(`💬 Caption:      "${caption}"`);

    // 1. Upload to Meta Graph API
    let sendResult: any;
    const uploadRes = await uploadMediaToMeta(
      config.whatsappPhoneNumberId,
      fileBuffer,
      cleanOriginalName,
      mimeType
    );

    if (uploadRes.success && uploadRes.mediaId) {
      console.log(`✅ [Meta Media Uploaded] Media ID: ${uploadRes.mediaId}`);
      sendResult = await sendWhatsAppMediaMessage(
        config.whatsappPhoneNumberId,
        phone,
        mediaType,
        uploadRes.mediaId,
        caption,
        false,
        cleanOriginalName
      );
    } else {
      console.warn(`⚠️ [Meta Direct Upload Failed / Fallback]:`, uploadRes.error);
      const isPublicHttps = config.publicDomain.startsWith('https://') && !config.publicDomain.includes('localhost');
      if (isPublicHttps) {
        const fullPublicUrl = `${config.publicDomain.replace(/\/$/, '')}${relativeMediaUrl}`;
        console.log(`🌐 [Meta Fallback] Sending via Public Link: ${fullPublicUrl}`);
        sendResult = await sendWhatsAppMediaMessage(
          config.whatsappPhoneNumberId,
          phone,
          mediaType,
          fullPublicUrl,
          caption,
          true,
          cleanOriginalName
        );
      } else {
        console.warn(`⚠️ [Dev Simulation] Simulating media delivery.`);
        sendResult = {
          success: true,
          messageId: `sim_media_${Date.now()}`
        };
      }
    }

    if (!sendResult.success) {
      console.error(`❌ [Outbound Media Send Failed]:`, sendResult.error);
    } else {
      console.log(`🚀 [Outbound Media Dispatched] Message ID: ${sendResult.messageId}`);
    }
    console.log(`======================================================\n`);

    const messageId = sendResult.messageId || `agent_media_${Date.now()}`;
    const messageContent = mediaType === 'document' ? cleanOriginalName : (caption || (mediaType === 'image' ? '📷 Image' : mediaType === 'video' ? '🎥 Video' : '🎵 Audio'));

    // Automatically pause bot when human agent sends media
    const session = getSession(phone);
    session.bot_active = 0;
    session.last_message = caption || (mediaType === 'document' ? `📄 ${cleanOriginalName}` : messageContent);
    session.last_message_at = new Date().toISOString();
    session.updated_at = new Date().toISOString();
    updateSession(session);
    statements.upsertContact.run(session);

    // Record outbound agent media message in SQLite
    statements.insertMessage.run({
      whatsapp_message_id: messageId,
      phone,
      direction: 'outbound',
      sender_type: 'agent',
      message_type: mediaType,
      content: messageContent,
      media_url: relativeMediaUrl,
      caption: caption || '',
      selected_option: null,
      selected_title: null,
      status: sendResult.success ? 'sent' : 'failed'
    });

    const newMsg = {
      whatsapp_message_id: messageId,
      phone,
      direction: 'outbound',
      sender_type: 'agent',
      message_type: mediaType,
      content: messageContent,
      media_url: relativeMediaUrl,
      caption: caption || '',
      selected_option: null,
      selected_title: null,
      status: sendResult.success ? 'sent' : 'failed',
      timestamp: new Date().toISOString()
    };

    // Broadcast to dashboard
    broadcastMessage(newMsg);
    broadcastContactUpdate(session);

    return {
      success: sendResult.success,
      message: newMsg,
      error: sendResult.error
    };
  });
};
