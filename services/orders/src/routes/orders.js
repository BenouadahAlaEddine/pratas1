const express = require('express');
const axios = require('axios');
const { db } = require('../db');

const router = express.Router();

const PRODUCTS_URL      = process.env.PRODUCTS_SERVICE_URL      || 'http://localhost:3002';
const NOTIFICATIONS_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3005';

const notifyUser = async (userId, type, title, message, metadata = {}) => {
  try {
    await axios.post(`${NOTIFICATIONS_URL}/internal/send`, { userId, type, title, message, metadata });
  } catch (err) {
    console.warn('[Orders] Could not send notification:', err.message);
  }
};

// ─── GET / (my orders) ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  const role   = req.headers['x-user-role'];
  const { page = 1, limit = 10, status } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let where = role === 'admin' ? '1=1' : `o.user_id = ${Number(userId)}`;
  const params = [];
  if (status) { where += ` AND o.status = ?`; params.push(status); }

  const orders = db.prepare(`
    SELECT o.* FROM orders o WHERE ${where}
    ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, Number(limit), Number(offset));

  const total = db.prepare(`SELECT COUNT(*) as count FROM orders o WHERE ${where}`).get(...params).count;

  const ordersWithItems = orders.map(order => ({
    ...order,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id),
  }));

  res.json({ orders: ordersWithItems, total, page: Number(page), limit: Number(limit) });
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const userId = req.headers['x-user-id'];
  const role   = req.headers['x-user-role'];
  const order  = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (role !== 'admin' && String(order.user_id) !== String(userId))
    return res.status(403).json({ error: 'Forbidden' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ order: { ...order, items } });
});

// ─── POST / (create order) ────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { items, shipping_address, notes } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'items array is required and must not be empty' });

  try {
    // Fetch product info and validate stock
    const enrichedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const { data } = await axios.get(`${PRODUCTS_URL}/${item.product_id}`);
      const product = data.product;
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

      const totalPrice = product.price * item.quantity;
      enrichedItems.push({
        product_id:   product.id,
        product_name: product.name,
        product_sku:  product.sku,
        quantity:     item.quantity,
        unit_price:   product.price,
        total_price:  totalPrice,
      });
      totalAmount += totalPrice;
    }

    // Create order in transaction
    const createOrder = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO orders (user_id, total_amount, shipping_address, notes, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).run(Number(userId), totalAmount, shipping_address || '', notes || '');

      const orderId = result.lastInsertRowid;
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      enrichedItems.forEach(item =>
        insertItem.run(orderId, item.product_id, item.product_name, item.product_sku, item.quantity, item.unit_price, item.total_price)
      );
      return orderId;
    });

    const orderId = createOrder();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    await notifyUser(Number(userId), 'order', '🛒 Order Placed!',
      `Your order #${orderId} has been placed successfully. Total: $${totalAmount.toFixed(2)}`,
      { orderId });

    res.status(201).json({ order: { ...order, items: orderItems } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── PUT /:id/cancel ──────────────────────────────────────────────────────────
router.put('/:id/cancel', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const order  = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (String(order.user_id) !== String(userId)) return res.status(403).json({ error: 'Forbidden' });
  if (!['pending', 'confirmed'].includes(order.status))
    return res.status(400).json({ error: `Cannot cancel order in '${order.status}' status` });

  db.prepare(`UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`).run(order.id);
  await notifyUser(Number(userId), 'order', '❌ Order Cancelled', `Order #${order.id} has been cancelled.`, { orderId: order.id });
  res.json({ message: 'Order cancelled', order: { ...order, status: 'cancelled' } });
});

// ─── PUT /:id/status (admin) ──────────────────────────────────────────────────
router.put('/:id/status', async (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: `Invalid status. Allowed: ${validStatuses.join(', ')}` });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });

  db.prepare(`UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, order.id);

  const statusEmojis = { confirmed: '✅', processing: '⚙️', shipped: '🚚', delivered: '🎉', cancelled: '❌' };
  await notifyUser(order.user_id, 'order', `${statusEmojis[status] || '📦'} Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    `Your order #${order.id} is now ${status}.`, { orderId: order.id });

  res.json({ message: `Order status updated to ${status}`, order: { ...order, status } });
});

// ─── GET /stats (admin) ───────────────────────────────────────────────────────
router.get('/admin/stats', (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const stats = {
    total_orders:   db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    pending_orders: db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get().c,
    total_revenue:  db.prepare("SELECT SUM(total_amount) as s FROM orders WHERE status NOT IN ('cancelled')").get().s || 0,
    by_status:      db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all(),
  };
  res.json({ stats });
});

module.exports = router;
