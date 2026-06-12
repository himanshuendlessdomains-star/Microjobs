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
        /* Light surfaces */
        surface: {
          page: "#F2F4FA",
          card: "#FFFFFF",
          tint: "#EDF0FA",
          border: "#E0E4F0",
          hover: "#E8EBF8",
        },
        /* Dark accent surfaces */
        dark: {
          DEFAULT: "#0D0E12",
          card: "#13151C",
          elevated: "#1A1D27",
          border: "#252833",
          surface: "#1E2130",
          navy: "#1A1D30",
        },
        /* Lime brand accent (unchanged) */
        lime: {
          DEFAULT: "#B5F23A",
          dim: "#8BBD1E",
          glow: "#B5F23A28",
          subtle: "#B5F23A15",
          border: "#B5F23A40",
        },
        /* Text on dark backgrounds */
        ink: {
          primary: "#EAEAEA",
          secondary: "#C8CDD8",
          muted: "#9CA3AF",
          faint: "#5A6070",
        },
        /* Text on light backgrounds — use text-slate-900, text-slate-700, etc. */
        slate: {
          900: "#0D0E12",
          700: "#3B3F55",
          500: "#7A8099",
          300: "#A8AEBF",
        },
        /* Status */
        urgent: "#F87171",
        success: "#34D399",
        warning: "#F59E0B",
        /* Category accents */
        category: {
          creative: "#A78BFA",
          social: "#60A5FA",
          analytics: "#34D399",
          dev: "#F59E0B",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        sm: "0 2px 8px rgba(10,11,22,0.06)",
        md: "0 4px 20px rgba(10,11,22,0.08)",
        lg: "0 8px 40px rgba(10,11,22,0.12)",
        lime: "0 0 20px 4px rgba(181,242,58,0.25)",
        "lime-glow": "0 0 20px 3px #B5F23A28",
        "lime-glow-sm": "0 0 10px 1px #B5F23A20",
        card: "0 40px 100px #000000CC, 0 0 0 1px #1E2127",
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
      },
    },
  },
  plugins: [],
};
export default config;
