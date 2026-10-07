import { LRUCache } from 'lru-cache';
import { statements } from '../database/db';

export interface ContactSession {
  phone: string;
  name: string;
  brand: string; // 'aguaone' | 'flovax' | ''
  state: string;
  lead_status: string;
  bot_active: number;
  city: string;
  category: string;
  shop_status: string;
  experience: string;
  opportunity: string;
  budget: string;
  firm_name: string;
  import_license: string;
  import_experience: string;
  pan_registration: string;
  gst_status: string;
  qualified: number;
  unread_count: number;
  last_message: string;
  last_message_at?: string;
  created_at?: string;
  updated_at?: string;
}

// In-memory cache holding up to 5,000 active sessions (~3MB RAM)
const sessionCache = new LRUCache<string, ContactSession>({
  max: 5000,
  ttl: 1000 * 60 * 60 * 24 // 24-hour TTL
});

// Fast ring buffer for message deduplication
const messageIdRing = new Set<string>();

export function isDuplicateMessage(msgId: string): boolean {
  if (!msgId) return false;
  if (messageIdRing.has(msgId)) return true;

  // Check database if not found in RAM
  const dbCheck = statements.checkDuplicateMessage.get(msgId);
  if (dbCheck) {
    messageIdRing.add(msgId);
    return true;
  }

  messageIdRing.add(msgId);
  if (messageIdRing.size > 2000) {
    const first = messageIdRing.values().next().value;
    if (first) messageIdRing.delete(first);
  }
  return false;
}

export function getSession(phone: string): ContactSession {
  let session = sessionCache.get(phone);
  if (!session) {
    const nowIso = new Date().toISOString();
    const row = statements.getContact.get(phone) as any;
    if (row) {
      session = {
        phone: row.phone,
        name: row.name || 'Customer',
        brand: row.brand || '',
        state: row.state || 'new',
        lead_status: row.lead_status || 'IN_PROGRESS',
        bot_active: typeof row.bot_active === 'number' ? row.bot_active : 1,
        city: row.city || '',
        category: row.category || '',
        shop_status: row.shop_status || '',
        experience: row.experience || '',
        opportunity: row.opportunity || '',
        budget: row.budget || '',
        firm_name: row.firm_name || '',
        import_license: row.import_license || '',
        import_experience: row.import_experience || '',
        pan_registration: row.pan_registration || '',
        gst_status: row.gst_status || '',
        qualified: typeof row.qualified === 'number' ? row.qualified : 0,
        unread_count: row.unread_count || 0,
        last_message: row.last_message || '',
        last_message_at: row.last_message_at || nowIso,
        created_at: row.created_at || nowIso,
        updated_at: row.updated_at || nowIso
      };
    } else {
      session = {
        phone,
        name: 'Customer',
        brand: '',
        state: 'new',
        lead_status: 'IN_PROGRESS',
        bot_active: 1,
        city: '',
        category: '',
        shop_status: '',
        experience: '',
        opportunity: '',
        budget: '',
        firm_name: '',
        import_license: '',
        import_experience: '',
        pan_registration: '',
        gst_status: '',
        qualified: 0,
        unread_count: 0,
        last_message: '',
        last_message_at: nowIso,
        created_at: nowIso,
        updated_at: nowIso
      };
    }
    sessionCache.set(phone, session);
  }
  return session;
}

export function updateSession(session: ContactSession) {
  const now = new Date().toISOString();
  session.last_message_at = now;
  session.updated_at = now;
  sessionCache.set(session.phone, session);
  // Asynchronous write-behind persistence
  setImmediate(() => {
    try {
      statements.upsertContact.run(session);
    } catch (err) {
      console.error('[SessionCache] Failed to persist session to DB:', err);
    }
  });
}

export function setBotActiveInCache(phone: string, active: number) {
  const session = getSession(phone);
  session.bot_active = active;
  sessionCache.set(phone, session);
}
