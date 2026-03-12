const axios = require('axios');
const internetArchive = require('../services/internetArchiveClient');
const logger = require('../utils/logger');

/**
 * GET /api/pdfs/download/:bookId?format=pdf&source=internetArchive
 *
 * Resolves the PDF URL for the requested book and either:
 *  - Redirects the client directly to the file (default), or
 *  - Streams the file through the server when ?stream=true
 *
 * Streaming adds latency but avoids exposing raw upstream URLs to the client.
 * For the MVP we default to redirect, which is faster and simpler.
 */
async function downloadPdf(req, res, next) {
  const { bookId } = req.params;
  const { source = 'internetArchive', format = 'pdf', stream = 'false' } = req.query;

  logger.debug(`[pdfController] download ${bookId} as ${format} from ${source}`);

  try {
    let pdfUrl = null;

    if (source === 'internetArchive') {
      // Resolve the exact PDF file URL from IA metadata
      pdfUrl = await internetArchive.resolvePdfUrl(bookId);
    } else {
      // For other sources the caller should supply the URL directly via bookId
      // (e.g. Google Books webReaderLink stored in book.pdfUrl)
      return res.status(400).json({
        error: {
          message: `Direct PDF download is only supported for source=internetArchive. ` +
                   `For other sources, use the pdfUrl field from the book detail endpoint.`,
          status: 400,
        },
      });
    }

    if (!pdfUrl) {
      return res.status(404).json({
        error: { message: `No PDF found for book "${bookId}" in ${source}`, status: 404 },
      });
    }

    if (stream === 'true') {
      // Stream the file through the server
      logger.debug(`[pdfController] streaming ${pdfUrl}`);
      const upstream = await axios.get(pdfUrl, {
        responseType: 'stream',
        timeout: 30000,
      });

      res.setHeader('Content-Type', upstream.headers['content-type'] || 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${bookId}.${format}"`
      );

      if (upstream.headers['content-length']) {
        res.setHeader('Content-Length', upstream.headers['content-length']);
      }

      upstream.data.pipe(res);
    } else {
      // Simply redirect — faster, no server bandwidth used
      logger.debug(`[pdfController] redirecting to ${pdfUrl}`);
      return res.redirect(302, pdfUrl);
    }
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/pdfs/convert
 * Placeholder for future format conversion (EPUB/TXT).
 */
async function convertPdf(req, res) {
  return res.status(501).json({
    error: {
      message: 'Format conversion is not yet implemented.',
      status: 501,
    },
  });
}

module.exports = { downloadPdf, convertPdf };
