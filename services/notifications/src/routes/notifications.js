const express = require('express');
const { db } = require('../db');

const router = express.Router();

// ─── GET / (user notifications) ───────────────────────────────────────────────
router.get('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const { page = 1, limit = 20, unread_only } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let where = `user_id = ${Number(userId)}`;
  if (unread_only === 'true') where += ' AND is_read = 0';

  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(Number(limit), Number(offset));
  const unread_count = db.prepare(`SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0`).get(Number(userId)).c;
  const total = db.prepare(`SELECT COUNT(*) as c FROM notifications WHERE ${where}`).get().c;

  res.json({ notifications, total, unread_count, page: Number(page), limit: Number(limit) });
});

// ─── PUT /:id/read ─────────────────────────────────────────────────────────────
router.put('/:id/read', (req, res) => {
  const userId = req.headers['x-user-id'];
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(Number(req.params.id), Number(userId));
  res.json({ message: 'Notification marked as read' });
});

// ─── PUT /read-all ─────────────────────────────────────────────────────────────
router.put('/read-all', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(Number(userId));
  res.json({ message: 'All notifications marked as read' });
});

// ─── DELETE /clear ─────────────────────────────────────────────────────────────
router.delete('/clear', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  db.prepare('DELETE FROM notifications WHERE user_id = ?').run(Number(userId));
  res.json({ message: 'All notifications cleared' });
});

// ─── POST /internal/send (internal use — from other services) ─────────────────
router.post('/internal/send', (req, res) => {
  const { userId, type, title, message, metadata } = req.body;
  if (!userId || !type || !title || !message)
    return res.status(400).json({ error: 'userId, type, title, message required' });

  const result = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).run(Number(userId), type, title, message, JSON.stringify(metadata || {}));

  console.log(`🔔 [Notification] → User ${userId}: [${type}] ${title}`);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Notification sent' });
});

module.exports = router;
