import { isSafeCover } from '../utils/isSafeCover'
import { GlowingEffect } from './ui/GlowingEffect'

const SOURCE_LABELS = {
  openLibrary: 'Open Library',
  internetArchive: 'Internet Archive',
  googleBooks: 'Google Books',
}

export default function BookCard({ book, view = 'grid', onClick }) {
  const year = book.publishedDate ? String(book.publishedDate).slice(0, 4) : null
  const showCover = book.coverUrl && isSafeCover(book)

  if (view === 'list') {
    return (
      <article
        className="book-list-item"
        onClick={() => onClick(book)}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick(book)}
        role="button"
        aria-label={`View details for ${book.title}`}
      >
        <GlowingEffect spread={30} proximity={64} inactiveZone={0.01} borderWidth={2} />

        <div className="list-cover">
          {showCover
            ? <img src={book.coverUrl} alt="" loading="lazy" />
            : <div className="cover-placeholder" aria-hidden="true"><span>{(book.title || '?')[0].toUpperCase()}</span></div>
          }
        </div>

        <div className="list-info">
          <span className="list-title">{book.title}</span>
          {book.author && <span className="list-author">{book.author}</span>}
          <div className="list-meta">
            <span className={`source-dot source-${book.source}`} title={SOURCE_LABELS[book.source]} />
            <span className={`source-label source-${book.source}`}>{SOURCE_LABELS[book.source]}</span>
            {year && <span className="meta-year">{year}</span>}
            {book.pages && <span className="meta-pages">{book.pages} pp</span>}
            {book.rating && (
              <span className="meta-rating" title={`${book.rating}/5`}>
                {'★'.repeat(Math.round(book.rating))}
              </span>
            )}
            {book.pdfUrl && <span className="pdf-badge" style={{position:'static'}}>PDF</span>}
            {book.publicDomain && <span className="pd-badge" style={{position:'static'}}>Free</span>}
          </div>
          {book.description && <p className="list-desc">{book.description}</p>}
        </div>
      </article>
    )
  }

  return (
    <article
      className="book-card"
      onClick={() => onClick(book)}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(book)}
      role="button"
      aria-label={`View details for ${book.title}`}
    >
      <GlowingEffect spread={30} proximity={64} inactiveZone={0.01} borderWidth={2} />

      <div className="book-cover">
        {showCover
          ? <img src={book.coverUrl} alt="" loading="lazy" />
          : <div className="cover-placeholder" aria-hidden="true"><span>{(book.title || '?')[0].toUpperCase()}</span></div>
        }
        {book.pdfUrl && <span className="pdf-badge">PDF</span>}
        {book.publicDomain && <span className="pd-badge">Free</span>}
      </div>

      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        {book.author && <p className="book-author">{book.author}</p>}
        <div className="book-footer">
          <span className={`source-dot source-${book.source}`} title={SOURCE_LABELS[book.source]} />
          {year && <span className="meta-year">{year}</span>}
          {book.rating && (
            <span className="meta-rating" title={`${book.rating}/5`}>
              {'★'.repeat(Math.round(book.rating))}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
