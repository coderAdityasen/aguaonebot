-- Schema for AGUAONE WhatsApp Bot & Live Agent CRM

CREATE TABLE IF NOT EXISTS contacts (
    phone TEXT PRIMARY KEY,
    name TEXT DEFAULT 'Customer',
    state TEXT DEFAULT 'new',
    lead_status TEXT DEFAULT 'IN_PROGRESS',
    bot_active INTEGER DEFAULT 1,
    city TEXT DEFAULT '',
    category TEXT DEFAULT '',
    shop_status TEXT DEFAULT '',
    experience TEXT DEFAULT '',
    opportunity TEXT DEFAULT '',
    budget TEXT DEFAULT '',
    qualified INTEGER DEFAULT 0,
    unread_count INTEGER DEFAULT 0,
    last_message TEXT DEFAULT '',
    last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    whatsapp_message_id TEXT UNIQUE,
    phone TEXT NOT NULL,
    direction TEXT NOT NULL,
    sender_type TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    selected_option TEXT,
    selected_title TEXT,
    status TEXT DEFAULT 'delivered',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(phone) REFERENCES contacts(phone) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    agent_name TEXT DEFAULT 'Agent',
    note TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(phone) REFERENCES contacts(phone) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(lead_status);
CREATE INDEX IF NOT EXISTS idx_contacts_bot_active ON contacts(bot_active);
CREATE INDEX IF NOT EXISTS idx_contacts_updated ON contacts(last_message_at DESC);
