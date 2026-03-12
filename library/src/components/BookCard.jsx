const SOURCE_LABELS = {
  openLibrary: 'Open Library',
  internetArchive: 'Internet Archive',
  googleBooks: 'Google Books',
}

export default function BookCard({ book, onClick }) {
  const label = SOURCE_LABELS[book.source] || book.source

  return (
    <article className="book-card" onClick={() => onClick(book)} tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(book)}
      role="button" aria-label={`View details for ${book.title}`}
    >
      <div className="book-cover">
        {book.coverUrl
          ? <img src={book.coverUrl} alt={`Cover of ${book.title}`} loading="lazy" />
          : <CoverPlaceholder title={book.title} />
        }
        {book.pdfUrl && <span className="pdf-badge" title="PDF available">PDF</span>}
        {book.publicDomain && <span className="pd-badge" title="Public domain">Free</span>}
      </div>

      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        {book.author && <p className="book-author">{book.author}</p>}
        <div className="book-meta">
          {book.publishedDate && (
            <span className="meta-year">{String(book.publishedDate).slice(0, 4)}</span>
          )}
          {book.pages && <span className="meta-pages">{book.pages} pp</span>}
          {book.rating && (
            <span className="meta-rating" title={`${book.rating}/5`}>
              {'★'.repeat(Math.round(book.rating))}{'☆'.repeat(5 - Math.round(book.rating))}
            </span>
          )}
        </div>
        <span className={`source-badge source-${book.source}`}>{label}</span>
      </div>
    </article>
  )
}

function CoverPlaceholder({ title }) {
  // Use the first letter of the title as a placeholder
  const letter = (title || '?')[0].toUpperCase()
  return (
    <div className="cover-placeholder" aria-hidden="true">
      <span>{letter}</span>
    </div>
  )
}
