import { useState, useCallback } from 'react'
import SearchBar from './components/SearchBar'
import BookCard from './components/BookCard'
import BookDetail from './components/BookDetail'
import './App.css'

const LIMIT = 20

const ALL_SOURCES = ['openLibrary', 'internetArchive', 'googleBooks']

const SOURCE_LABELS = {
  openLibrary: 'Open Library',
  internetArchive: 'Internet Archive',
  googleBooks: 'Google Books',
}

export default function App() {
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedBook, setSelectedBook] = useState(null)
  const [sources, setSources] = useState(ALL_SOURCES)
  const [category, setCategory] = useState('')
  const [aggregatedFrom, setAggregatedFrom] = useState([])

  async function fetchResults(q, pageNum = 1, activeSources = sources, cat = category) {
    if (!q.trim()) return
    setLoading(true)
    setError(null)

    const dbParam = activeSources.length === ALL_SOURCES.length ? 'all' : activeSources.join(',')
    const params = new URLSearchParams({
      q,
      page: pageNum,
      limit: LIMIT,
      databases: dbParam,
      ...(cat && { category: cat }),
    })

    try {
      const res = await fetch(`/api/search/results?${params}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error?.message || 'Search failed')

      setResults(data.results || [])
      setTotal(data.total || 0)
      setAggregatedFrom(data.aggregatedFrom || [])
      setPage(pageNum)
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback((q) => {
    setQuery(q)
    setPage(1)
    fetchResults(q, 1)
  }, [sources, category])

  function toggleSource(src) {
    setSources((prev) => {
      const next = prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
      // Don't allow deselecting all
      return next.length === 0 ? prev : next
    })
  }

  function handlePageChange(newPage) {
    fetchResults(query, newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.ceil(total / LIMIT)
  const hasResults = results.length > 0

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <h1 className="app-title">
            <span className="title-icon">📚</span>
            Library
          </h1>
          <p className="app-subtitle">Search millions of books across Open Library, Internet Archive &amp; Google Books</p>
        </div>
      </header>

      <main className="app-main">
        <div className="search-section">
          <SearchBar onSearch={handleSearch} loading={loading} />

          <div className="filters">
            <div className="source-filters">
              {ALL_SOURCES.map((src) => (
                <button
                  key={src}
                  className={`filter-btn source-filter source-${src} ${sources.includes(src) ? 'active' : ''}`}
                  onClick={() => toggleSource(src)}
                  aria-pressed={sources.includes(src)}
                >
                  {SOURCE_LABELS[src]}
                </button>
              ))}
            </div>

            <input
              className="category-input"
              type="text"
              placeholder="Filter by category…"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && query && handleSearch(query)}
            />
          </div>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {loading && !hasResults && (
          <div className="loading-state">
            <div className="loading-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="book-card skeleton" />
              ))}
            </div>
          </div>
        )}

        {!loading && hasResults && (
          <>
            <div className="results-header">
              <p className="results-count">
                {total.toLocaleString()} results
                {aggregatedFrom.length > 0 && (
                  <span className="aggregated-from"> from {aggregatedFrom.map(s => SOURCE_LABELS[s]).join(', ')}</span>
                )}
              </p>
            </div>

            <div className="book-grid">
              {results.map((book, i) => (
                <BookCard
                  key={`${book.source}-${book.id}-${i}`}
                  book={book}
                  onClick={setSelectedBook}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
            )}
          </>
        )}

        {!loading && !hasResults && !error && query && (
          <div className="empty-state">
            <p>No results found for <strong>"{query}"</strong></p>
            <p className="empty-hint">Try different keywords or enable more sources.</p>
          </div>
        )}

        {!query && !loading && (
          <div className="welcome-state">
            <p>Search for any book, author, or topic to get started.</p>
          </div>
        )}
      </main>

      {selectedBook && (
        <BookDetail book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  )
}

function Pagination({ page, totalPages, onChange }) {
  const pages = buildPageRange(page, totalPages)

  return (
    <nav className="pagination" aria-label="Search results pages">
      <button
        className="page-btn"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ←
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`page-btn ${p === page ? 'active' : ''}`}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        className="page-btn"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        →
      </button>
    </nav>
  )
}

function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total]
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}
