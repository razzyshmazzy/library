import { useEffect, useRef, useState } from 'react'
import PDFViewer from './PDFViewer'
import TextViewer from './TextViewer'
import { isSafeCover } from '../utils/isSafeCover'

const SOURCE_LABELS = {
  openLibrary: 'Open Library',
  internetArchive: 'Internet Archive',
  googleBooks: 'Google Books',
}

export default function BookDetail({ book, onClose }) {
  const dialogRef = useRef(null)
  const [viewingPdf, setViewingPdf] = useState(false)
  const [viewingText, setViewingText] = useState(false)
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState(null)
  const [resolvedTextUrl, setResolvedTextUrl] = useState(null)
  const [resolvingFile, setResolvingFile] = useState(false)
  const [resolvedFormats, setResolvedFormats] = useState(null)
  const [noFileError, setNoFileError] = useState(false)

  async function handleRead() {
    if (book.source === 'internetArchive') {
      setResolvingFile(true)
      setNoFileError(false)
      try {
        const res = await fetch(`/api/books/${book.id}?source=internetArchive`)
        const data = await res.json()

        setResolvedFormats(data.downloadFormats || [])

        if (data.pdfUrl) {
          setResolvedPdfUrl(data.pdfUrl)
          setViewingPdf(true)
        } else if (data.textUrl) {
          setResolvedTextUrl(data.textUrl)
          setViewingText(true)
        } else {
          setNoFileError(true)
        }
      } catch {
        setNoFileError(true)
      } finally {
        setResolvingFile(false)
      }
    } else {
      setResolvedPdfUrl(book.pdfUrl)
      setViewingPdf(true)
    }
  }

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    el.focus()
    function onKeyDown(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const label = SOURCE_LABELS[book.source] || book.source
  const year = book.publishedDate ? String(book.publishedDate).slice(0, 4) : null
  const showCover = book.coverUrl && isSafeCover(book)

  const iaPageUrl = book.source === 'internetArchive'
    ? `https://archive.org/details/${book.id}`
    : null

  return (
    <>
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
              {showCover
                ? <img src={book.coverUrl} alt={`Cover of ${book.title}`} />
                : <div className="cover-placeholder large"><span>{(book.title || '?')[0].toUpperCase()}</span></div>
              }
            </div>

            <div className="modal-info">
              <h2>{book.title}</h2>
              {book.author && <p className="modal-author">{book.author}</p>}

              <div className="modal-source-row">
                <span className={`source-dot source-${book.source}`} />
                <span className={`source-label source-${book.source}`}>{label}</span>
                {book.publicDomain && <span className="modal-free-tag">Free</span>}
                {book.language && <span className="modal-lang-tag">{book.language}</span>}
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

              {noFileError ? (
                <div className="no-pdf-msg">
                  <p>No readable file available for this title.</p>
                  {resolvedFormats?.length > 0 && (
                    <p className="no-pdf-formats">
                      Available formats: {resolvedFormats.join(', ')}
                    </p>
                  )}
                  {iaPageUrl && (
                    <a
                      href={iaPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-btn secondary"
                      style={{ marginTop: 8, display: 'inline-flex' }}
                    >
                      View on Internet Archive ↗
                    </a>
                  )}
                </div>
              ) : book.pdfUrl && (
                <div className="modal-actions">
                  <button
                    className="action-btn primary"
                    onClick={handleRead}
                    disabled={resolvingFile}
                  >
                    {resolvingFile ? 'Loading…' : 'Read'}
                  </button>
                  <a
                    href={book.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn secondary"
                  >
                    Download
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {viewingPdf && resolvedPdfUrl && (
        <PDFViewer
          url={resolvedPdfUrl}
          title={book.title}
          onClose={() => setViewingPdf(false)}
        />
      )}

      {viewingText && resolvedTextUrl && (
        <TextViewer
          url={resolvedTextUrl}
          title={book.title}
          onClose={() => setViewingText(false)}
        />
      )}
    </>
  )
}
