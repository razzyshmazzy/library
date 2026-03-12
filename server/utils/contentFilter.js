/**
 * Server-side adult content filter.
 * Applied to every book before it leaves the API — nothing gets through to
 * the frontend unless it passes this check.
 */

const ADULT_TERMS = [
  // Explicit genre / subject tags
  'erotica', 'erotic fiction', 'erotic literature', 'erotic novel',
  'erotic stories', 'erotic romance', 'erotic art', 'erotic photography',
  'adult fiction', 'adult comics', 'adult content',
  'pornograph', 'pornographic',
  'hentai', 'xxx', 'nsfw',
  // Physical / visual
  'nude', 'nudity', 'nudism', 'naked', 'nudes (photography)',
  'topless', 'pin-up', 'pinup', 'pin up photography', 'cheesecake photography',
  // Sexual / fetish subjects
  'fetish', 'bondage', 'bdsm', 'sadomasoch',
  'sexual content', 'sex scenes', 'sexually explicit',
  'human sexuality -- explicit',
  // Known adult publications
  'playboy', 'penthouse magazine', 'hustler magazine', 'centerfold',
  // Smut / pulp tags
  'smut', 'dirty romance', 'steamy romance',
  'forbidden romance -- explicit',
];

/**
 * Returns true if the book should be shown, false if it should be filtered out.
 * Checks title, category, and description.
 */
function isAllowed(book) {
  const haystack = [book.title, book.category, book.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return !ADULT_TERMS.some((term) => haystack.includes(term));
}

/**
 * Filters an array of books, removing adult content.
 */
function filterAdultContent(books) {
  const before = books.length;
  const clean = books.filter(isAllowed);
  const removed = before - clean.length;
  return { books: clean, removed };
}

module.exports = { filterAdultContent };
