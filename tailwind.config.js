/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // enable dark mode via .dark class on html/body
  theme: {
    extend: {
      colors: {
        body: 'var(--body-color)',
        border: 'var(--border-color)',
        text: 'var(--text-color)',
        subtext: 'var(--subtext-color)',
        highlight: 'var(--highlight-color)',
        highlightPressed: 'var(--highlight-pressed-color)',
        primary: 'var(--color-primary, #1f9bef)',
        brand: {
          primary: '#1f9bef',
          secondary: '#202e4a',
        },
        button: {
          primary: {
            bg: '#1f9bef',
            text: '#ffffff',
          },
        },
        hamburger: 'var(--hamburger-color)',
        hamburgerLine: 'var(--text-color)',
        like: {
          DEFAULT: '#03b97c',
          hover: 'var(--like-hover)',
          active: 'var(--like-active)',
        },
        comment: {
          DEFAULT: 'magenta',
          hover: 'var(--comment-hover)',
          active: 'var(--comment-active)',
        },
      },
    },
  },
  plugins: [],
}
