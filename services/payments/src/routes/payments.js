const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');

const router = express.Router();

const NOTIFICATIONS_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3005';

const notifyUser = async (userId, type, title, message, metadata = {}) => {
  try {
    const axios = require('axios');
    await axios.post(`${NOTIFICATIONS_URL}/internal/send`, { userId, type, title, message, metadata });
  } catch (err) {
    console.warn('[Payments] Could not send notification:', err.message);
  }
};

// Simulate card brands
const detectCardBrand = (number) => {
  if (!number) return 'Unknown';
  const n = String(number).replace(/\s/g, '');
  if (n.startsWith('4')) return 'Visa';
  if (n.startsWith('5')) return 'Mastercard';
  if (n.startsWith('3')) return 'American Express';
  return 'Unknown';
};

// ─── POST / (process payment) ─────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { order_id, amount, method = 'card', card_number, currency = 'USD' } = req.body;

  if (!order_id || !amount) return res.status(400).json({ error: 'order_id and amount are required' });

  // Check if already paid
  const existing = db.prepare('SELECT * FROM payments WHERE order_id = ? AND status = ?').get(Number(order_id), 'completed');
  if (existing) return res.status(409).json({ error: 'Order already paid', payment: existing });

  // Simulate payment processing (90% success rate)
  await new Promise(r => setTimeout(r, 500 + Math.random() * 1000)); // Simulate processing delay

  const success = Math.random() > 0.1;
  const transactionRef = `TXN-${uuidv4().toUpperCase().slice(0, 12)}`;
  const card_last4 = card_number ? String(card_number).replace(/\s/g, '').slice(-4) : null;
  const card_brand = card_number ? detectCardBrand(card_number) : null;

  if (success) {
    const result = db.prepare(`
      INSERT INTO payments (order_id, user_id, amount, currency, status, method, transaction_ref, card_last4, card_brand, processed_at)
      VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, ?, datetime('now'))
    `).run(Number(order_id), Number(userId), Number(amount), currency, method, transactionRef, card_last4, card_brand);

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);
    await notifyUser(Number(userId), 'payment', '💳 Payment Successful!',
      `Payment of $${Number(amount).toFixed(2)} for order #${order_id} was successful. Ref: ${transactionRef}`,
      { orderId: order_id, transactionRef });

    res.status(201).json({ payment, message: 'Payment processed successfully' });
  } else {
    const reason = 'Card declined by issuing bank';
    const result = db.prepare(`
      INSERT INTO payments (order_id, user_id, amount, currency, status, method, transaction_ref, card_last4, card_brand, failure_reason)
      VALUES (?, ?, ?, ?, 'failed', ?, ?, ?, ?, ?)
    `).run(Number(order_id), Number(userId), Number(amount), currency, method, transactionRef, card_last4, card_brand, reason);

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);
    await notifyUser(Number(userId), 'payment', '❌ Payment Failed',
      `Payment for order #${order_id} failed: ${reason}`,
      { orderId: order_id });

    res.status(402).json({ payment, error: reason });
  }
});

// ─── GET /:orderId ────────────────────────────────────────────────────────────
router.get('/:orderId', (req, res) => {
  const userId = req.headers['x-user-id'];
  const role   = req.headers['x-user-role'];
  const payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(Number(req.params.orderId));
  if (!payment) return res.status(404).json({ error: 'Payment not found for this order' });
  if (role !== 'admin' && String(payment.user_id) !== String(userId))
    return res.status(403).json({ error: 'Forbidden' });
  res.json({ payment });
});

// ─── POST /:orderId/refund (admin) ────────────────────────────────────────────
router.post('/:orderId/refund', async (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const payment = db.prepare("SELECT * FROM payments WHERE order_id = ? AND status = 'completed'").get(Number(req.params.orderId));
  if (!payment) return res.status(404).json({ error: 'No completed payment found for this order' });

  db.prepare(`UPDATE payments SET status = 'refunded', updated_at = datetime('now') WHERE id = ?`).run(payment.id);
  await notifyUser(payment.user_id, 'payment', '💰 Refund Processed',
    `A refund of $${payment.amount.toFixed(2)} for order #${payment.order_id} has been initiated.`,
    { orderId: payment.order_id });

  res.json({ message: 'Refund processed', payment: { ...payment, status: 'refunded' } });
});

// ─── GET /admin/all (admin) ───────────────────────────────────────────────────
router.get('/admin/all', (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const payments = db.prepare('SELECT * FROM payments ORDER BY created_at DESC LIMIT ? OFFSET ?').all(Number(limit), Number(offset));
  const stats = {
    total_completed: db.prepare("SELECT SUM(amount) as s FROM payments WHERE status = 'completed'").get().s || 0,
    total_refunded:  db.prepare("SELECT SUM(amount) as s FROM payments WHERE status = 'refunded'").get().s || 0,
    count_by_status: db.prepare('SELECT status, COUNT(*) as count FROM payments GROUP BY status').all(),
  };
  res.json({ payments, stats });
});

module.exports = router;
