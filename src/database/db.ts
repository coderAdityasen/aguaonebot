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

// Ensure columns exist in SQLite database if upgraded from previous schema
try {
  const existingCols = db.pragma('table_info(contacts)') as any[];
  const colSet = new Set(existingCols.map((c) => c.name));
  if (!colSet.has('brand')) db.exec("ALTER TABLE contacts ADD COLUMN brand TEXT DEFAULT ''");
  if (!colSet.has('firm_name')) db.exec("ALTER TABLE contacts ADD COLUMN firm_name TEXT DEFAULT ''");
  if (!colSet.has('import_license')) db.exec("ALTER TABLE contacts ADD COLUMN import_license TEXT DEFAULT ''");
  if (!colSet.has('import_experience')) db.exec("ALTER TABLE contacts ADD COLUMN import_experience TEXT DEFAULT ''");
  if (!colSet.has('pan_registration')) db.exec("ALTER TABLE contacts ADD COLUMN pan_registration TEXT DEFAULT ''");
  if (!colSet.has('gst_status')) db.exec("ALTER TABLE contacts ADD COLUMN gst_status TEXT DEFAULT ''");
} catch (e) {
  console.warn('[DB Migration Warning]:', e);
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
      (@filter = 'qualified' AND qualified = 1) OR
      (@filter = 'aguaone' AND LOWER(brand) = 'aguaone') OR
      (@filter = 'flovax' AND LOWER(brand) = 'flovax')
    ORDER BY last_message_at DESC
  `),

  upsertContact: db.prepare(`
    INSERT INTO contacts (
      phone, name, brand, state, lead_status, bot_active, 
      city, category, shop_status, experience, opportunity, budget, 
      firm_name, import_license, import_experience, pan_registration, gst_status,
      qualified, unread_count, last_message, last_message_at, updated_at
    ) VALUES (
      @phone, @name, @brand, @state, @lead_status, @bot_active,
      @city, @category, @shop_status, @experience, @opportunity, @budget,
      @firm_name, @import_license, @import_experience, @pan_registration, @gst_status,
      @qualified, @unread_count, @last_message, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT(phone) DO UPDATE SET
      name = CASE WHEN excluded.name != 'Customer' THEN excluded.name ELSE contacts.name END,
      brand = CASE WHEN excluded.brand != '' THEN excluded.brand ELSE contacts.brand END,
      state = excluded.state,
      lead_status = excluded.lead_status,
      bot_active = excluded.bot_active,
      city = excluded.city,
      category = excluded.category,
      shop_status = excluded.shop_status,
      experience = excluded.experience,
      opportunity = excluded.opportunity,
      budget = excluded.budget,
      firm_name = excluded.firm_name,
      import_license = excluded.import_license,
      import_experience = excluded.import_experience,
      pan_registration = excluded.pan_registration,
      gst_status = excluded.gst_status,
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
    SELECT phone, name, brand, city, shop_status, experience, opportunity, budget, firm_name, import_license, import_experience, pan_registration, gst_status, lead_status, bot_active, created_at, updated_at
    FROM contacts
    WHERE qualified = 1 OR lead_status = 'HANDOFF'
    ORDER BY updated_at DESC
  `),

  getAllLeadsForExport: db.prepare(`
    SELECT phone, name, brand, city, shop_status, experience, opportunity, budget, firm_name, import_license, import_experience, pan_registration, gst_status, lead_status, bot_active, created_at, updated_at
    FROM contacts
    ORDER BY updated_at DESC
  `),

  getSetting: db.prepare('SELECT value FROM settings WHERE key = ?'),
  setSetting: db.prepare(`
    INSERT INTO settings (key, value, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `)
};
