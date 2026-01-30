import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },

      /* -------------------------------------------------- */
      /* Colors                                             */
      /* -------------------------------------------------- */
      colors: {
        navy: {
          500: "#0a2540",
        },
      },

      /* -------------------------------------------------- */
      /* Animations                                         */
      /* -------------------------------------------------- */
      animation: {
        gradient: "gradient 6s ease infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
      },

      /* -------------------------------------------------- */
      /* Keyframes                                          */
      /* -------------------------------------------------- */
      keyframes: {
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.92" },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};

module.exports = config;
