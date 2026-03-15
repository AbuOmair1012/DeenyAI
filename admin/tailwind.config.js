/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0D7377",
          dark: "#095456",
          light: "#1A9B9F",
        },
        secondary: {
          DEFAULT: "#D4A843",
          light: "#E8C76B",
        },
      },
    },
  },
  plugins: [],
};
