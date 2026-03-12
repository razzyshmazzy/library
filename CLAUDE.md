# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Architecture

React 19 + Vite 8 single-page app.

- `index.html` → `src/main.jsx` → `src/App.jsx`
- `src/index.css` — global styles and CSS variables (light/dark theme via `prefers-color-scheme`)
- `src/App.css` — component-scoped styles using CSS nesting

ESLint uses the flat config format (`eslint.config.js`) with react-hooks and react-refresh plugins.
