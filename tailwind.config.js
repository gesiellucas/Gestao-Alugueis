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
      fontFamily: {
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#004AAD',
          'blue-dark': '#003d91',
          'blue-deeper': '#003380',
          orange: '#0C4AA5',
          'orange-light': '#1a5cbf',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
