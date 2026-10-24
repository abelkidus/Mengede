const rateLimit = require('express-rate-limit');

/**
 * 1. Global Rate Limiter:
 * 100 requests per 15 minutes per IP for all /api routes.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again in 15 minutes.',
  },
});

/**
 * 2. Login Rate Limiter:
 * Strict 5 attempts per 15 minutes per IP specifically for POST /api/admin/login.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.',
  },
});

/**
 * 3. Submission Rate Limiter:
 * 10 requests per hour per IP for POST /api/routes to prevent crowdsourced spam.
 */
const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many route submissions from this IP. Please try again in an hour.',
  },
});

module.exports = {
  globalLimiter,
  loginLimiter,
  submissionLimiter,
};
