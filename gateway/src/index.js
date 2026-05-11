require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { verifyToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Env Config ───────────────────────────────────────────────────────────────
const SERVICES = {
  auth:          process.env.AUTH_SERVICE_URL          || 'http://localhost:3001',
  products:      process.env.PRODUCTS_SERVICE_URL      || 'http://localhost:3002',
  orders:        process.env.ORDERS_SERVICE_URL        || 'http://localhost:3003',
  payments:      process.env.PAYMENTS_SERVICE_URL      || 'http://localhost:3004',
  notifications: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3005',
};

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] }));
app.use(morgan('combined'));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please slow down.' },
});
app.use(globalLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    gateway: 'ShopWave API Gateway v1.0',
    timestamp: new Date().toISOString(),
    services: Object.keys(SERVICES),
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'ShopWave API Gateway',
    version: '1.0.0',
    endpoints: ['/auth', '/products', '/orders', '/payments', '/notifications'],
  });
});

// ─── Proxy Helper ─────────────────────────────────────────────────────────────
const proxy = (target, pathRewrite = {}) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    on: {
      error: (err, req, res) => {
        console.error(`[Gateway] Proxy error → ${target}: ${err.message}`);
        res.status(502).json({ error: 'Service temporarily unavailable', service: target });
      },
    },
  });

// ─── Routes ───────────────────────────────────────────────────────────────────

// Auth — public routes (no JWT needed for login/register)
app.use('/auth', authLimiter, proxy(SERVICES.auth, { '^/auth': '' }));

// Products — GET routes are public; POST/PUT/DELETE require auth
app.use('/products', (req, res, next) => {
  if (req.method === 'GET') return next();
  return verifyToken(req, res, next);
}, proxy(SERVICES.products, { '^/products': '' }));

// Orders — always requires auth
app.use('/orders', verifyToken, proxy(SERVICES.orders, { '^/orders': '' }));

// Payments — always requires auth
app.use('/payments', verifyToken, proxy(SERVICES.payments, { '^/payments': '' }));

// Notifications — always requires auth
app.use('/notifications', verifyToken, proxy(SERVICES.notifications, { '^/notifications': '' }));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found on gateway.` });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 [Gateway] ShopWave API Gateway running on port ${PORT}`);
  console.log(`   Services:`, SERVICES);
});
