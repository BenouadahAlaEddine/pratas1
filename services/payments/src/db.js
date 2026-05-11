const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'payments.db'));

const initDB = () => {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS payments (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id        INTEGER NOT NULL UNIQUE,
      user_id         INTEGER NOT NULL,
      amount          REAL NOT NULL CHECK(amount > 0),
      currency        TEXT NOT NULL DEFAULT 'USD',
      status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending','processing','completed','failed','refunded')),
      method          TEXT NOT NULL DEFAULT 'card'
                        CHECK(method IN ('card','paypal','bank_transfer','crypto')),
      transaction_ref TEXT UNIQUE,
      card_last4      TEXT,
      card_brand      TEXT,
      failure_reason  TEXT,
      processed_at    TEXT,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  `);
  console.log('✅ [Payments DB] Initialized');
};

module.exports = { db, initDB };
