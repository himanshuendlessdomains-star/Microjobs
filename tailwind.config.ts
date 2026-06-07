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
        lime: {
          DEFAULT: "#B5F23A",
          dim: "#8BBD1E",
          glow: "#B5F23A28",
          subtle: "#B5F23A18",
          border: "#B5F23A40",
        },
        dark: {
          DEFAULT: "#0D0E10",
          card: "#111317",
          elevated: "#141619",
          border: "#1E2127",
          muted: "#2E333D",
          surface: "#1A1D22",
        },
        ink: {
          primary: "#EAEAEA",
          secondary: "#C8CDD8",
          muted: "#9CA3AF",
          faint: "#5A6070",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        "lime-glow": "0 0 20px 3px #B5F23A28",
        "lime-glow-sm": "0 0 10px 1px #B5F23A20",
        phone: "0 40px 100px #000000CC, 0 0 0 1px #1E2127",
      },
      animation: {
        "pulse-lime": "pulse-lime 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
      },
      keyframes: {
        "pulse-lime": {
          "0%, 100%": { boxShadow: "0 0 20px 3px #B5F23A28" },
          "50%": { boxShadow: "0 0 30px 6px #B5F23A40" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      borderRadius: {
        "2.5xl": "20px",
        "3xl": "24px",
        "4xl": "32px",
        phone: "40px",
      },
    },
  },
  plugins: [],
};
export default config;
