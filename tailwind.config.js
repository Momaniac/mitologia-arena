/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tema oscuro premium — "Arena nocturna" (Dirección B).
        base: '#01060a', // fondo de página (= negro del logo de Mitología, sin costura)
        surface: '#171d26', // tarjetas / paneles
        surface2: '#212a35', // insets / celdas / filas elevadas
        line: '#2a3542', // bordes y separadores
        ink: '#e8ecf2', // texto principal (claro sobre fondo oscuro)
        muted: '#96a0ac', // texto secundario
        accent: {
          DEFAULT: '#ffc107',
          dark: '#d49a00',
          ink: '#17130a', // texto sobre amarillo
        },
        link: '#4a95f5',
        success: '#35d07f',
        danger: '#ff5b6a',
        // Colores de figura (el arte final será del diseñador; ver ASSETS.md).
        dragon: '#c0392b',
        hydra: '#27ae60',
        fenix: '#e67e22',
        kraken: '#3a5673',
        minotauro: '#b5835a',
      },
      boxShadow: {
        glow: '0 0 0 2px #ffc107, 0 0 18px 4px rgba(255, 193, 7, 0.5)',
        elev: '0 14px 34px -14px rgba(0, 0, 0, 0.75)',
        well: 'inset 0 2px 6px rgba(0, 0, 0, 0.55), inset 0 -1px 0 rgba(255, 255, 255, 0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
