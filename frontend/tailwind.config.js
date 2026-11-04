/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // AcxiomCRM Exact Brand Palette
        brand: {
          teal: {
            DEFAULT: '#097C87',
            50: '#eff9fa',
            100: '#d7f0f2',
            200: '#b4e2e6',
            300: '#83ced5',
            400: '#4bb5bf',
            500: '#097C87', // Primary Deep Teal
            600: '#076770',
            700: '#06545c',
            800: '#07454b',
            900: '#0a3a3f',
            950: '#032327',
          },
          cyan: {
            DEFAULT: '#23CED9', // Bright Cyan
            50: '#effcfd',
            100: '#d7f7fa',
            200: '#b4eff5',
            300: '#7fe2ee',
            400: '#23CED9',
            500: '#14b4bf',
            600: '#138f9d',
            700: '#167380',
            800: '#1a5d67',
            900: '#1a4e57',
          },
          peach: {
            DEFAULT: '#FCA47C', // Warm Peach
            50: '#fef7f3',
            100: '#fdeee5',
            200: '#fbdccb',
            300: '#f9c3a6',
            400: '#FCA47C',
            500: '#f97e47',
            600: '#eb6229',
            700: '#c34a1d',
            800: '#9b3d1c',
            900: '#7d351b',
          },
          yellow: {
            DEFAULT: '#F9D779', // Soft Yellow
            50: '#fdfbf2',
            100: '#fbf4df',
            200: '#f8e8b9',
            300: '#F9D779',
            400: '#f4c34a',
            500: '#e9aa25',
            600: '#cd871b',
            700: '#a36219',
            800: '#854e1b',
            900: '#6f411b',
          },
          sage: {
            DEFAULT: '#A1CCA6', // Sage Green
            50: '#f5faf5',
            100: '#e8f3e9',
            200: '#d2e7d4',
            300: '#b4d7b7',
            400: '#A1CCA6',
            500: '#73aa79',
            600: '#5a8d60',
            700: '#48704d',
            800: '#3c5a40',
            900: '#334b37',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

