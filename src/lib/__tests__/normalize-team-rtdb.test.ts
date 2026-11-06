import { describe, it, expect, vi, afterEach } from 'vitest';
import { normalizeTeamForRTDB, TeamHydrationError, __test__ } from '../server/normalize-team-rtdb';

describe('normalizeTeamForRTDB', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects empty teams', async () => {
    await expect(normalizeTeamForRTDB([])).rejects.toBeInstanceOf(TeamHydrationError);
  });

  it('rejects slots without moves', async () => {
    await expect(
      normalizeTeamForRTDB([{ id: 1, name: 'bulbasaur' }])
    ).rejects.toThrow(/no valid moves|no moves/i);
  });

  it('clamps level and nature', () => {
    expect(__test__.clampLevel(250)).toBe(100);
    expect(__test__.clampLevel(0)).toBe(1);
    expect(__test__.sanitizeNature('jolly')).toBe('jolly');
    expect(__test__.sanitizeNature('not-a-nature')).toBe('hardy');
  });

  it('uses absolute pokeapi.co URL and ignores client stats', async () => {
    expect(__test__.POKEAPI_ABSOLUTE).toBe('https://pokeapi.co/api/v2/pokemon');

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        expect(String(url)).toMatch(/^https:\/\/pokeapi\.co\/api\/v2\/pokemon\//);
        return {
          ok: true,
          json: async () => ({
            name: 'pikachu',
            weight: 60,
            types: [{ type: { name: 'electric' } }],
            abilities: [],
            stats: [
              { stat: { name: 'hp' }, base_stat: 35 },
              { stat: { name: 'attack' }, base_stat: 55 },
              { stat: { name: 'defense' }, base_stat: 40 },
              { stat: { name: 'special-attack' }, base_stat: 50 },
              { stat: { name: 'special-defense' }, base_stat: 50 },
              { stat: { name: 'speed' }, base_stat: 90 },
            ],
          }),
        };
      })
    );

    const team = await normalizeTeamForRTDB([
      {
        id: 25,
        name: 'pikachu',
        moves: ['thunderbolt'],
        // Inflated client values — must be ignored
        maxHp: 9999,
        currentHp: 9999,
        stats: [{ stat: { name: 'hp' }, base_stat: 999 }],
      },
    ]);

    expect(team).toHaveLength(1);
    expect((team[0].pokemon as any).name).toBe('pikachu');
    expect(team[0].maxHp).toBeLessThan(300);
    expect(team[0].currentHp).toBe(team[0].maxHp);
    expect((team[0].pokemon as any).stats[0].base_stat).toBe(35);
  });

  it('fails closed when pokeapi fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })));
    await expect(
      normalizeTeamForRTDB([{ id: 25, moves: ['thunderbolt'] }])
    ).rejects.toThrow(/Failed to hydrate stats/i);
  });
});

describe('normalizeTeamForRTDB team-builder fields', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps legal abilities, EVs and gender; drops illegal abilities and over-limit EVs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          name: 'gyarados',
          weight: 2350,
          types: [{ type: { name: 'water' } }, { type: { name: 'flying' } }],
          abilities: [
            { ability: { name: 'intimidate' }, is_hidden: false, slot: 1 },
            { ability: { name: 'moxie' }, is_hidden: true, slot: 3 },
          ],
          stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((n) => ({ stat: { name: n }, base_stat: 95 })),
        }),
      })),
    );
    const [legal, illegal] = await normalizeTeamForRTDB([
      { id: 130, moves: ['waterfall'], ability: 'moxie', evs: { attack: 252, speed: 252, hp: 252 }, gender: 'female', shiny: true },
      { id: 130, moves: ['waterfall'], ability: 'huge-power', isShiny: false },
    ]);
    // Shiny colouring from the team builder (isShiny) or the lobby (shiny)
    expect(legal.shiny).toBe(true);
    expect(illegal.shiny).toBeUndefined();
    expect(legal.ability).toBe('moxie');
    expect(legal.evs).toEqual({ hp: 252, attack: 252, speed: 6 });
    expect(legal.gender).toBe('female');
    // HP EVs raise max HP: floor((190 + 31 + 63) * 50 / 100) + 60
    expect(legal.maxHp).toBe(202);
    expect(illegal.ability).toBeUndefined();
  });
});
