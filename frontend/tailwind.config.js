/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        monsoon: {
          blue: '#1677B8',
          'blue-hover': '#0F5F91',
          'blue-dark': '#38A9E0',
          aqua: '#21B6B7',
          'aqua-dark': '#2DD4BF',
          navy: '#102A43',
          'storm-bg': '#071923',
          'storm-surface': '#0D2530',
        },
        navy: {
          900: '#0b132b',
          800: '#1c2541',
          700: '#3a506b',
          600: '#5bc0be',
        },
        fortress: {
          green: '#22c55e',
          yellow: '#fbbf24',
          red: '#ef4444',
          blue: '#1677b8',
          dark: '#071923'
        }
      }
    },
  },
  plugins: [],
}
