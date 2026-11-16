/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="navy"]'],
  theme: {
    extend: {
      colors: {
        // Burgundy + Ivory palette
        burgundy: {
          deep: '#541C32',
          dark: '#351321',
          rose: '#B77C88',
        },
        ivory: {
          warm: '#F6F0E6',
          soft: '#EAE0D2',
        },
        charcoal: '#282326',
        mutedgrey: '#827A79',

        // Midnight Navy + Champagne palette
        navy: {
          midnight: '#111C2C',
          deep: '#18283C',
          blue: '#829AB5',
          slate: '#9CA9B7',
        },
        champagne: '#E9D9B8',
        cream: '#F3EDE1',

        // Semantic CSS variable tokens
        surface: {
          bg: 'var(--color-bg)',
          card: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
          border: 'var(--color-border)',
        },
        content: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        accent: {
          primary: 'var(--color-accent-primary)',
          hover: 'var(--color-accent-hover)',
          soft: 'var(--color-accent-soft)',
          border: 'var(--color-accent-border)',
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'Cambria', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
