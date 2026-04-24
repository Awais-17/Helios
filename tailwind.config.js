/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#121212",
        sidebar: "#1a1a1a",
        border: "#333",
        primary: "#007acc",
        secondary: "#252525",
      },
    },
  },
  plugins: [],
}
