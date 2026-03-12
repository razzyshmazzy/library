const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for the /api/search routes.
 * Prevents clients from flooding the server (and downstream APIs) with requests.
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests, please try again later.', status: 429 } },
});

/**
 * Rate limiter for heavy endpoints (book details, PDF downloads).
 */
const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests, please try again later.', status: 429 } },
});

module.exports = { searchLimiter, heavyLimiter };
