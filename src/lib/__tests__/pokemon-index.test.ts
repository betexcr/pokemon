import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const INDEX_PATH = join(__dirname, '..', '..', '..', 'public', 'data', 'pokemon-index.json');

describe('public/data/pokemon-index.json', () => {
  const file = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));

  it('has the expected layout and covers the National Dex', () => {
    expect(file.version).toBe(1);
    expect(file.fields).toEqual(['id', 'name', 'types', 'height', 'weight', 'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']);
    const ids = new Set(file.rows.map((r: unknown[]) => r[0]));
    for (let id = 1; id <= 1025; id++) expect(ids.has(id)).toBe(true);
    for (const row of file.rows) {
      expect(row).toHaveLength(11);
      expect(typeof row[1]).toBe('string');
      expect(row[2]).toMatch(/^[a-z]+(\/[a-z]+)?$/);
    }
  });

  it('has correct data for known Pokémon', () => {
    const byId = new Map<number, unknown[]>(file.rows.map((r: unknown[]) => [r[0] as number, r]));
    expect(byId.get(6)).toEqual([6, 'charizard', 'fire/flying', 17, 905, 78, 84, 78, 109, 85, 100]);
    expect(byId.get(150)?.slice(0, 3)).toEqual([150, 'mewtwo', 'psychic']);
  });
});

describe('getPokemonIndex', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('turns rows into Pokémon with types and base stats the Pokédex can sort on', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ version: 1, fields: [], rows: [[6, 'charizard', 'fire/flying', 17, 905, 78, 84, 78, 109, 85, 100]] }),
    })));
    const { getPokemonIndex } = await import('../api');
    const [charizard] = (await getPokemonIndex())!;
    expect(charizard.id).toBe(6);
    expect(charizard.name).toBe('charizard');
    expect(charizard.types.map((t) => t.type.name)).toEqual(['fire', 'flying']);
    expect(charizard.stats.find((s) => s.stat.name === 'attack')?.base_stat).toBe(84);
    expect(charizard.stats.reduce((sum, s) => sum + s.base_stat, 0)).toBe(534);
    expect(charizard.height).toBe(17);
  });

  it('returns null when the file is unavailable (the Pokédex falls back to fetching records)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })));
    const { getPokemonIndex } = await import('../api');
    expect(await getPokemonIndex()).toBeNull();
  });
});
