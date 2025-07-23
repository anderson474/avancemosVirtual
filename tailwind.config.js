// tailwind.config.js

// 1. Importa el plugin aquí arriba con la sintaxis 'import'
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Asegúrate que estas rutas apunten a tus archivos
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // -> 1. Añadimos el tamaño de fondo para que el gradiente sea enorme
      backgroundSize: {
        "400%": "400% 400%",
      },
      // -> 2. Añadimos la animación personalizada
      animation: {
        "gradient-animation": "gradient-animation 15s ease infinite",
      },
      // -> 3. Definimos los keyframes de la animación
      keyframes: {
        "gradient-animation": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [
    // 2. Usa la variable que importaste aquí
    typography,
    // ... aquí pueden ir otros plugins que uses
  ],
};
