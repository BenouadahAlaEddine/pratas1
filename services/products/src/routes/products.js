const express = require('express');
const { db } = require('../db');

const router = express.Router();

// ─── GET / (list products) ────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    let { search, category, min_price, max_price, page = 1, limit = 12, sort = 'created_at', order = 'desc' } = req.query;
    page = Math.max(1, Number(page));
    limit = Math.min(50, Math.max(1, Number(limit)));
    const offset = (page - 1) * limit;

    const allowed_sorts = ['name', 'price', 'created_at', 'stock'];
    const sortCol = allowed_sorts.includes(sort) ? sort : 'created_at';
    const sortDir = order === 'asc' ? 'ASC' : 'DESC';

    let where = 'p.is_active = 1';
    const params = [];

    if (search) { where += ` AND (p.name LIKE ? OR p.description LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    if (category) { where += ` AND c.slug = ?`; params.push(category); }
    if (min_price) { where += ` AND p.price >= ?`; params.push(Number(min_price)); }
    if (max_price) { where += ` AND p.price <= ?`; params.push(Number(max_price)); }

    const products = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${where} ORDER BY p.${sortCol} ${sortDir} LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE ${where}
    `).get(...params).count;

    res.json({ products, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /categories ───────────────────────────────────────────────────────────
router.get('/categories', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
    GROUP BY c.id ORDER BY c.name
  `).all();
  res.json({ categories });
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ? AND p.is_active = 1
  `).get(Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
});

// ─── POST / (admin) ────────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  try {
    const { name, description, price, stock, category_id, image_url, sku } = req.body;
    if (!name || price === undefined) return res.status(400).json({ error: 'name and price are required' });
    const result = db.prepare(`
      INSERT INTO products (name, description, price, stock, category_id, image_url, sku)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, description || '', Number(price), Number(stock) || 0, category_id || null, image_url || null, sku || null);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ product });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'SKU already exists' });
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /:id (admin) ─────────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  try {
    const { name, description, price, stock, category_id, image_url, sku, is_active } = req.body;
    const fields = [];
    const values = [];
    if (name !== undefined)        { fields.push('name = ?');        values.push(name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (price !== undefined)       { fields.push('price = ?');       values.push(Number(price)); }
    if (stock !== undefined)       { fields.push('stock = ?');       values.push(Number(stock)); }
    if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id); }
    if (image_url !== undefined)   { fields.push('image_url = ?');   values.push(image_url); }
    if (sku !== undefined)         { fields.push('sku = ?');         values.push(sku); }
    if (is_active !== undefined)   { fields.push('is_active = ?');   values.push(is_active ? 1 : 0); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    fields.push("updated_at = datetime('now')");
    values.push(Number(req.params.id));
    db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id));
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /:id (admin) ──────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  db.prepare('UPDATE products SET is_active = 0, updated_at = datetime(\'now\') WHERE id = ?').run(Number(req.params.id));
  res.json({ message: 'Product deactivated successfully' });
});

module.exports = router;
