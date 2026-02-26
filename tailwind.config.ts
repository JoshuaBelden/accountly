import type { Config } from "tailwindcss"

export default {
  darkMode: "class",
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        surface: {
          950: "#060d16",
          900: "#0a1120",
          800: "#111827",
          700: "#1f2937",
          600: "#374151",
        },
      },
    },
  },
  plugins: [],
} satisfies Config
