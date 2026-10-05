/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind scans these files and only generates CSS for the class names
  // it finds, so the production stylesheet stays small.
  content: ["./public/index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // The accent colour: lapis lazuli blue. 600 is the "true" lapis and
        // is used for primary buttons; the lighter steps are for text and
        // focus rings on the dark background.
        lapis: {
          300: "#93b8e6",
          400: "#5f97d8",
          500: "#3a78c2",
          600: "#26619c",
          700: "#1e4e7e",
        },
      },
    },
  },
  plugins: [],
};
