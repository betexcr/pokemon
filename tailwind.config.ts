import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        muted: "var(--color-muted)",
        poke: {
          red: "var(--color-poke-red)",
          yellow: "var(--color-poke-yellow)",
          blue: "var(--color-poke-blue)",
        },
        gold: {
          accent: "var(--color-accent)",
          "accent-dark": "var(--color-accent-dark)",
          highlight: "var(--color-highlight)",
          shadow: "var(--color-shadow)",
        },

        red: {
          accent: "var(--color-accent)",
          "accent-dark": "var(--color-accent-dark)",
          highlight: "var(--color-highlight)",
          shadow: "var(--color-shadow)",
        },
        ruby: {
          accent: "var(--color-accent)",
          "accent-dark": "var(--color-accent-dark)",
          highlight: "var(--color-highlight)",
          shadow: "var(--color-shadow)",
          panel: "var(--color-ruby-panel)",
          text: "var(--color-ruby-text)",
          tab: "var(--color-ruby-tab)",
        },
        type: {
          normal: "var(--type-normal)",
          fire: "var(--type-fire)",
          water: "var(--type-water)",
          electric: "var(--type-electric)",
          grass: "var(--type-grass)",
          ice: "var(--type-ice)",
          fighting: "var(--type-fighting)",
          poison: "var(--type-poison)",
          ground: "var(--type-ground)",
          flying: "var(--type-flying)",
          psychic: "var(--type-psychic)",
          bug: "var(--type-bug)",
          rock: "var(--type-rock)",
          ghost: "var(--type-ghost)",
          dragon: "var(--type-dragon)",
          dark: "var(--type-dark)",
          steel: "var(--type-steel)",
          fairy: "var(--type-fairy)",
        },
      },
      boxShadow: { 
        card: "0 6px 20px rgba(0,0,0,0.08)",
        "card-dark": "0 6px 20px rgba(0,0,0,0.3)",
        "gold-card": "0 4px 12px rgba(10, 61, 31, 0.4)",
        "gold-button": "0 2px 4px rgba(10, 61, 31, 0.3)",

        "red-card": "0 4px 12px rgba(139, 0, 0, 0.4)",
        "red-button": "0 2px 4px rgba(139, 0, 0, 0.3)",
        "ruby-card": "0 4px 12px rgba(47, 27, 20, 0.4)",
        "ruby-button": "0 2px 4px rgba(47, 27, 20, 0.3)",
      },
      borderRadius: { xl2: "1.25rem" },
      fontFamily: {
        'retro': ['Courier New', 'monospace'],
        'pixel': ['Press Start 2P', 'monospace'],
        'gameboy': ['Courier New', 'monospace'],
        'gba': ['Press Start 2P', 'monospace'],
        'gbc': ['Press Start 2P', 'monospace'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, var(--color-bg) 0%, var(--color-surface) 100%)',
        'gold-card': 'linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg) 100%)',

        'red-gradient': 'linear-gradient(135deg, var(--color-bg) 0%, var(--color-surface) 100%)',
        'red-card': 'linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg) 100%)',
        'ruby-gradient': 'linear-gradient(135deg, var(--color-bg) 0%, var(--color-surface) 100%)',
        'ruby-card': 'linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg) 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
