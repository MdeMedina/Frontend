/** @type {import('tailwindcss').Config} */
// NOTE: In Tailwind v4, design tokens (colors, spacing, typography, radii)
// are defined in src/index.css via @theme {} blocks — the CSS-first approach.
// This file only handles content scanning and plugins.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [],
}
