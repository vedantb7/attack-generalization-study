/** @type {import('tailwindcss').Config} */
const withAlpha = (v) => `color-mix(in srgb, var(${v}) calc(<alpha-value> * 100%), transparent)`;

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

        // Semantic CSS variable tokens. color-mix keeps Tailwind opacity modifiers
        // (e.g. bg-surface-card/60) working with theme variables.
        surface: {
          bg: withAlpha('--color-bg'),
          card: withAlpha('--color-surface'),
          elevated: withAlpha('--color-surface-elevated'),
          border: withAlpha('--color-border'),
        },
        content: {
          primary: withAlpha('--color-text-primary'),
          secondary: withAlpha('--color-text-secondary'),
          muted: withAlpha('--color-text-muted'),
        },
        accent: {
          primary: withAlpha('--color-accent-primary'),
          hover: withAlpha('--color-accent-hover'),
          soft: 'var(--color-accent-soft)',
          border: 'var(--color-accent-border)',
        },
        'on-accent': withAlpha('--color-on-accent'),
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
