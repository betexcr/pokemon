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
