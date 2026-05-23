// Base URL for the backend API.
// - Local dev: leave VITE_API_BASE unset; calls stay relative (`/api/...`)
//   and Vite's proxy forwards them to localhost:5001.
// - Production (e.g. GitHub Pages): set VITE_API_BASE to your hosted backend
//   origin, e.g. https://library-api.example.com — calls become
//   `https://library-api.example.com/api/...`.
export const API_BASE = import.meta.env.VITE_API_BASE ?? ''
