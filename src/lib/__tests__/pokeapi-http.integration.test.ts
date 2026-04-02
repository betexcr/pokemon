import { describe, it, expect } from 'vitest';

const runNetwork = process.env.RUN_POKEAPI_TESTS === '1';

describe.skipIf(!runNetwork)('PokeAPI HTTP smoke (RUN_POKEAPI_TESTS=1)', () => {
  it('move/thunderbolt responds with JSON', async () => {
    const r = await fetch('https://pokeapi.co/api/v2/move/thunderbolt');
    expect(r.ok).toBe(true);
    const j = (await r.json()) as { name?: string };
    expect(j.name).toBe('thunderbolt');
  }, 20_000);
});
