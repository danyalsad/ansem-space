import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#050506",
        abyss: "#0C0B0F",
        panel: "#121116",
        surface: "#18171D",
        edge: "#2A2833",
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
        bone: "#F4F2EC",
        ash: "#9B97A8",
        mist: "#6E6A78",
        ember: "#1A1218",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        "gold-glow": "0 0 40px rgba(212,175,55,0.22), 0 0 100px rgba(212,175,55,0.06)",
        "crimson-glow": "0 0 32px rgba(200,16,46,0.35)",
        panel: "0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 48px rgba(0,0,0,0.45)",
        "panel-lift": "0 32px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
        float: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseglow: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" },
        },
        aurora: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(2%, -2%) scale(1.04)" },
          "66%": { transform: "translate(-2%, 1%) scale(0.98)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee: "marquee 32s linear infinite",
        floaty: "floaty 6s ease-in-out infinite",
        pulseglow: "pulseglow 2.5s ease-in-out infinite",
        aurora: "aurora 18s ease-in-out infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
    },
  },
  plugins: [],
};
export default config;