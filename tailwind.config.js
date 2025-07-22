// tailwind.config.js

// 1. Importa el plugin aquí arriba con la sintaxis 'import'
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Asegúrate que estas rutas apunten a tus archivos
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ...
    },
  },
  plugins: [
    // 2. Usa la variable que importaste aquí
    typography,
    // ... aquí pueden ir otros plugins que uses
  ],
};