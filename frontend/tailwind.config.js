/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#040b16',
        foreground: '#f8fafc',
        primary: '#2563eb', // blue-600
        secondary: '#1e3a8a', // blue-900
      }
    },
  },
  plugins: [],
}
