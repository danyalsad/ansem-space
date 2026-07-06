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
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        "gold-glow": "0 0 24px rgba(212,175,55,0.25), 0 0 64px rgba(212,175,55,0.08)",
        "crimson-glow": "0 0 24px rgba(200,16,46,0.35)",
        panel: "0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 40px rgba(0,0,0,0.6)",
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
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        floaty: "floaty 5s ease-in-out infinite",
        pulseglow: "pulseglow 2.4s ease-in-out infinite",
        scanline: "scanline 9s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
