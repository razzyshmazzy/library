const openLibrary = require('../services/openLibraryClient');
const internetArchive = require('../services/internetArchiveClient');
const googleBooks = require('../services/googleBooksClient');
const { deduplicateBooks, rankBooks, parallelSearch } = require('../services/pdfAggregator');
const { filterAdultContent } = require('../utils/contentFilter');
const logger = require('../utils/logger');

// Map URL parameter names to service objects
const SOURCES = {
  openLibrary,
  internetArchive,
  googleBooks,
};

/**
 * Parses the `databases` query param into an array of valid source keys.
 * `databases=all` (or omitting the param) returns all three sources.
 */
function parseDatabases(raw) {
  if (!raw || raw === 'all') return Object.keys(SOURCES);
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => SOURCES[s]);
}

/**
 * GET /api/search/suggestions?q=...&databases=...
 * Returns top 10 autocomplete suggestions merged from selected APIs.
 */
async function getSuggestions(req, res, next) {
  const { q, databases } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({ suggestions: [] });
  }

  const sources = parseDatabases(databases);
  logger.debug(`[searchController] suggestions for "${q}" from [${sources.join(', ')}]`);

  try {
    const fns = sources.map((key) => () => SOURCES[key].suggestions(q));
    const settled = await Promise.allSettled(fns.map((fn) => fn()));

    const suggestions = [];
    for (const outcome of settled) {
      if (outcome.status === 'fulfilled') {
        suggestions.push(...outcome.value);
      }
    }

    // Strip adult suggestions, then deduplicate by title
    const safeSuggestions = suggestions.filter(s => {
      const { books } = filterAdultContent([{ title: s.title, category: '', description: '' }]);
      return books.length > 0;
    });

    const seen = new Set();
    const unique = safeSuggestions.filter(({ title }) => {
      const key = title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return res.json({ suggestions: unique.slice(0, 10) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/search/results?q=...&category=...&databases=...&page=1&limit=20
 * Aggregates, deduplicates, and ranks results from selected APIs.
 */
async function getResults(req, res, next) {
  const { q, category, databases, page = '1', limit = '20' } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: { message: 'Query parameter "q" is required', status: 400 } });
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const sources = parseDatabases(databases);

  logger.debug(
    `[searchController] results for "${q}" from [${sources.join(', ')}], page=${pageNum}, limit=${limitNum}`
  );

  const startMs = Date.now();

  try {
    // Query all selected sources in parallel
    const fns = sources.map((key) => () =>
      SOURCES[key].search(q, { page: pageNum, limit: limitNum })
    );

    const { results: raw, totals, errors } = await parallelSearch(fns);

    // Strip adult content before any further processing
    const { books: safe, removed } = filterAdultContent(raw);
    if (removed > 0) logger.debug(`[searchController] filtered ${removed} adult content result(s)`);

    // Optionally filter by category
    const filtered = category
      ? safe.filter((b) => b.category?.toLowerCase().includes(category.toLowerCase()))
      : safe;

    const deduped = deduplicateBooks(filtered);
    const ranked = rankBooks(deduped);

    return res.json({
      total: totals.reduce((a, b) => a + b, 0),
      page: pageNum,
      limit: limitNum,
      results: ranked,
      aggregatedFrom: sources,
      errors: errors.length ? errors : undefined,
      timeMs: Date.now() - startMs,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSuggestions, getResults };
