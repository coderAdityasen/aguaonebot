import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'bot.db');
export const db = new Database(dbPath);

// Low-latency performance pragmas
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('mmap_size = 268435456'); // 256MB mmap for fast memory-mapped disk reads
db.pragma('cache_size = -64000');   // 64MB in-memory SQLite page cache
db.pragma('temp_store = MEMORY');
db.pragma('foreign_keys = ON');

// Initialize database tables from schema.sql
const schemaPath = path.resolve(process.cwd(), 'src', 'database', 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

// Pre-compiled prepared statements for ultra-fast execution (<0.05ms)
export const statements = {
  getContact: db.prepare('SELECT * FROM contacts WHERE phone = ?'),
  
  getAllContacts: db.prepare(`
    SELECT * FROM contacts 
    ORDER BY last_message_at DESC
  `),

  getContactsByFilter: db.prepare(`
    SELECT * FROM contacts 
    WHERE 
      (@filter = 'all') OR
      (@filter = 'handoff' AND (lead_status = 'HANDOFF' OR qualified = 1 OR bot_active = 0)) OR
      (@filter = 'bot_active' AND bot_active = 1 AND lead_status = 'IN_PROGRESS') OR
      (@filter = 'qualified' AND qualified = 1)
    ORDER BY last_message_at DESC
  `),

  upsertContact: db.prepare(`
    INSERT INTO contacts (
      phone, name, state, lead_status, bot_active, 
      city, category, shop_status, experience, opportunity, budget, 
      qualified, unread_count, last_message, last_message_at, updated_at
    ) VALUES (
      @phone, @name, @state, @lead_status, @bot_active,
      @city, @category, @shop_status, @experience, @opportunity, @budget,
      @qualified, @unread_count, @last_message, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT(phone) DO UPDATE SET
      name = CASE WHEN excluded.name != 'Customer' THEN excluded.name ELSE contacts.name END,
      state = excluded.state,
      lead_status = excluded.lead_status,
      bot_active = excluded.bot_active,
      city = excluded.city,
      category = excluded.category,
      shop_status = excluded.shop_status,
      experience = excluded.experience,
      opportunity = excluded.opportunity,
      budget = excluded.budget,
      qualified = excluded.qualified,
      unread_count = excluded.unread_count,
      last_message = excluded.last_message,
      last_message_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `),

  updateBotStatus: db.prepare(`
    UPDATE contacts 
    SET bot_active = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE phone = ?
  `),

  updateLeadStatus: db.prepare(`
    UPDATE contacts 
    SET lead_status = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE phone = ?
  `),

  resetUnreadCount: db.prepare(`
    UPDATE contacts 
    SET unread_count = 0 
    WHERE phone = ?
  `),

  insertMessage: db.prepare(`
    INSERT INTO messages (
      whatsapp_message_id, phone, direction, sender_type, 
      message_type, content, selected_option, selected_title, status
    ) VALUES (
      @whatsapp_message_id, @phone, @direction, @sender_type,
      @message_type, @content, @selected_option, @selected_title, @status
    )
  `),

  getMessagesByPhone: db.prepare(`
    SELECT * FROM messages 
    WHERE phone = ? 
    ORDER BY timestamp ASC, id ASC
  `),

  checkDuplicateMessage: db.prepare(`
    SELECT id FROM messages 
    WHERE whatsapp_message_id = ?
  `),

  addNote: db.prepare(`
    INSERT INTO notes (phone, agent_name, note) 
    VALUES (?, ?, ?)
  `),

  getNotesByPhone: db.prepare(`
    SELECT * FROM notes 
    WHERE phone = ? 
    ORDER BY created_at DESC
  `),

  getQualifiedLeadsForExport: db.prepare(`
    SELECT phone, name, city, category, shop_status, experience, opportunity, budget, lead_status, created_at, updated_at
    FROM contacts
    WHERE qualified = 1 OR lead_status = 'HANDOFF'
    ORDER BY updated_at DESC
  `),

  getSetting: db.prepare('SELECT value FROM settings WHERE key = ?'),
  setSetting: db.prepare(`
    INSERT INTO settings (key, value, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `)
};
