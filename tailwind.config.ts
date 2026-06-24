import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        gaming: {
          dark: "#09090b",
          card: "#121216",
          cardHover: "#1b1c22",
          accent: "#24252e",
          purple: "#3b82f6",
          cyan: "#3b82f6",
          gold: "#3b82f6",
          pink: "#4f46e5",
        },
      },
      backgroundImage: {
        "gradient-gaming":
          "linear-gradient(135deg, #09090b 0%, #121216 50%, #20222a 100%)",
        "gradient-glow":
          "linear-gradient(135deg, #3b82f6 0%, #4f46e5 50%, #ec4899 100%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 3s ease-in-out infinite",
        "float-delayed": "float 3s ease-in-out 1.5s infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        blob: "blob 7s infinite",
        marquee: "marquee 35s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px #9d4edd, 0 0 10px #9d4edd" },
          "100%": { boxShadow: "0 0 10px #f15bb5, 0 0 20px #f15bb5" },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
