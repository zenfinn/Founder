/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        founder: {
          50: "#eef4ff",
          100: "#dbe8ff",
          200: "#c0d7ff",
          300: "#95bbff",
          400: "#4d9fff",
          500: "#2f61df",
          600: "#1a3aad",
          700: "#173296",
          800: "#142a7d",
          900: "#101f5e"
        },
        rank: {
          aspiring: "#94a3b8",
          starter: "#4d9fff",
          builder: "#34d399",
          scaler: "#f59e0b",
          elite: "#e879f9"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"]
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(15, 23, 42, 0.18)"
      }
    },
  },
  plugins: [],
};
