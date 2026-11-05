import { describe, it, expect, vi, afterEach } from 'vitest';
import { BATTLE_ITEMS, getBattleItem, sanitizeBattleItem } from '../battle-items-catalog';
import { STAT_BOOST_BERRIES, TYPE_RESIST_BERRIES } from '../team-battle-items';
import { TYPE_BOOST_ITEMS } from '../battle-move-constants';
import { normalizeTeamForRTDB } from '../server/normalize-team-rtdb';

describe('battle item catalog', () => {
  it('has unique ids and includes every berry and type-boost item the engine knows', () => {
    const ids = BATTLE_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of [...Object.keys(STAT_BOOST_BERRIES), ...Object.keys(TYPE_RESIST_BERRIES), ...Object.keys(TYPE_BOOST_ITEMS)]) {
      expect(ids).toContain(id);
    }
  });

  it('sanitizes ids and rejects unsupported items', () => {
    expect(sanitizeBattleItem('Choice Scarf')).toBe('choice-scarf');
    expect(sanitizeBattleItem('leftovers')).toBe('leftovers');
    expect(sanitizeBattleItem('master-ball')).toBeUndefined();
    expect(sanitizeBattleItem(42)).toBeUndefined();
    expect(getBattleItem('life-orb')?.label).toBe('Life Orb');
  });
});

describe('normalizeTeamForRTDB held items', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps supported items as heldItem and drops unknown ones', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        name: 'pikachu',
        weight: 60,
        types: [{ type: { name: 'electric' } }],
        abilities: [],
        stats: [{ stat: { name: 'hp' }, base_stat: 35 }],
      }),
    })));
    const team = await normalizeTeamForRTDB([
      { id: 25, name: 'pikachu', moves: ['thunderbolt'], item: 'light-clay' },
      { id: 25, name: 'pikachu', moves: ['thunderbolt'], item: 'master-ball' },
      { id: 25, name: 'pikachu', moves: ['thunderbolt'] },
    ]);
    expect(team[0].heldItem).toBe('light-clay');
    expect(team[1]).not.toHaveProperty('heldItem');
    expect(team[2]).not.toHaveProperty('heldItem');
    expect(team[0].teraType).toBe('electric');
  });
});
