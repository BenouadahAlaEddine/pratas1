const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'auth.db'));

const initDB = () => {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'user',
      avatar        TEXT,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token      TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
  `);

  // Create default admin user if not exists
  const bcrypt = require('bcryptjs');
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@shopwave.com');
  if (!adminExists) {
    const hash = bcrypt.hashSync('Admin@123', 12);
    db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`)
      .run('Admin', 'admin@shopwave.com', hash, 'admin');
    console.log('✅ Default admin user created: admin@shopwave.com / Admin@123');
  }

  console.log('✅ [Auth DB] Initialized');
};

module.exports = { db, initDB };
