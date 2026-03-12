const openLibrary = require('../services/openLibraryClient');
const internetArchive = require('../services/internetArchiveClient');
const googleBooks = require('../services/googleBooksClient');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Simple in-memory cache: TTL 10 minutes, check every 2 minutes
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const CLIENTS = {
  openLibrary,
  internetArchive,
  googleBooks,
};

/**
 * GET /api/books/:id?source=openLibrary
 * Fetches full metadata for a single book from the specified source.
 */
async function getBook(req, res, next) {
  const { id } = req.params;
  const source = req.query.source || 'openLibrary';

  if (!CLIENTS[source]) {
    return res.status(400).json({
      error: { message: `Unknown source "${source}". Valid: ${Object.keys(CLIENTS).join(', ')}`, status: 400 },
    });
  }

  const cacheKey = `book:${source}:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.debug(`[bookController] cache hit for ${cacheKey}`);
    return res.json(cached);
  }

  logger.debug(`[bookController] fetching ${id} from ${source}`);

  try {
    const book = await CLIENTS[source].getBook(id);
    cache.set(cacheKey, book);
    return res.json(book);
  } catch (err) {
    // Surface a 404 if the client threw a 404-like error
    if (err.response?.status === 404) {
      return res.status(404).json({
        error: { message: `Book "${id}" not found in ${source}`, status: 404 },
      });
    }
    next(err);
  }
}

module.exports = { getBook };
