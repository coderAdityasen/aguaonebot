import { FastifyPluginAsync } from 'fastify';
import fs from 'fs';
import path from 'path';
import { statements, db } from '../database/db';
import { getSession, updateSession, setBotActiveInCache, deleteSession } from '../memory/session-cache';
import { broadcastContactUpdate, broadcastContactDelete } from '../websocket/socket';

export const contactRoutes: FastifyPluginAsync = async (fastify) => {
  // Helper to ensure SQLite CURRENT_TIMESTAMP (which lacks 'Z') is treated as UTC
  const normalizeUtc = (str: any) => {
    if (str && typeof str === 'string' && !str.includes('Z') && !/[+-]\d{2}(:?\d{2})?$/.test(str)) {
      return str.replace(' ', 'T') + 'Z';
    }
    return str;
  };

  // GET /api/contacts?filter=all|handoff|bot_active|qualified&search=
  fastify.get('/api/contacts', async (req) => {
    const query = req.query as { filter?: string; search?: string };
    const filter = query.filter || 'all';
    const search = (query.search || '').trim().toLowerCase();

    let contacts = statements.getContactsByFilter.all({ filter }) as any[];

    if (search) {
      contacts = contacts.filter((c) =>
        c.phone.toLowerCase().includes(search) ||
        (c.name && c.name.toLowerCase().includes(search)) ||
        (c.city && c.city.toLowerCase().includes(search))
      );
    }

    contacts = contacts.map((c) => ({
      ...c,
      last_message_at: normalizeUtc(c.last_message_at),
      updated_at: normalizeUtc(c.updated_at),
      created_at: normalizeUtc(c.created_at)
    }));

    return { contacts };
  });

  // GET /api/contacts/:phone
  fastify.get('/api/contacts/:phone', async (req, reply) => {
    const { phone } = req.params as { phone: string };
    const rawContact = statements.getContact.get(phone) as any;

    if (!rawContact) {
      return reply.code(404).send({ error: 'Contact not found' });
    }

    const contact = {
      ...rawContact,
      last_message_at: normalizeUtc(rawContact.last_message_at),
      updated_at: normalizeUtc(rawContact.updated_at),
      created_at: normalizeUtc(rawContact.created_at)
    };

    const rawNotes = statements.getNotesByPhone.all(phone) as any[];
    const notes = rawNotes.map((n) => ({
      ...n,
      created_at: normalizeUtc(n.created_at)
    }));

    return { contact, notes };
  });

  // POST /api/contacts/:phone/toggle-bot
  fastify.post('/api/contacts/:phone/toggle-bot', async (req, reply) => {
    const { phone } = req.params as { phone: string };
    const body = req.body as { bot_active: number };

    const newStatus = body.bot_active ? 1 : 0;
    statements.updateBotStatus.run(newStatus, phone);
    setBotActiveInCache(phone, newStatus);

    const updated = statements.getContact.get(phone) as any;
    broadcastContactUpdate(updated);

    return { success: true, bot_active: newStatus, contact: updated };
  });

  // PATCH /api/contacts/:phone/name
  fastify.patch('/api/contacts/:phone/name', async (req, reply) => {
    const { phone } = req.params as { phone: string };
    const body = req.body as { name: string };
    const newName = (body.name || '').trim();

    if (!newName) {
      return reply.code(400).send({ error: 'Name cannot be empty' });
    }

    statements.updateContactName.run(newName, phone);
    const session = getSession(phone);
    session.name = newName;
    updateSession(session);

    const updated = statements.getContact.get(phone) as any;
    broadcastContactUpdate(updated || session);

    return { success: true, contact: updated || session };
  });

  // PATCH /api/contacts/:phone/lead
  fastify.patch('/api/contacts/:phone/lead', async (req, reply) => {
    const { phone } = req.params as { phone: string };
    const body = req.body as { lead_status?: string; qualified?: number; name?: string };

    const session = getSession(phone);
    if (body.name && body.name.trim()) {
      const newName = body.name.trim();
      statements.updateContactName.run(newName, phone);
      session.name = newName;
    }
    if (body.lead_status) session.lead_status = body.lead_status;
    if (typeof body.qualified === 'number') session.qualified = body.qualified;

    updateSession(session);
    const updated = statements.getContact.get(phone) as any;
    broadcastContactUpdate(updated || session);

    return { success: true, contact: updated || session };
  });

  // POST /api/contacts/:phone/reset-unread
  fastify.post('/api/contacts/:phone/reset-unread', async (req) => {
    const { phone } = req.params as { phone: string };
    statements.resetUnreadCount.run(phone);
    const session = getSession(phone);
    session.unread_count = 0;
    return { success: true };
  });

  // POST /api/contacts/:phone/notes
  fastify.post('/api/contacts/:phone/notes', async (req, reply) => {
    const { phone } = req.params as { phone: string };
    const body = req.body as { note: string; agent_name?: string };

    if (!body.note?.trim()) {
      return reply.code(400).send({ error: 'Note cannot be empty' });
    }

    const agentName = body.agent_name || 'Agent';
    statements.addNote.run(phone, agentName, body.note.trim());
    const notes = statements.getNotesByPhone.all(phone);

    return { success: true, notes };
  });

  // DELETE /api/contacts/:phone (Completely delete contact, history, media and cache)
  fastify.delete('/api/contacts/:phone', async (req, reply) => {
    const { phone } = req.params as { phone: string };
    const cleanPhone = phone.trim();

    if (!cleanPhone) {
      return reply.code(400).send({ error: 'Phone number is required' });
    }

    try {
      // 1. Delete associated media files on disk
      const mediaRows = statements.getMessagesByPhone.all(cleanPhone) as any[];
      for (const row of mediaRows) {
        if (row.media_url && typeof row.media_url === 'string' && row.media_url.startsWith('/uploads/')) {
          const baseName = path.basename(row.media_url);
          const filePath = path.resolve(process.cwd(), 'data', 'uploads', baseName);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (unlinkErr) {
              console.warn('[Delete Contact] Could not unlink media file:', unlinkErr);
            }
          }
        }
      }

      // 2. Delete messages and notes
      db.prepare('DELETE FROM messages WHERE phone = ?').run(cleanPhone);
      db.prepare('DELETE FROM notes WHERE phone = ?').run(cleanPhone);

      // 3. Delete contact record
      const delRes = db.prepare('DELETE FROM contacts WHERE phone = ?').run(cleanPhone);

      // 4. Delete from in-memory session cache
      deleteSession(cleanPhone);

      // 5. Broadcast real-time deletion to all open CRM dashboards
      broadcastContactDelete(cleanPhone);

      return {
        success: true,
        message: `Contact ${cleanPhone} completely deleted`,
        changes: delRes.changes
      };
    } catch (err: any) {
      console.error('[Delete Contact Error]:', err);
      return reply.code(500).send({ error: 'Failed to delete contact: ' + err.message });
    }
  });
};
