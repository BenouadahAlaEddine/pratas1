const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'notifications.db'));

const initDB = () => {
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS notifications (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      type       TEXT NOT NULL CHECK(type IN ('order','payment','promo','system','alert')),
      title      TEXT NOT NULL,
      message    TEXT NOT NULL,
      is_read    INTEGER NOT NULL DEFAULT 0,
      metadata   TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(is_read);
  `);
  console.log('✅ [Notifications DB] Initialized');
};

module.exports = { db, initDB };
