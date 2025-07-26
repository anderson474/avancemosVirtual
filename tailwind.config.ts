// tailwind.config.ts

import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography' // Importamos el plugin aquí

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundSize: {
        "400%": "400% 400%",
      },
      animation: {
        "gradient-animation": "gradient-animation 15s ease infinite",
      },
      keyframes: {
        "gradient-animation": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [
    typography, // Usamos la variable importada
  ],
}

export default config