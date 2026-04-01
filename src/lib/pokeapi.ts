// Minimal, dependency-free PokeAPI client (Node 18+/Bun fetch).
const BASE = "https://pokeapi.co/api/v2";

// Helper for retrying fetch
async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status >= 500 && i < retries - 1) {
           // Retry on server errors
           await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
           continue;
        }
        throw new Error(`Fetch failed: ${res.status}`);
      }
      return res;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Unreachable');
}

export async function fetchMove(idOrName: number | string): Promise<unknown> {
  const res = await fetchWithRetry(`${BASE}/move/${idOrName}`);
  return res.json();
}

export async function fetchPokemon(idOrName: number | string): Promise<unknown> {
  const res = await fetchWithRetry(`${BASE}/pokemon/${idOrName}`);
  return res.json();
}

async function fetchType(idOrName: number | string): Promise<unknown> {
  const res = await fetchWithRetry(`${BASE}/type/${idOrName}`);
  return res.json();
}

/** utility: lowercase-with-hyphens -> TitleCase */
function toTitleName(s: string): string {
  return s.split("-").map(p => p.charAt(0).toUpperCase()+p.slice(1)).join("");
}
