/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        shopee: {
          50: '#fff5f1',
          100: '#ffe8e0',
          200: '#ffd0c2',
          300: '#ffab94',
          400: '#ff7754',
          500: '#ee4d2d', // Official Shopee Orange
          600: '#dc3513',
          700: '#b8270b',
          800: '#94220d',
          900: '#7a2010',
        },
      },
    },
  },
  plugins: [],
};
