import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        // Deep space palette
        void: {
          900: "#050010",
          800: "#0a0118",
          700: "#10042a",
          600: "#1a0938",
        },
        // Heritage gold
        gold: {
          300: "#fde68a",
          400: "#fbbf24",
          500: "#d4a017",
          600: "#a07614",
        },
        // Neon violet (primary)
        violet: {
          glow: "#a78bfa",
          base: "#7c3aed",
          deep: "#5b21b6",
        },
        // Cyan accent
        cyan: {
          glow: "#67e8f9",
          base: "#22d3ee",
          deep: "#0891b2",
        },
        // Pink heritage accent
        rose: {
          glow: "#f9a8d4",
          base: "#ec4899",
        },
      },
      backgroundImage: {
        "aurora":
          "radial-gradient(ellipse at top left, rgba(167, 139, 250, 0.18), transparent 50%), radial-gradient(ellipse at top right, rgba(34, 211, 238, 0.15), transparent 50%), radial-gradient(ellipse at bottom, rgba(236, 72, 153, 0.12), transparent 60%)",
        "noise":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      animation: {
        "spin-slow": "spin 18s linear infinite",
        "spin-reverse": "spin 22s linear infinite reverse",
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "shimmer": "shimmer 3s linear infinite",
        "draw": "draw 1.4s ease-out forwards",
        "flow": "flow 4s linear infinite",
        "aurora-shift": "auroraShift 15s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseGlow: {
          "0%, 100%": {
            boxShadow:
              "0 0 20px rgba(167, 139, 250, 0.4), 0 0 40px rgba(34, 211, 238, 0.2)",
          },
          "50%": {
            boxShadow:
              "0 0 30px rgba(167, 139, 250, 0.7), 0 0 60px rgba(34, 211, 238, 0.4)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        draw: {
          "0%": { strokeDashoffset: "100%" },
          "100%": { strokeDashoffset: "0" },
        },
        flow: {
          "0%": { strokeDashoffset: "0" },
          "100%": { strokeDashoffset: "-40" },
        },
        auroraShift: {
          "0%": { transform: "translate(-5%, -5%) rotate(0deg) scale(1)" },
          "50%": { transform: "translate(5%, 5%) rotate(180deg) scale(1.1)" },
          "100%": { transform: "translate(-5%, 5%) rotate(360deg) scale(1)" },
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(167, 139, 250, 0.35)",
        "glow-cyan": "0 0 40px rgba(34, 211, 238, 0.35)",
        "glow-gold": "0 0 30px rgba(251, 191, 36, 0.3)",
        "glow-pink": "0 0 35px rgba(236, 72, 153, 0.3)",
        "inner-glow": "inset 0 0 20px rgba(167, 139, 250, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
