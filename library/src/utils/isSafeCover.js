const ADULT_TERMS = [
  'erotic', 'erotica', 'nude', 'nudity', 'naked', 'pornograph',
  'adult fiction', 'explicit', 'sexual content', 'sex scenes',
]

/**
 * Returns false if the book's category or description contains adult-content
 * keywords, so we suppress the cover image and show the placeholder instead.
 */
export function isSafeCover(book) {
  const haystack = [book.category, book.description, book.title]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return !ADULT_TERMS.some((term) => haystack.includes(term))
}
