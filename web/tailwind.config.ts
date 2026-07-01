import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        obsidian: {
          950: "#09090b",
          900: "#121214",
          850: "#1a1a1e",
          800: "#222226",
          700: "#2d2d34",
        },
        cyber: {
          cyan: "#00f2fe",
          blue: "#4facfe",
          purple: "#7f00ff",
          pink: "#ff007f",
        },
        neon: {
          purple: "#bf5af2",
          blue: "#0a84ff",
          cyan: "#64d2ff",
          green: "#30d158",
          orange: "#ff9f0a",
          red: "#ff453a",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-glow": "0 8px 32px 0 rgba(79, 172, 254, 0.15)",
        "neon-glow": "0 0 20px rgba(127, 0, 255, 0.4)",
      },
      backdropBlur: {
        xs: "2px",
      }
    },
  },
  plugins: [],
};

export default config;
