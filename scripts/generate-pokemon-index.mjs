#!/usr/bin/env node
// Builds public/data/pokemon-index.json: one compact row per Pokémon (all species and forms PokeAPI
// lists) with what the Pokédex needs to sort and filter without fetching every Pokémon's full record:
// id, name, types, base stats, height, weight.
//
// Before this index, sorting the Pokédex by anything but number (or filtering by height / weight)
// fetched ~1,350 full /pokemon/{id} records on first use.
//
// Usage: node scripts/generate-pokemon-index.mjs   (re-run when a new generation lands in PokeAPI)

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://pokeapi.co/api/v2';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data', 'pokemon-index.json');
const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
const CONCURRENCY = 12;

async function getJson(url, attempt = 1) {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'pokebattles-index-generator' } });
  if (res.ok) return res.json();
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    await new Promise((r) => setTimeout(r, 1000 * attempt));
    return getJson(url, attempt + 1);
  }
  throw new Error(`${res.status} ${url}`);
}

const list = await getJson(`${API}/pokemon?limit=100000&offset=0`);
const ids = list.results
  .map((r) => Number(r.url.split('/').filter(Boolean).pop()))
  .filter((id) => Number.isInteger(id) && id > 0);
console.log(`Fetching ${ids.length} Pokémon…`);

const rows = new Array(ids.length);
let next = 0;
let done = 0;
async function worker() {
  while (next < ids.length) {
    const i = next++;
    const p = await getJson(`${API}/pokemon/${ids[i]}/`);
    const stats = STAT_ORDER.map((name) => p.stats.find((s) => s.stat.name === name)?.base_stat ?? 0);
    const types = [...p.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name);
    rows[i] = [p.id, p.name, types.join('/'), p.height, p.weight, ...stats];
    if (++done % 100 === 0) console.log(`  ${done}/${ids.length}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const out = {
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  // Row layout; types are slash-separated in slot order
  fields: ['id', 'name', 'types', 'height', 'weight', ...STAT_ORDER],
  rows: rows.filter(Boolean).sort((a, b) => a[0] - b[0]),
};
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(out));
console.log(`Wrote ${out.rows.length} rows to ${OUT}`);
