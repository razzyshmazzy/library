import { useEffect, useRef } from 'react'

const SOURCE_LABELS = {
  openLibrary: 'Open Library',
  internetArchive: 'Internet Archive',
  googleBooks: 'Google Books',
}

export default function BookDetail({ book, onClose }) {
  const dialogRef = useRef(null)

  // Trap focus and close on Escape
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    el.focus()

    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const label = SOURCE_LABELS[book.source] || book.source
  const year = book.publishedDate ? String(book.publishedDate).slice(0, 4) : null

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={book.title}
        ref={dialogRef}
        tabIndex={-1}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="modal-body">
          <div className="modal-cover">
            {book.coverUrl
              ? <img src={book.coverUrl} alt={`Cover of ${book.title}`} />
              : <div className="cover-placeholder large"><span>{(book.title || '?')[0].toUpperCase()}</span></div>
            }
          </div>

          <div className="modal-info">
            <h2>{book.title}</h2>
            {book.author && <p className="modal-author">by {book.author}</p>}

            <div className="modal-badges">
              <span className={`source-badge source-${book.source}`}>{label}</span>
              {book.publicDomain && <span className="pd-badge">Public Domain</span>}
              {book.language && <span className="lang-badge">{book.language.toUpperCase()}</span>}
            </div>

            <dl className="modal-meta">
              {year && <><dt>Published</dt><dd>{year}</dd></>}
              {book.pages && <><dt>Pages</dt><dd>{book.pages}</dd></>}
              {book.category && <><dt>Category</dt><dd>{book.category}</dd></>}
              {book.isbn && <><dt>ISBN</dt><dd>{book.isbn}</dd></>}
              {book.rating && <><dt>Rating</dt><dd>{'★'.repeat(Math.round(book.rating))} {book.rating}/5</dd></>}
            </dl>

            {book.description && (
              <p className="modal-description">{book.description}</p>
            )}

            {(book.pdfUrl || (book.downloadFormats && book.downloadFormats.length > 0)) && (
              <div className="modal-downloads">
                <h3>Download</h3>
                <div className="download-buttons">
                  {book.pdfUrl && (
                    <a
                      href={book.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="download-btn pdf"
                    >
                      PDF
                    </a>
                  )}
                  {book.downloadFormats?.includes('epub') && (
                    <span className="download-btn epub unavailable" title="Coming soon">EPUB</span>
                  )}
                  {book.downloadFormats?.includes('txt') && (
                    <span className="download-btn txt unavailable" title="Coming soon">TXT</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
