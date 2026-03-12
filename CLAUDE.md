# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Structure

```
library/          ← React + Vite frontend (port 5173)
server/           ← Express backend API (port 5001)
package.json      ← Root scripts to run both together
```

## Commands

Run both servers together from the repo root:
```bash
npm run dev           # Starts backend (port 5001) + frontend (port 5173) concurrently
npm run install:all   # Install dependencies for both server/ and library/
```

Or individually:
```bash
cd server  && npm run dev   # Backend only (nodemon)
cd library && npm run dev   # Frontend only (proxies /api → localhost:5001)
cd library && npm run build
cd library && npm run lint
```

## Architecture

### Frontend (`library/`)
React 19 + Vite 8 SPA. Entry: `src/main.jsx` → `src/App.jsx`.

- `src/components/SearchBar.jsx` — debounced autocomplete, keyboard nav
- `src/components/BookCard.jsx` — book grid card with cover/badges
- `src/components/BookDetail.jsx` — modal with metadata and download links
- `src/index.css` — CSS variables, dark mode (`prefers-color-scheme`)
- `src/App.css` — all component styles (CSS nesting)
- `vite.config.js` — proxies `/api` to `localhost:5001`

### Backend (`server/`)
Express server aggregating Open Library, Internet Archive, and Google Books APIs.

- `services/` — one client per API + `pdfAggregator.js` (dedup/rank logic)
- `controllers/` — business logic (parallel fetch, cache, PDF resolution)
- `routes/` — thin Express routers wired to controllers
- `middleware/` — CORS, rate limiting, global error handler
- `utils/logger.js` — Winston logger

Key flow for search: `GET /api/search/results` → `searchController` → `parallelSearch()` across selected sources → `deduplicateBooks()` → `rankBooks()` → JSON response.

Google Books requires `GOOGLE_BOOKS_API_KEY` in `server/.env`; it silently returns 0 results without one.
