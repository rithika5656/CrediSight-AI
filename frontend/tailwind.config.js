/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8F0F8',
          100: '#C5D9ED',
          200: '#8AB0DA',
          300: '#5A8ABF',
          400: '#2A5490',
          500: '#1A3A6B',
          600: '#132E55',
          700: '#0E2A55',
          800: '#0A1F44',
          900: '#091A38',
          950: '#06111F',
        },
      },
    },
  },
  plugins: [],
};
