const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'shopwave-super-secret-jwt-key-2024';

/**
 * JWT verification middleware for the gateway.
 * Attaches decoded user info to request headers for downstream services.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Forward user info to downstream services via headers
    req.headers['x-user-id']    = String(decoded.id);
    req.headers['x-user-email'] = decoded.email;
    req.headers['x-user-role']  = decoded.role || 'user';
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please refresh.' });
    }
    return res.status(403).json({ error: 'Invalid token.' });
  }
};

module.exports = { verifyToken };
