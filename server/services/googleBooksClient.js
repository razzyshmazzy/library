const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://www.googleapis.com/books/v1';
const RATE_LIMIT_MS = parseInt(process.env.GOOGLE_BOOKS_RATE_LIMIT_MS, 10) || 1000;

let lastRequestTime = 0;

async function throttle() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

function getApiKey() {
  return process.env.GOOGLE_BOOKS_API_KEY || null;
}

/**
 * Normalises a Google Books volume into the shared Book shape.
 */
function normaliseBook(volume) {
  const info = volume.volumeInfo || {};
  const access = volume.accessInfo || {};

  const isbn =
    info.industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier ||
    info.industryIdentifiers?.find((i) => i.type === 'ISBN_10')?.identifier ||
    '';

  // Prefer higher-res cover (replace zoom=1 with zoom=2)
  const rawCover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null;
  const coverUrl = rawCover ? rawCover.replace('zoom=1', 'zoom=2').replace('http:', 'https:') : null;

  const pdfAvailable = access.pdf?.isAvailable;
  const pdfUrl = pdfAvailable ? (access.pdf.downloadLink || access.webReaderLink || null) : null;

  const formats = [];
  if (pdfAvailable) formats.push('pdf');
  if (access.epub?.isAvailable) formats.push('epub');

  const accessibility = access.viewability; // e.g. "PARTIAL", "ALL_PAGES", "NO_PAGES"
  const publicDomain = access.publicDomain === true;

  return {
    id: volume.id,
    source: 'googleBooks',
    title: info.title || '',
    author: info.authors?.[0] || '',
    isbn,
    description: info.description || '',
    coverUrl,
    publishedDate: info.publishedDate || '',
    category: info.categories?.[0] || info.mainCategory || '',
    pdfUrl,
    downloadFormats: formats,
    language: info.language || 'en',
    pages: info.pageCount || null,
    rating: info.averageRating || null,
    publicDomain,
    _accessibility: accessibility, // internal; stripped by aggregator if needed
  };
}

/**
 * Search Google Books volumes.
 */
async function search(query, { page = 1, limit = 20 } = {}) {
  await throttle();

  logger.debug(`[GoogleBooks] search: ${query}, page=${page}`);

  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'your_key_here') {
    logger.warn('[GoogleBooks] No API key set — skipping Google Books search');
    return { total: 0, results: [] };
  }

  const startIndex = (page - 1) * limit;

  try {
    const { data } = await axios.get(`${BASE_URL}/volumes`, {
      params: { q: query, startIndex, maxResults: limit, key: apiKey },
      timeout: 8000,
    });

    return {
      total: data.totalItems || 0,
      results: (data.items || []).map(normaliseBook),
    };
  } catch (err) {
    logger.error(`[GoogleBooks] search failed: ${err.message}`);
    throw err;
  }
}

/**
 * Autocomplete suggestions.
 */
async function suggestions(query) {
  try {
    const { results } = await search(query, { limit: 10 });
    return results.map(({ title, author }) => ({ title, author, source: 'googleBooks' }));
  } catch {
    return [];
  }
}

/**
 * Fetch a single volume by its Google Books ID.
 */
async function getBook(volumeId) {
  await throttle();

  logger.debug(`[GoogleBooks] getBook: ${volumeId}`);

  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'your_key_here') {
    const err = new Error('Google Books API key not configured');
    err.status = 503;
    throw err;
  }

  try {
    const { data } = await axios.get(`${BASE_URL}/volumes/${volumeId}`, {
      params: { key: apiKey },
      timeout: 8000,
    });
    return normaliseBook(data);
  } catch (err) {
    logger.error(`[GoogleBooks] getBook failed for ${volumeId}: ${err.message}`);
    throw err;
  }
}

module.exports = { search, suggestions, getBook };
