const axios = require('axios');
const logger = require('../utils/logger');

const SEARCH_URL = 'https://archive.org/advancedsearch.php';
const METADATA_URL = 'https://archive.org/metadata';
const DOWNLOAD_URL = 'https://archive.org/download';

const RATE_LIMIT_MS = parseInt(process.env.INTERNET_ARCHIVE_RATE_LIMIT_MS, 10) || 500;

let lastRequestTime = 0;

async function throttle() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Derives available download formats from an IA item's file list.
 * Returns { pdfUrl, downloadFormats, publicDomain }
 */
function resolveFormats(identifier, files = []) {
  const formats = [];
  let pdfUrl = null;
  let textUrl = null;

  for (const file of files) {
    const name = (file.name || '').toLowerCase();
    if (name.endsWith('.pdf')) {
      formats.push('pdf');
      if (!pdfUrl) pdfUrl = `${DOWNLOAD_URL}/${identifier}/${encodeURIComponent(file.name)}`;
    } else if (name.endsWith('.epub')) {
      formats.push('epub');
    } else if (name.endsWith('.txt')) {
      formats.push('txt');
      if (!textUrl) textUrl = `${DOWNLOAD_URL}/${identifier}/${encodeURIComponent(file.name)}`;
    }
  }

  return {
    pdfUrl,
    textUrl,
    downloadFormats: [...new Set(formats)],
    publicDomain: true,
  };
}

/**
 * Normalises a raw IA search result into the shared Book shape.
 */
function normaliseBook(doc) {
  const identifier = doc.identifier || '';
  const coverUrl = identifier
    ? `https://archive.org/services/img/${identifier}`
    : null;

  return {
    id: identifier,
    source: 'internetArchive',
    title: doc.title || '',
    author: Array.isArray(doc.creator) ? doc.creator[0] : doc.creator || '',
    isbn: doc.isbn || '',
    description: doc.description
      ? Array.isArray(doc.description)
        ? doc.description[0]
        : doc.description
      : '',
    coverUrl,
    publishedDate: doc.year || doc.date || '',
    category: Array.isArray(doc.subject) ? doc.subject[0] : doc.subject || '',
    pdfUrl: identifier ? `${DOWNLOAD_URL}/${identifier}` : null,
    downloadFormats: ['pdf'], // assume PDF; confirmed on detail fetch
    language: Array.isArray(doc.language) ? doc.language[0] : doc.language || 'en',
    pages: doc.imagecount ? parseInt(doc.imagecount, 10) : null,
    rating: null,
    publicDomain: true,
  };
}

/**
 * Search Internet Archive for books (mediatype:texts).
 */
async function search(query, { page = 1, limit = 20 } = {}) {
  await throttle();

  logger.debug(`[InternetArchive] search: ${query}, page=${page}`);

  const params = {
    q: `(${query}) AND mediatype:texts AND -mediatype:collection`,
    fl: ['identifier', 'title', 'creator', 'description', 'subject',
         'year', 'date', 'language', 'imagecount', 'isbn'].join(','),
    rows: limit,
    page,
    output: 'json',
    sort: 'downloads desc',
  };

  try {
    const { data } = await axios.get(SEARCH_URL, { params, timeout: 8000 });
    const docs = data?.response?.docs || [];
    const total = data?.response?.numFound || 0;

    return {
      total,
      results: docs.map(normaliseBook),
    };
  } catch (err) {
    logger.error(`[InternetArchive] search failed: ${err.message}`);
    throw err;
  }
}

/**
 * Autocomplete suggestions — reuses search but returns slim objects.
 */
async function suggestions(query) {
  const { results } = await search(query, { limit: 10 });
  return results.map(({ title, author }) => ({ title, author, source: 'internetArchive' }));
}

/**
 * Fetch full metadata for a single item by its IA identifier.
 */
async function getBook(identifier) {
  await throttle();

  logger.debug(`[InternetArchive] getBook: ${identifier}`);

  try {
    const { data } = await axios.get(`${METADATA_URL}/${identifier}`, { timeout: 8000 });
    const meta = data?.metadata || {};
    const files = data?.files || [];
    const { pdfUrl, textUrl, downloadFormats, publicDomain } = resolveFormats(identifier, files);

    const coverUrl = `https://archive.org/services/img/${identifier}`;

    return {
      id: identifier,
      source: 'internetArchive',
      title: Array.isArray(meta.title) ? meta.title[0] : meta.title || '',
      author: Array.isArray(meta.creator) ? meta.creator[0] : meta.creator || '',
      isbn: Array.isArray(meta.isbn) ? meta.isbn[0] : meta.isbn || '',
      description: Array.isArray(meta.description) ? meta.description[0] : meta.description || '',
      coverUrl,
      publishedDate: meta.date || meta.year || '',
      category: Array.isArray(meta.subject) ? meta.subject[0] : meta.subject || '',
      pdfUrl,
      textUrl,
      downloadFormats,
      language: Array.isArray(meta.language) ? meta.language[0] : meta.language || 'en',
      pages: meta.imagecount ? parseInt(meta.imagecount, 10) : null,
      rating: null,
      publicDomain,
    };
  } catch (err) {
    logger.error(`[InternetArchive] getBook failed for ${identifier}: ${err.message}`);
    throw err;
  }
}

/**
 * Resolve the direct PDF URL for an IA identifier.
 * Used when we only have a search result and need the actual file link.
 */
async function resolvePdfUrl(identifier) {
  await throttle();

  try {
    const { data } = await axios.get(`${METADATA_URL}/${identifier}`, { timeout: 8000 });
    const files = data?.files || [];
    const { pdfUrl } = resolveFormats(identifier, files);
    return pdfUrl;
  } catch (err) {
    logger.error(`[InternetArchive] resolvePdfUrl failed for ${identifier}: ${err.message}`);
    return null;
  }
}

module.exports = { search, suggestions, getBook, resolvePdfUrl };
