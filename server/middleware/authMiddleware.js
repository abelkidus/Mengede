const jwt = require('jsonwebtoken');

/**
 * Middleware to extract the Bearer token from the Authorization header
 * and verify it using jsonwebtoken and process.env.JWT_SECRET.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access denied. No Bearer token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access denied. Token is missing.',
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not configured in environment variables.');
    return res.status(500).json({
      error: 'Server authentication configuration error.',
    });
  }

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({
        error: 'Forbidden. Token has expired.',
      });
    }
    return res.status(403).json({
      error: 'Forbidden. Invalid token.',
    });
  }
}

authMiddleware.authMiddleware = authMiddleware;
authMiddleware.requireAuth = authMiddleware;
module.exports = authMiddleware;
module.exports.requireAuth = authMiddleware;
