const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'orders.db'));

const initDB = () => {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS orders (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL,
      status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
      total_amount    REAL NOT NULL DEFAULT 0,
      shipping_address TEXT,
      notes           TEXT,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id   INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_sku  TEXT,
      quantity     INTEGER NOT NULL CHECK(quantity > 0),
      unit_price   REAL NOT NULL CHECK(unit_price >= 0),
      total_price  REAL NOT NULL CHECK(total_price >= 0)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  `);
  console.log('✅ [Orders DB] Initialized');
};

module.exports = { db, initDB };
