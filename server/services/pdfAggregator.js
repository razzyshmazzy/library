const logger = require('../utils/logger');

/**
 * Deduplicates a flat array of Book objects.
 *
 * Strategy (in priority order):
 *  1. Exact ISBN match → keep the entry with the most fields populated.
 *  2. Exact (case-insensitive) title + author match → same rule.
 *
 * Books with no ISBN and no author are never deduplicated (too ambiguous).
 */
function deduplicateBooks(books) {
  const seen = new Map(); // key → index in `result`
  const result = [];

  for (const book of books) {
    const isbnKey = book.isbn ? `isbn:${book.isbn.trim()}` : null;
    const titleKey =
      book.title && book.author
        ? `title:${book.title.toLowerCase().trim()}|${book.author.toLowerCase().trim()}`
        : null;

    const key = isbnKey || titleKey;

    if (!key) {
      result.push(book);
      continue;
    }

    if (seen.has(key)) {
      // Merge: keep the richer entry
      const idx = seen.get(key);
      result[idx] = mergeBooks(result[idx], book);
    } else {
      seen.set(key, result.length);
      result.push({ ...book });
    }
  }

  return result;
}

/**
 * Merges two Book objects representing the same work.
 * Prefers non-null / non-empty values; prefers pdfUrl availability.
 */
function mergeBooks(a, b) {
  const pick = (va, vb) => (va != null && va !== '' ? va : vb);

  return {
    ...a,
    title: pick(a.title, b.title),
    author: pick(a.author, b.author),
    isbn: pick(a.isbn, b.isbn),
    description: pick(a.description, b.description),
    coverUrl: pick(a.coverUrl, b.coverUrl),
    publishedDate: pick(a.publishedDate, b.publishedDate),
    category: pick(a.category, b.category),
    pdfUrl: pick(a.pdfUrl, b.pdfUrl),
    downloadFormats: [...new Set([...a.downloadFormats, ...b.downloadFormats])],
    language: pick(a.language, b.language),
    pages: pick(a.pages, b.pages),
    rating: pick(a.rating, b.rating),
    publicDomain: a.publicDomain || b.publicDomain,
    // Track all sources this book was found in
    sources: [...new Set([a.source, b.source, ...(a.sources || []), ...(b.sources || [])])],
  };
}

/**
 * Ranks books by a composite score:
 *  - +3 if pdfUrl is available
 *  - +2 if publicDomain
 *  - +1 per download format
 *  - +0–5 from rating (normalised)
 *  - +1 if description is present
 *  - +1 if coverUrl is present
 */
function rankBooks(books) {
  return books
    .map((book) => {
      let score = 0;
      if (book.pdfUrl) score += 3;
      if (book.publicDomain) score += 2;
      score += (book.downloadFormats || []).length;
      if (book.rating) score += book.rating; // 0–5
      if (book.description) score += 1;
      if (book.coverUrl) score += 1;
      return { book, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ book }) => book);
}

/**
 * Runs multiple async search functions in parallel.
 * If one fails, logs the error and continues with the successful results.
 *
 * @param {Array<() => Promise<{total, results}>>} fns - Array of search thunks
 * @returns {Promise<{results: Book[], totals: number[], errors: string[]}>}
 */
async function parallelSearch(fns) {
  const settled = await Promise.allSettled(fns.map((fn) => fn()));

  const results = [];
  const totals = [];
  const errors = [];

  for (const outcome of settled) {
    if (outcome.status === 'fulfilled') {
      totals.push(outcome.value.total || 0);
      results.push(...(outcome.value.results || []));
    } else {
      logger.warn(`[pdfAggregator] One source failed: ${outcome.reason?.message}`);
      errors.push(outcome.reason?.message || 'Unknown error');
    }
  }

  return { results, totals, errors };
}

module.exports = { deduplicateBooks, rankBooks, parallelSearch };
