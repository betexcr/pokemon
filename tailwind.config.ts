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
        input: {
          bg: "var(--color-input-bg)",
          text: "var(--color-input-text)",
          placeholder: "var(--color-input-placeholder)",
        },
        google: {
          bg: "var(--color-google-bg)",
          border: "var(--color-google-border)",
          text: "var(--color-google-text)",
        },
        signup: {
          bg: "var(--color-signup-bg)",
          text: "var(--color-signup-text)",
          hover: "var(--color-signup-hover)",
        },
        poke: {
          red: "var(--color-poke-red)",
          yellow: "var(--color-poke-yellow)",
          blue: "var(--color-poke-blue)",
        },
      },
      spacing: {
        'standard': '2rem',
        'compact': '1rem',
        'minimal': '0.5rem',
      },
      borderRadius: {
        'capsule': '999px',
      },
      boxShadow: {
        'card': '0 8px 24px rgba(0,0,0,0.15)',
        'card-compact': '0 4px 16px rgba(0,0,0,0.1)',
        'card-minimal': '0 2px 8px rgba(0,0,0,0.08)',
      },
      fontSize: {
        'helper': '0.85rem',
        'helper-compact': '0.8rem',
      },
      lineHeight: {
        'helper': '1.4',
        'helper-compact': '1.3',
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
  plugins: [],
} satisfies Config;
