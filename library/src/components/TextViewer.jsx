import { useEffect, useState } from 'react'

export default function TextViewer({ url, title, onClose }) {
  const [text, setText] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(`/api/proxy/text?url=${encodeURIComponent(url)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load')
        return r.text()
      })
      .then((t) => {
        setText(t)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [url])

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
    <div className="text-viewer-overlay">
      <div className="pdf-viewer-bar">
        <span className="pdf-viewer-title">{title}</span>
        <div className="pdf-viewer-actions">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="pdf-viewer-open-btn"
          >
            ↗ Open in new tab
          </a>
          <button className="pdf-viewer-close" onClick={onClose} aria-label="Close viewer">
            ✕
          </button>
        </div>
      </div>

      <div className="text-viewer-body">
        {loading && <p className="text-viewer-status">Loading…</p>}
        {error && (
          <p className="text-viewer-status">
            Could not load the file.{' '}
            <a href={url} target="_blank" rel="noopener noreferrer">
              Open directly ↗
            </a>
          </p>
        )}
        {text && <pre className="text-viewer-content">{text}</pre>}
      </div>
    </div>
  )
}
