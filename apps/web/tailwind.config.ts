import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        night: {
          ink: "#1f2937",
          mist: "#f8f3eb",
          sunset: "#f7b267",
          berry: "#cd5334",
          pine: "#2f4f4f"
        }
      },
      boxShadow: {
        glow: "0 24px 80px rgba(31, 41, 55, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
