import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark navy theme — accent is sky (cyan-blue) for high contrast on slate-900.
        brand: {
          100: "#e0f2fe", // sky-100 — light text on blue button
          300: "#7dd3fc", // sky-300 — link/accent text on dark bg
          400: "#38bdf8", // sky-400 — main accent text/icon on dark bg
          500: "#0ea5e9", // sky-500 — primary button
          600: "#0284c7", // sky-600 — primary button hover
          700: "#0369a1", // sky-700
        },
      },
    },
  },
  plugins: [],
};

export default config;
