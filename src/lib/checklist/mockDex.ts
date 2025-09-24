import type { DexEntry } from "./types";

// Small sample dataset (for dev). In production, replace with full Pokédex.
export const mockDex: DexEntry[] = [
  { id: 1, name: "Bulbasaur", gen: 1, types: ["Grass", "Poison"], sprite: "/sprites/1.png" },
  { id: 2, name: "Ivysaur", gen: 1, types: ["Grass", "Poison"], sprite: "/sprites/2.png" },
  { id: 3, name: "Venusaur", gen: 1, types: ["Grass", "Poison"], sprite: "/sprites/3.png" },
  { id: 4, name: "Charmander", gen: 1, types: ["Fire"], sprite: "/sprites/4.png" },
  { id: 5, name: "Charmeleon", gen: 1, types: ["Fire"], sprite: "/sprites/5.png" },
  { id: 6, name: "Charizard", gen: 1, types: ["Fire", "Flying"], sprite: "/sprites/6.png" },
  { id: 7, name: "Squirtle", gen: 1, types: ["Water"], sprite: "/sprites/7.png" },
  { id: 8, name: "Wartortle", gen: 1, types: ["Water"], sprite: "/sprites/8.png" },
  { id: 9, name: "Blastoise", gen: 1, types: ["Water"], sprite: "/sprites/9.png" },
  { id: 25, name: "Pikachu", gen: 1, types: ["Electric"], sprite: "/sprites/25.png" },
  { id: 37, name: "Vulpix", gen: 1, types: ["Fire"], sprite: "/sprites/37.png" },
  { id: 52, name: "Meowth", gen: 1, types: ["Normal"], sprite: "/sprites/52.png" },
  { id: 54, name: "Psyduck", gen: 1, types: ["Water"], sprite: "/sprites/54.png" },
  { id: 58, name: "Growlithe", gen: 1, types: ["Fire"], sprite: "/sprites/58.png" },
  { id: 74, name: "Geodude", gen: 1, types: ["Rock", "Ground"], sprite: "/sprites/74.png" },
  { id: 92, name: "Gastly", gen: 1, types: ["Ghost", "Poison"], sprite: "/sprites/92.png" },
  { id: 133, name: "Eevee", gen: 1, types: ["Normal"], sprite: "/sprites/133.png" },
  { id: 150, name: "Mewtwo", gen: 1, types: ["Psychic"], sprite: "/sprites/150.png" },
  { id: 152, name: "Chikorita", gen: 2, types: ["Grass"], sprite: "/sprites/152.png" },
  { id: 155, name: "Cyndaquil", gen: 2, types: ["Fire"], sprite: "/sprites/155.png" },
  { id: 158, name: "Totodile", gen: 2, types: ["Water"], sprite: "/sprites/158.png" },
];

export const gens = Array.from(new Set(mockDex.map((d) => d.gen))).sort((a, b) => a - b);
export const types = Array.from(new Set(mockDex.flatMap((d) => d.types))).sort();

