/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#F8F9FA',
        ink: '#1E1E1E',
        accent: {
          DEFAULT: '#FFC107',
          dark: '#D49A00',
        },
        link: '#0057B3',
        success: '#28A745',
        danger: '#DC3545',
        card: 'rgba(30, 30, 30, 0.06)',
        dragon: '#C0392B',
        hydra: '#27AE60',
        fenix: '#E67E22',
        kraken: '#2C3E50',
        minotauro: '#B5835A',
      },
      boxShadow: {
        glow: '0 0 0 2px #FFC107, 0 0 16px 4px rgba(255, 193, 7, 0.55)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
