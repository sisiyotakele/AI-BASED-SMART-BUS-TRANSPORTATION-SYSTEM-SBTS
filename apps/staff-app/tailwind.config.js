/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // ← THIS IS REQUIRED for dark mode to work
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your custom colors - using the 2 colors you specified
        'primary-blue': '#12B2E4',
        'secondary-blue': '#2B4B9E',
        
        // Keep existing primary for compatibility
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}