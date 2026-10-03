import { FastifyPluginAsync } from 'fastify';
import { statements } from '../database/db';
import { getSession, updateSession, setBotActiveInCache } from '../memory/session-cache';
import { broadcastContactUpdate } from '../websocket/socket';

export const contactRoutes: FastifyPluginAsync = async (fastify) => {
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

    return { contacts };
  });

  // GET /api/contacts/:phone
  fastify.get('/api/contacts/:phone', async (req, reply) => {
    const { phone } = req.params as { phone: string };
    const contact = statements.getContact.get(phone) as any;

    if (!contact) {
      return reply.code(404).send({ error: 'Contact not found' });
    }

    const notes = statements.getNotesByPhone.all(phone);
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

  // PATCH /api/contacts/:phone/lead
  fastify.patch('/api/contacts/:phone/lead', async (req, reply) => {
    const { phone } = req.params as { phone: string };
    const body = req.body as { lead_status?: string; qualified?: number };

    const session = getSession(phone);
    if (body.lead_status) session.lead_status = body.lead_status;
    if (typeof body.qualified === 'number') session.qualified = body.qualified;

    updateSession(session);
    broadcastContactUpdate(session);

    return { success: true, contact: session };
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
};
