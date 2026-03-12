import { useState, useEffect, useRef } from 'react'

const DEBOUNCE_MS = 300

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  // Fetch autocomplete suggestions as the user types
  useEffect(() => {
    clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setSuggestions([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
        setActiveSuggestion(-1)
      } catch {
        setSuggestions([])
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  function submit(value) {
    const q = value ?? query
    if (!q.trim()) return
    setQuery(q)
    setShowSuggestions(false)
    setSuggestions([])
    onSearch(q)
  }

  function handleKeyDown(e) {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') submit()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestion((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeSuggestion >= 0) {
        submit(suggestions[activeSuggestion].title)
      } else {
        submit()
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="search-bar" role="search">
      <div className="search-input-wrap">
        <input
          ref={inputRef}
          type="search"
          placeholder="Search books, authors, topics…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          aria-label="Search books"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
        />
        <button
          className="search-btn"
          onClick={() => submit()}
          disabled={loading}
          aria-label="Search"
        >
          {loading ? <Spinner /> : <SearchIcon />}
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions" role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={`${s.source}-${i}`}
              role="option"
              aria-selected={i === activeSuggestion}
              className={i === activeSuggestion ? 'active' : ''}
              onMouseDown={() => submit(s.title)}
            >
              <span className="suggestion-title">{s.title}</span>
              {s.author && <span className="suggestion-author">{s.author}</span>}
              <span className={`source-badge source-${s.source}`}>{s.source}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function Spinner() {
  return <span className="spinner" aria-hidden="true" />
}
