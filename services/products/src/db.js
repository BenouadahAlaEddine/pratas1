const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'products.db'));

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', icon: '💻' },
  { name: 'Clothing', slug: 'clothing', icon: '👕' },
  { name: 'Books', slug: 'books', icon: '📚' },
  { name: 'Home & Garden', slug: 'home-garden', icon: '🏡' },
  { name: 'Sports', slug: 'sports', icon: '⚽' },
  { name: 'Beauty', slug: 'beauty', icon: '💄' },
];

const SAMPLE_PRODUCTS = [
  { name: 'MacBook Pro 16"', description: 'Powerful laptop with M3 Pro chip, 18GB RAM, 512GB SSD', price: 2499.99, stock: 25, category_slug: 'electronics', image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', sku: 'ELEC-MBP16-001' },
  { name: 'iPhone 15 Pro', description: 'Latest iPhone with titanium frame and A17 Pro chip', price: 1199.99, stock: 50, category_slug: 'electronics', image_url: 'https://images.unsplash.com/photo-1592910147752-a97b2bf56b7c?w=400', sku: 'ELEC-IP15P-001' },
  { name: 'Sony WH-1000XM5', description: 'Industry-leading noise cancelling wireless headphones', price: 349.99, stock: 100, category_slug: 'electronics', image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', sku: 'ELEC-SONY-001' },
  { name: 'Nike Air Max 270', description: 'Iconic Air cushioning for all-day comfort', price: 129.99, stock: 200, category_slug: 'clothing', image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', sku: 'CLTH-NAM270-001' },
  { name: 'Adidas Ultraboost 23', description: 'Responsive running shoes with Boost midsole', price: 179.99, stock: 150, category_slug: 'clothing', image_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400', sku: 'CLTH-AUB23-001' },
  { name: 'The Pragmatic Programmer', description: '20th Anniversary Edition - Classic software engineering book', price: 49.99, stock: 500, category_slug: 'books', image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400', sku: 'BOOK-TPP-001' },
  { name: 'Clean Code', description: 'A Handbook of Agile Software Craftsmanship by Robert C. Martin', price: 44.99, stock: 400, category_slug: 'books', image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', sku: 'BOOK-CC-001' },
  { name: 'Dyson V15 Detect', description: 'Most powerful cordless vacuum with laser dust detection', price: 699.99, stock: 30, category_slug: 'home-garden', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', sku: 'HOME-DV15-001' },
  { name: 'Yoga Mat Premium', description: 'Non-slip eco-friendly yoga mat 6mm thick', price: 79.99, stock: 300, category_slug: 'sports', image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', sku: 'SPRT-YM-001' },
  { name: 'La Mer Moisturizing Cream', description: 'Legendary moisturizer with legendary healing Miracle Broth', price: 189.99, stock: 75, category_slug: 'beauty', image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400', sku: 'BEAU-LM-001' },
  { name: 'Samsung 4K Smart TV 65"', description: 'QLED 4K Smart TV with Neo Quantum Processor', price: 1499.99, stock: 20, category_slug: 'electronics', image_url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400', sku: 'ELEC-SAM65-001' },
  { name: 'Levi\'s 501 Original Jeans', description: 'Classic straight leg jeans - the original since 1873', price: 69.99, stock: 500, category_slug: 'clothing', image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', sku: 'CLTH-LV501-001' },
];

const initDB = () => {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      slug       TEXT NOT NULL UNIQUE,
      icon       TEXT DEFAULT '📦',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT,
      price       REAL NOT NULL CHECK(price >= 0),
      stock       INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
      sku         TEXT UNIQUE,
      image_url   TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
  `);

  // Seed categories
  const insertCat = db.prepare(`INSERT OR IGNORE INTO categories (name, slug, icon) VALUES (?, ?, ?)`);
  CATEGORIES.forEach(c => insertCat.run(c.name, c.slug, c.icon));

  // Seed products
  const getCategory = db.prepare(`SELECT id FROM categories WHERE slug = ?`);
  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products (name, description, price, stock, category_id, image_url, sku)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  SAMPLE_PRODUCTS.forEach(p => {
    const cat = getCategory.get(p.category_slug);
    if (cat) insertProduct.run(p.name, p.description, p.price, p.stock, cat.id, p.image_url, p.sku);
  });

  console.log('✅ [Products DB] Initialized with seed data');
};

module.exports = { db, initDB };
