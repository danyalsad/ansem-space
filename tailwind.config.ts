import type { Config } from "tailwindcss";

/**
 * ANSEM Space — dark cyber-bull design system.
 * void   = near-black base
 * gold   = molten gold accent (primary)
 * crimson= aggression / danger accent
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0A0A0A",
        abyss: "#111013",
        panel: "#141317",
        edge: "#26232B",
        gold: {
          DEFAULT: "#D4AF37",
          dim: "#8C7326",
          glow: "#EDCB6A",
        },
        crimson: {
          DEFAULT: "#C8102E",
          bright: "#FF2E2E",
          dim: "#6E0A19",
        },
        bone: "#F2EFE9",
        ash: "#9A95A3",
        ember: "#1A1218",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        "gold-glow": "0 0 32px rgba(212,175,55,0.3), 0 0 80px rgba(212,175,55,0.1), inset 0 1px 0 rgba(237,203,106,0.15)",
        "crimson-glow": "0 0 28px rgba(200,16,46,0.4), 0 0 60px rgba(200,16,46,0.12)",
        panel: "0 1px 0 rgba(255,255,255,0.05) inset, 0 1px 0 rgba(212,175,55,0.06), 0 20px 50px rgba(0,0,0,0.55)",
        "panel-lift": "0 24px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(212,175,55,0.08)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        pulseglow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "pulse-ring": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.4" },
          "50%": { transform: "scale(1.05)", opacity: "0.8" },
        },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        floaty: "floaty 5s ease-in-out infinite",
        pulseglow: "pulseglow 2.4s ease-in-out infinite",
        scanline: "scanline 9s linear infinite",
        shimmer: "shimmer 6s linear infinite",
        "pulse-ring": "pulse-ring 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
