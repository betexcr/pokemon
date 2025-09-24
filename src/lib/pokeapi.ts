// Minimal, dependency-free PokeAPI client (Node 18+/Bun fetch).
const BASE = "https://pokeapi.co/api/v2";

export async function fetchMove(idOrName: number | string): Promise<unknown> {
  const res = await fetch(`${BASE}/move/${idOrName}`);
  if (!res.ok) throw new Error(`PokeAPI move fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchPokemon(idOrName: number | string): Promise<unknown> {
  const res = await fetch(`${BASE}/pokemon/${idOrName}`);
  if (!res.ok) throw new Error(`PokeAPI pokemon fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchType(idOrName: number | string): Promise<unknown> {
  const res = await fetch(`${BASE}/type/${idOrName}`);
  if (!res.ok) throw new Error(`PokeAPI type fetch failed: ${res.status}`);
  return res.json();
}

/** utility: lowercase-with-hyphens -> TitleCase */
export function toTitleName(s: string): string {
  return s.split("-").map(p => p.charAt(0).toUpperCase()+p.slice(1)).join("")  // "thunder-punch" -> "ThunderPunch"
           .replace(/Fairy|Steel|Dark|Dragon|Ghost|Rock|Bug|Psychic|Flying|Ground|Poison|Fighting|Ice|Grass|Electric|Water|Fire|Normal/,
                    (m)=>m); // keep type words intact
}
