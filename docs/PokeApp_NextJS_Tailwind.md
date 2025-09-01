# PokeApp — Next.js + Tailwind Pokémon Theme

This document describes how to set up a **Next.js (App Router) + Tailwind** project with a Pokémon-inspired design theme, including light/dark modes, type badges, header, cards, and grid/detail views.

---

## 0) Quick Setup

```bash
# create & set up project
bun create next@latest pokeapp
cd pokeapp
bun add -D tailwindcss postcss autoprefixer class-variance-authority clsx
bun x tailwindcss init -p
```

---

## 1) Tailwind & Global Styles

### /tailwind.config.ts
```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
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
      boxShadow: { card: "0 6px 20px rgba(0,0,0,0.08)" },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
} satisfies Config;
```

### /app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import "./styles/tokens.css";

:root { color-scheme: light dark; }

html, body { height: 100%; background: var(--color-bg); color: var(--color-text); }
```

### /app/styles/tokens.css
```css
:root {
  --color-poke-red: #EE1515;
  --color-poke-yellow: #FFCB05;
  --color-poke-blue: #3B4CCA;
  --color-bg: #FFFFFF;
  --color-surface: #FAFAFA;
  --color-border: #E5E7EB;
  --color-text: #1F2937;
  --color-muted: #6B7280;
  --type-fire:#EE8130; --type-water:#6390F0; --type-grass:#7AC74C;
  /* ... all other types ... */
}
.dark {
  --color-bg: #0B0C10;
  --color-surface: #111217;
  --color-border: #232734;
  --color-text: #ECEFF4;
  --color-muted: #A1A7B3;
}
```

---

## 2) App Layout with Theme Toggle

### /app/layout.tsx
```tsx
import "./globals.css";
import { ReactNode } from "react";
import Header from "@/components/Header";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata = { title: "PokeApp", description: "Pokémon explorer" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### /components/ThemeProvider.tsx
```tsx
"use client";
import { useEffect, useState } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
    setMounted(true);
  }, []);
  if (!mounted) return <>{children}</>;
  return <>{children}</>;
}

export function toggleTheme() {
  const el = document.documentElement;
  const isDark = el.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}
```

---

## 3) Header (Poké Ball split + toggle)

### /components/Header.tsx
```tsx
"use client";
import { toggleTheme } from "./ThemeProvider";

export default function Header() {
  return (
    <header className="w-full shadow-sm">
      <div className="h-1.5 w-full bg-poke-red" />
      <div className="h-1.5 w-full bg-white dark:bg-zinc-200/20" />
      <div className="h-1.5 w-full bg-poke-blue" />

      <div className="bg-surface">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          <span className="font-semibold text-lg">PokeApp</span>
          <button onClick={toggleTheme} className="rounded px-3 py-1.5 border border-border">
            🌙/☀️
          </button>
        </div>
      </div>
    </header>
  );
}
```

---

## 4) Lib Helpers

### /lib/pokeapi.ts
```ts
export async function getPokemonList(limit = 30, offset = 0) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`, {
    next: { revalidate: 3600 },
  });
  return res.json();
}

export async function getPokemon(idOrName: string | number) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`, {
    next: { revalidate: 86400 },
  });
  return res.json();
}

export function artworkUrlFromId(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function idFromUrl(url: string) {
  const parts = url.split("/").filter(Boolean);
  return Number(parts[parts.length - 1]);
}
```

### /lib/typeColors.ts
```ts
export const TYPE_LABELS = { fire: "Fire", water: "Water", grass: "Grass" /* ... */ };

export function typeBgClass(t: string) { return `bg-type-${t.toLowerCase()}`; }
export function typeTextContrast(t: string) {
  const darkish = new Set(["fire","fighting","ghost","dragon","dark"]);
  return darkish.has(t.toLowerCase()) ? "text-white" : "text-black";
}
```

---

## 5) UI Components

### /components/TypeBadge.tsx
```tsx
import { TYPE_LABELS, typeBgClass, typeTextContrast } from "@/lib/typeColors";

export default function TypeBadge({ type }: { type: string }) {
  return (
    <span className={[
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border",
      typeBgClass(type), typeTextContrast(type)
    ].join(" ")}>
      {TYPE_LABELS[type.toLowerCase()] ?? type}
    </span>
  );
}
```

### /components/PokemonCard.tsx
```tsx
import Link from "next/link";
import TypeBadge from "./TypeBadge";
import { artworkUrlFromId } from "@/lib/pokeapi";

export default function PokemonCard({ id, name, types }: { id: number; name: string; types: string[] }) {
  return (
    <Link href={`/pokemon/${id}`} className="block rounded-xl2 border border-border bg-surface shadow-card">
      <div className="aspect-square bg-white/40 overflow-hidden">
        <img src={artworkUrlFromId(id)} alt={name} className="object-contain p-4" />
      </div>
      <div className="p-3">
        <h3 className="capitalize font-semibold">{name}</h3>
        <div className="flex gap-1.5 mt-1">{types.map((t) => <TypeBadge key={t} type={t} />)}</div>
      </div>
    </Link>
  );
}
```

---

## 6) Pages

### /app/page.tsx
```tsx
import PokemonCard from "@/components/PokemonCard";
import { getPokemonList, getPokemon, idFromUrl } from "@/lib/pokeapi";

export default async function Home() {
  const list = await getPokemonList(30, 0);
  const enriched = await Promise.all(list.results.map(async (r: any) => {
    const id = idFromUrl(r.url);
    const p = await getPokemon(id);
    return { id, name: r.name, types: p.types.map((t: any) => t.type.name) };
  }));

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
      {enriched.map((p) => <PokemonCard key={p.id} {...p} />)}
    </section>
  );
}
```

### /app/pokemon/[id]/page.tsx
```tsx
import { getPokemon, artworkUrlFromId } from "@/lib/pokeapi";
import TypeBadge from "@/components/TypeBadge";

export default async function PokemonDetail({ params }: { params: { id: string } }) {
  const p = await getPokemon(params.id);
  return (
    <article className="grid md:grid-cols-2 gap-6">
      <div className="border border-border bg-surface rounded-xl2 p-4 flex items-center justify-center">
        <img src={artworkUrlFromId(p.id)} alt={p.name} className="max-h-[400px]" />
      </div>
      <div>
        <h1 className="text-2xl font-bold capitalize">{p.name}</h1>
        <div className="flex gap-2 mt-2">{p.types.map((t: any) => <TypeBadge key={t.type.name} type={t.type.name} />)}</div>
        {/* stats, moves, etc. */}
      </div>
    </article>
  );
}
```

---

## Run

```bash
bun dev
# open http://localhost:3000
```
