import type { Config } from "tailwindcss";

/**
 * A colour from a CSS variable that also works with opacity modifiers (`bg-surface/80`).
 * A plain "var(--x)" string makes Tailwind 3 drop every `/NN` variant without a warning.
 * Tailwind 3 accepts colour functions at runtime, but its types only allow strings.
 */
const cssVar = (name: string): string =>
  (({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined
      ? `var(${name})`
      : `color-mix(in srgb, var(${name}) calc(${opacityValue} * 100%), transparent)`) as unknown as string;

export default {
  darkMode: "class",
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: cssVar("--color-bg"),
        primary: cssVar("--color-primary"),
        surface: cssVar("--color-surface"),
        border: cssVar("--color-border"),
        text: cssVar("--color-text"),
        muted: cssVar("--color-muted"),
        input: {
          bg: cssVar("--color-input-bg"),
          text: cssVar("--color-input-text"),
          placeholder: cssVar("--color-input-placeholder"),
        },
        google: {
          bg: cssVar("--color-google-bg"),
          border: cssVar("--color-google-border"),
          text: cssVar("--color-google-text"),
        },
        signup: {
          bg: cssVar("--color-signup-bg"),
          text: cssVar("--color-signup-text"),
          hover: cssVar("--color-signup-hover"),
        },
        poke: {
          red: cssVar("--color-poke-red"),
          yellow: cssVar("--color-poke-yellow"),
          blue: cssVar("--color-poke-blue"),
        },
        gold: {
          accent: cssVar("--color-accent"),
          "accent-dark": cssVar("--color-accent-dark"),
          highlight: cssVar("--color-highlight"),
          shadow: cssVar("--color-shadow"),
        },
        red: {
          accent: cssVar("--color-accent"),
          "accent-dark": cssVar("--color-accent-dark"),
          highlight: cssVar("--color-highlight"),
          shadow: cssVar("--color-shadow"),
        },
        ruby: {
          accent: cssVar("--color-accent"),
          "accent-dark": cssVar("--color-accent-dark"),
          highlight: cssVar("--color-highlight"),
          shadow: cssVar("--color-shadow"),
          panel: cssVar("--color-ruby-panel"),
          text: cssVar("--color-ruby-text"),
          tab: cssVar("--color-ruby-tab"),
        },
        type: {
          normal: cssVar("--type-normal"),
          fire: cssVar("--type-fire"),
          water: cssVar("--type-water"),
          electric: cssVar("--type-electric"),
          grass: cssVar("--type-grass"),
          ice: cssVar("--type-ice"),
          fighting: cssVar("--type-fighting"),
          poison: cssVar("--type-poison"),
          ground: cssVar("--type-ground"),
          flying: cssVar("--type-flying"),
          psychic: cssVar("--type-psychic"),
          bug: cssVar("--type-bug"),
          rock: cssVar("--type-rock"),
          ghost: cssVar("--type-ghost"),
          dragon: cssVar("--type-dragon"),
          dark: cssVar("--type-dark"),
          steel: cssVar("--type-steel"),
          fairy: cssVar("--type-fairy"),
        },
      },
      spacing: {
        'standard': '2rem',
        'compact': '1rem',
        'minimal': '0.5rem',
      },
      borderRadius: {
        'capsule': '999px',
        'xl2': '1.25rem',
      },
      boxShadow: {
        'card': '0 8px 24px rgba(0,0,0,0.15)',
        'card-compact': '0 4px 16px rgba(0,0,0,0.1)',
        'card-minimal': '0 2px 8px rgba(0,0,0,0.08)',
        'card-dark': '0 6px 20px rgba(0,0,0,0.3)',
        'gold-card': '0 4px 12px rgba(10, 61, 31, 0.4)',
        'gold-button': '0 2px 4px rgba(10, 61, 31, 0.3)',
        'red-card': '0 4px 12px rgba(139, 0, 0, 0.4)',
        'red-button': '0 2px 4px rgba(139, 0, 0, 0.3)',
        'ruby-card': '0 4px 12px rgba(47, 27, 20, 0.4)',
        'ruby-button': '0 2px 4px rgba(47, 27, 20, 0.3)',
      },
      fontSize: {
        'helper': '0.85rem',
        'helper-compact': '0.8rem',
      },
      lineHeight: {
        'helper': '1.4',
        'helper-compact': '1.3',
      },
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
      animation: {
        'shake': 'shake 0.5s ease-in-out',
        'fadeOut': 'fadeOut 1s ease-in-out forwards',
        'slideIn': 'slideIn 0.5s ease-out',
        'damage': 'damage 0.3s ease-in-out',
        'heal': 'heal 0.5s ease-in-out',
        'critical': 'critical 0.6s ease-in-out',
        'status': 'status 1s ease-in-out infinite',
        'evolve': 'evolve 2s ease-in-out',
        'mega': 'mega 1.5s ease-in-out',
        'beam': 'beam 0.5s ease-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        fadeOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.8)' },
          '100%': { opacity: '0', transform: 'scale(0.5)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        damage: {
          '0%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(0.95)', filter: 'brightness(1.2)' },
          '100%': { transform: 'scale(1)', filter: 'brightness(1)' },
        },
        heal: {
          '0%': { transform: 'scale(1)', filter: 'hue-rotate(0deg)' },
          '50%': { transform: 'scale(1.05)', filter: 'hue-rotate(120deg)' },
          '100%': { transform: 'scale(1)', filter: 'hue-rotate(0deg)' },
        },
        critical: {
          '0%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '25%': { transform: 'scale(1.1)', filter: 'brightness(1.5) hue-rotate(0deg)' },
          '50%': { transform: 'scale(1.05)', filter: 'brightness(1.3) hue-rotate(60deg)' },
          '75%': { transform: 'scale(1.1)', filter: 'brightness(1.5) hue-rotate(120deg)' },
          '100%': { transform: 'scale(1)', filter: 'brightness(1) hue-rotate(0deg)' },
        },
        status: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        evolve: {
          '0%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '25%': { transform: 'scale(1.2)', filter: 'brightness(1.5)' },
          '50%': { transform: 'scale(1.1)', filter: 'brightness(2) hue-rotate(180deg)' },
          '75%': { transform: 'scale(1.2)', filter: 'brightness(1.5) hue-rotate(360deg)' },
          '100%': { transform: 'scale(1)', filter: 'brightness(1) hue-rotate(0deg)' },
        },
        mega: {
          '0%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.3)', filter: 'brightness(2) hue-rotate(180deg)' },
          '100%': { transform: 'scale(1.1)', filter: 'brightness(1.2) hue-rotate(0deg)' },
        },
        beam: {
          '0%': { transform: 'scaleX(0)', opacity: '1' },
          '50%': { transform: 'scaleX(1)', opacity: '0.8' },
          '100%': { transform: 'scaleX(1)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
