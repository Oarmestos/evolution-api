/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00f2ff",
        secondary: "#7000ff",
        "avri-accent": "#00ff88",
        dark: "#0a0a0f",
        "dark-accent": "#1a1a2e",
        "card-bg": "rgba(255, 255, 255, 0.05)",
        glass: "rgba(255, 255, 255, 0.03)",
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'avri-gradient': 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0a0a0f 100%)',
      }
    },
  },
  plugins: [],
}

