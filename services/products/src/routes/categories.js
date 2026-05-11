const express = require('express');
const { db } = require('../db');

const router = express.Router();

// GET /categories
router.get('/', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
    GROUP BY c.id ORDER BY c.name
  `).all();
  res.json({ categories });
});

// POST /categories (admin)
router.post('/', (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const { name, slug, icon } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' });
  try {
    const result = db.prepare('INSERT INTO categories (name, slug, icon) VALUES (?, ?, ?)').run(name, slug, icon || '📦');
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ category });
  } catch (e) {
    res.status(409).json({ error: 'Category slug already exists' });
  }
});

module.exports = router;
