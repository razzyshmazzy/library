import { useEffect } from 'react'

export default function PDFViewer({ url, title, onClose }) {
  // Close on Escape (takes priority over the book detail modal's handler)
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [onClose])

  return (
    <div className="pdf-viewer-overlay">
      <div className="pdf-viewer-bar">
        <span className="pdf-viewer-title">{title}</span>
        <div className="pdf-viewer-actions">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="pdf-viewer-open-btn"
            title="Open in new tab"
          >
            ↗ Open in new tab
          </a>
          <button className="pdf-viewer-close" onClick={onClose} aria-label="Close PDF viewer">
            ✕
          </button>
        </div>
      </div>
      <iframe
        src={url}
        title={`PDF: ${title}`}
        className="pdf-iframe"
        allowFullScreen
      />
    </div>
  )
}
