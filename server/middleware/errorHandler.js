const logger = require('../utils/logger');

/**
 * Global error handling middleware.
 * Catches errors thrown in route handlers and formats a JSON response.
 */
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`${req.method} ${req.path} → ${status}: ${message}`, {
    stack: err.stack,
    body: req.body,
    query: req.query,
  });

  res.status(status).json({
    error: {
      message,
      status,
      // Only expose stack trace in development
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
