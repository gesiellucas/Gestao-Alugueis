/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './views/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './contexts/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1a4fd6',
          'blue-dark': '#1440b8',
          'blue-deeper': '#0f2f8f',
          orange: '#f97316',
          'orange-light': '#fb923c',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
