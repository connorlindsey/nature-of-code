const colors = require("tailwindcss/colors")

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./exercises/**/*.html"],
  theme: {
    extend: {
      colors: {
        gray: colors.gray,
        primary: colors.fuchsia,
      },
    },
  },
  plugins: [],
}
