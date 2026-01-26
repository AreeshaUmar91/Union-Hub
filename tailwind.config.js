/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        lora: ["Lora", "serif"],
        poppins: ["Poppins", "sans-serif"],
        nunito: ["Nunito", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
        rubik: ["Rubik", "sans-serif"], // Added Rubik
      },
      colors: {
        primary: "#336699",
        grey: "#838C96",
        red: "#FF6B6B",
        black: "#000000",
        bgcolor: "#F5F5F5",
        inputlabel: "#4E4B66",
        whitish:"#FAFAFA",
        pink:"#FF6B6B",
        gradient: {
          "primary-gradient": "linear-gradient(90deg, #144E5A 0%, #1E6B78 100%)",
        },
      },
    },
  },
  plugins: [],
};
