/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#faf9f5',
          100: '#f5f3ec',
          200: '#eeebe0',
        },
        sage: {
          50: '#f4f6f3',
          100: '#e6ebe4',
          200: '#ccd8c8',
          300: '#a8bca2',
          400: '#84a07c',
          500: '#5f7a57',
          600: '#4a6344',
          700: '#3a4f36',
          800: '#2e3f2b',
        },
        charcoal: {
          700: '#3d3d3d',
          800: '#2e2e2e',
          900: '#1e1e1e',
        },
        hazard: {
          light: '#e8b8b8',
          mid: '#c47a7a',
          DEFAULT: '#9c5555',
          dark: '#7a3d3d',
        },
        safe: {
          light: '#c4d4be',
          mid: '#8aae82',
          DEFAULT: '#5f7a57',
          dark: '#4a6344',
        },
        border: {
          DEFAULT: '#ccd8c8',
          light: '#e6ebe4',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(74, 99, 68, 0.06), 0 1px 2px rgba(74, 99, 68, 0.04)',
        cardhover: '0 2px 8px rgba(74, 99, 68, 0.08), 0 1px 3px rgba(74, 99, 68, 0.06)',
      },
    },
  },
  plugins: [],
};
