require('dotenv').config();

const express = require('express');
const corsMiddleware = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const searchRoutes = require('./routes/search');
const bookRoutes = require('./routes/books');
const pdfRoutes = require('./routes/pdfs');
const proxyRoutes = require('./routes/proxy');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Global middleware ────────────────────────────────────────────────────────
app.use(corsMiddleware);
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/search', searchRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/pdfs', pdfRoutes);
app.use('/api/proxy', proxyRoutes);

// Health check — useful for load balancers and CI smoke tests
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Route not found', status: 404 } });
});

// ─── Error handling (must be last) ───────────────────────────────────────────
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
  logger.info('Available endpoints:');
  logger.info('  GET  /api/search/suggestions?q=...&databases=...');
  logger.info('  GET  /api/search/results?q=...&category=...&databases=...&page=1&limit=20');
  logger.info('  GET  /api/books/:id?source=openLibrary');
  logger.info('  GET  /api/pdfs/download/:bookId?format=pdf&source=internetArchive');
  logger.info('  POST /api/pdfs/convert  (501 placeholder)');
  logger.info('  GET  /health');
});

module.exports = app; // exported for testing
