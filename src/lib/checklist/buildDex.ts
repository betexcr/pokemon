import type { DexEntry } from "./types";
import { getPokemon, getPokemonSpecies, getPokemonTotalCount } from "@/lib/api";

// Build a full Dex list with minimal fields (id, name, gen, types, sprite)
export async function buildFullDex(limit?: number): Promise<DexEntry[]> {
  const total = await getPokemonTotalCount().catch(() => 1025);
  const max = limit ? Math.min(limit, total) : total;
  const ids = Array.from({ length: max }, (_, i) => i + 1);

  const results: DexEntry[] = [];

  // Chunk to avoid overwhelming API
  const chunkSize = 50;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const entries = await Promise.all(chunk.map(async (id) => {
      try {
        const [sp, pk] = await Promise.all([
          getPokemonSpecies(id),
          getPokemon(id),
        ]);
        const gen = sp.generation?.name ? generationNumber(sp.generation.name) ?? 0 : 0;
        const types = (pk.types || []).map((t: any) => capitalize(t.type.name));
        return {
          id,
          name: sp.name.replace(/-/g, ' '),
          gen,
          types,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
        } as DexEntry;
      } catch {
        return null;
      }
    }));
    for (const e of entries) if (e) results.push(e);
  }

  return results;
}

function generationNumber(name?: string | null): number | null {
  if (!name) return null;
  const m = name.match(/generation-(i|ii|iii|iv|v|vi|vii|viii|ix)/);
  if (!m) return null;
  const map: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9 };
  return map[m[1]] ?? null;
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

