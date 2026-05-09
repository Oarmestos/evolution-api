/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
        // New Builder Colors
        "puck-primary": "#006875",
        "puck-naviblue": "#00327D",
        "puck-primary-container": "#00e5ff",
        "puck-surface": "#f7f9fb",
        "puck-surface-variant": "#e0e3e5",
        "puck-outline": "#6b7a7d",
        "puck-outline-variant": "#bac9cc",
        "puck-on-surface": "#191c1e",
        "puck-on-surface-variant": "#3b494c",
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

