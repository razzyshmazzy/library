/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        background: 'var(--bg)',
        muted: 'var(--bg-2)',
        foreground: 'var(--text-h)',
        'muted-foreground': 'var(--text)',
      },
      borderRadius: {
        inherit: 'inherit',
      },
    },
  },
  plugins: [],
}
