import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: {
          900: "#0f1115",
          800: "#161a22",
          700: "#202632",
        },
        accent: "#3b82f6",
      },
    },
  },
  darkMode: "class",
  plugins: [],
} satisfies Config;
