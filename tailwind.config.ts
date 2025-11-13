import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "rl-gradient-primary": "var(--rl-gradient-primary)",
        "rl-gradient-soft": "var(--rl-gradient-soft)",
      },
      colors: {
        zinc: colors.zinc,
        primary: "#020022",
        muted: "var(--neutral-600)",
        "muted-dark": "var(--neutral-300)",
        // RenderLab Theme Tokens
        rl: {
          bg: "var(--rl-bg)",
          surface: "var(--rl-surface)",
          "surface-elevated": "var(--rl-surface-elevated)",
          panel: "var(--rl-panel)",
          "panel-hover": "var(--rl-panel-hover)",
          border: "var(--rl-border)",
          "border-hover": "var(--rl-border-hover)",
          "glass-border": "var(--rl-glass-border)",
          text: "var(--rl-text)",
          "text-secondary": "var(--rl-text-secondary)",
          "text-muted": "var(--rl-text-muted)",
          accent: "var(--rl-accent)",
          "accent-hover": "var(--rl-accent-hover)",
          "accent-light": "var(--rl-accent-light)",
          success: "var(--rl-success)",
          error: "var(--rl-error)",
          warning: "var(--rl-warning)",
          // LUXURY: Gradient tokens
          "gradient-start": "var(--rl-gradient-start)",
          "gradient-mid": "var(--rl-gradient-mid)",
          "gradient-end": "var(--rl-gradient-end)",
          // LUXURY: Glow tokens
          "glow-orange": "var(--rl-glow-orange)",
          "glow-pink": "var(--rl-glow-pink)",
        },
      },
      spacing: {
        'rl-xs': 'var(--rl-space-xs)',
        'rl-sm': 'var(--rl-space-sm)',
        'rl-md': 'var(--rl-space-md)',
        'rl-lg': 'var(--rl-space-lg)',
        'rl-xl': 'var(--rl-space-xl)',
        'rl-2xl': 'var(--rl-space-2xl)',
      },
      borderRadius: {
        'rl-sm': 'var(--rl-radius-sm)',
        'rl-md': 'var(--rl-radius-md)',
        'rl-lg': 'var(--rl-radius-lg)',
        'rl-xl': 'var(--rl-radius-xl)',
      },
      animation: {
        scroll:
          "scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite",
        marquee: "marquee var(--marquee-duration) linear infinite",
        "fade-in": "fade-in 0.5s linear forwards",
      },
      boxShadow: {
        derek: `0px 0px 0px 1px rgb(0 0 0 / 0.06),
        0px 1px 1px -0.5px rgb(0 0 0 / 0.06),
        0px 3px 3px -1.5px rgb(0 0 0 / 0.06), 
        0px 6px 6px -3px rgb(0 0 0 / 0.06),
        0px 12px 12px -6px rgb(0 0 0 / 0.06),
        0px 24px 24px -12px rgb(0 0 0 / 0.06)`,
        aceternity: `0px 2px 3px -1px rgba(0,0,0,0.1), 0px 1px 0px 0px rgba(25,28,33,0.02), 0px 0px 0px 1px rgba(25,28,33,0.08)`,
        // LUXURY: Glow shadows
        'rl-glow-sm': 'var(--rl-shadow-glow-sm)',
        'rl-glow-md': 'var(--rl-shadow-glow-md)',
        'rl-glow-lg': 'var(--rl-shadow-glow-lg)',
      },
      keyframes: {
        scroll: {
          to: {
            transform: "translate(calc(-50% - 0.5rem))",
          },
        },
        marquee: {
          "100%": {
            transform: "translateY(-50%)",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },
      },
    },
  },
  plugins: [addVariablesForColors, require("@tailwindcss/typography")],
};

function addVariablesForColors({ addBase, theme }: any) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}

export default config;
