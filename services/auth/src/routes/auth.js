const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');

const router = express.Router();

const JWT_SECRET        = process.env.JWT_SECRET        || 'shopwave-super-secret-jwt-key-2024';
const JWT_EXPIRES_IN    = process.env.JWT_EXPIRES_IN    || '15m';
const REFRESH_SECRET    = process.env.REFRESH_SECRET    || 'shopwave-refresh-secret-2024';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';

// Helpers
const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken  = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
};

const saveRefreshToken = (userId, token) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`)
    .run(userId, token, expiresAt);
};

// ─── POST /register ────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const result = db.prepare(
      `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`
    ).run(name.trim(), email.toLowerCase(), passwordHash);

    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    const { accessToken, refreshToken } = generateTokens(user);
    saveRefreshToken(user.id, refreshToken);

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /login ───────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user);
    saveRefreshToken(user.id, refreshToken);

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /refresh ─────────────────────────────────────────────────────────────
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

    const stored = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(refreshToken);
    if (!stored) return res.status(401).json({ error: 'Refresh token not found' });
    if (new Date(stored.expires_at) < new Date()) {
      db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(stored.id);
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(stored.id);
    saveRefreshToken(user.id, newRefreshToken);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ─── GET /me ───────────────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?').get(Number(userId));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// ─── PUT /me ───────────────────────────────────────────────────────────────────
router.put('/me', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { name, avatar, password } = req.body;
    const updates = [];
    const params = [];
    if (name)   { updates.push('name = ?');   params.push(name.trim()); }
    if (avatar) { updates.push('avatar = ?'); params.push(avatar); }
    if (password) {
      if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
      updates.push('password_hash = ?');
      params.push(await bcrypt.hash(password, 12));
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    updates.push("updated_at = datetime('now')");
    params.push(Number(userId));
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const user = db.prepare('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?').get(Number(userId));
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /users (admin only) ───────────────────────────────────────────────────
router.get('/users', (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?').all(Number(limit), Number(offset));
  const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  res.json({ users, total, page: Number(page), limit: Number(limit) });
});

// ─── POST /logout ──────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
