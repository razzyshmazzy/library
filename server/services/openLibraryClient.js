const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://openlibrary.org';
const COVERS_URL = 'https://covers.openlibrary.org/b';

// Minimum delay between requests to be respectful of the public API
const RATE_LIMIT_MS = parseInt(process.env.OPENLIB_RATE_LIMIT_MS, 10) || 500;

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
 * Normalises a raw Open Library search doc into the shared Book shape.
 */
function normaliseBook(doc) {
  const coverId = doc.cover_i || (doc.cover_edition_key ? null : null);
  const coverUrl = coverId
    ? `${COVERS_URL}/id/${coverId}-M.jpg`
    : null;

  const olid = doc.key ? doc.key.replace('/works/', '') : null;

  return {
    id: olid || doc.edition_key?.[0] || null,
    source: 'openLibrary',
    title: doc.title || '',
    author: doc.author_name?.[0] || doc.author?.[0] || '',
    isbn: doc.isbn?.[0] || '',
    description: doc.first_sentence?.value || doc.first_sentence || '',
    coverUrl,
    publishedDate: doc.first_publish_year ? `${doc.first_publish_year}` : '',
    category: doc.subject?.[0] || '',
    pdfUrl: null, // resolved separately via Internet Archive
    downloadFormats: [],
    language: doc.language?.[0] || 'en',
    pages: doc.number_of_pages_median || null,
    rating: null,
    publicDomain: false, // Open Library doesn't surface this in search
  };
}

/**
 * Full-text search. Returns an array of normalised Book objects.
 */
async function search(query, { page = 1, limit = 20, fields } = {}) {
  await throttle();

  const defaultFields = [
    'key', 'title', 'author_name', 'first_publish_year',
    'cover_i', 'isbn', 'subject', 'language', 'number_of_pages_median',
    'first_sentence', 'edition_key',
  ];

  const params = {
    q: query,
    page,
    limit,
    fields: (fields || defaultFields).join(','),
  };

  logger.debug(`[OpenLibrary] search: ${query}, page=${page}`);

  try {
    const { data } = await axios.get(`${BASE_URL}/search.json`, {
      params,
      timeout: 8000,
    });

    return {
      total: data.numFound || 0,
      results: (data.docs || []).map(normaliseBook),
    };
  } catch (err) {
    logger.error(`[OpenLibrary] search failed: ${err.message}`);
    throw err;
  }
}

/**
 * Autocomplete suggestions using the simpler /search/title endpoint.
 */
async function suggestions(query) {
  await throttle();

  logger.debug(`[OpenLibrary] suggestions: ${query}`);

  try {
    const { data } = await axios.get(`${BASE_URL}/search.json`, {
      params: { q: query, limit: 10, fields: 'title,author_name,key' },
      timeout: 5000,
    });

    return (data.docs || []).map((doc) => ({
      title: doc.title,
      author: doc.author_name?.[0] || '',
      source: 'openLibrary',
    }));
  } catch (err) {
    logger.error(`[OpenLibrary] suggestions failed: ${err.message}`);
    throw err;
  }
}

/**
 * Fetch full metadata for a single work by its Open Library ID (e.g. "OL45804W").
 */
async function getBook(olid) {
  await throttle();

  logger.debug(`[OpenLibrary] getBook: ${olid}`);

  try {
    const { data } = await axios.get(`${BASE_URL}/works/${olid}.json`, { timeout: 8000 });

    const description =
      typeof data.description === 'string'
        ? data.description
        : data.description?.value || '';

    const coverId = data.covers?.[0];
    const coverUrl = coverId ? `${COVERS_URL}/id/${coverId}-L.jpg` : null;

    return {
      id: olid,
      source: 'openLibrary',
      title: data.title || '',
      author: '',  // author refs require separate calls; callers may enrich
      isbn: '',
      description,
      coverUrl,
      publishedDate: data.created?.value?.split('T')[0] || '',
      category: data.subjects?.[0] || '',
      pdfUrl: null,
      downloadFormats: [],
      language: 'en',
      pages: null,
      rating: null,
      publicDomain: false,
    };
  } catch (err) {
    logger.error(`[OpenLibrary] getBook failed for ${olid}: ${err.message}`);
    throw err;
  }
}

module.exports = { search, suggestions, getBook };
