import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:          "var(--color-primary)",
        secondary:        "var(--color-secondary)",
        accent:           "var(--color-accent)",
        background:       "var(--color-background)",
        surface:          "var(--color-surface)",
        "text-primary":   "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        border:           "var(--color-border)",
      },
      fontFamily: {
        sans: ["var(--font-family)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
