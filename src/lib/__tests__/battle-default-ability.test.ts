import { describe, it, expect, vi } from 'vitest';
import { resolveBattleAbility } from '../battle-default-ability';

vi.mock('../server/create-rtdb-battle', () => ({ TURN_DEADLINE_MS: 30_000 }));
vi.mock('../multiplayer/handleBattleEnd', () => ({ handleBattleEnd: vi.fn() }));

const GYARADOS_ABILITIES = [
  { ability: { name: 'moxie' }, is_hidden: true, slot: 3 },
  { ability: { name: 'intimidate' }, is_hidden: false, slot: 1 },
];

describe('resolveBattleAbility', () => {
  it('defaults to the first non-hidden ability by slot', () => {
    expect(resolveBattleAbility({}, GYARADOS_ABILITIES)).toBe('intimidate');
  });

  it('prefers an ability chosen on the team slot', () => {
    expect(resolveBattleAbility({ ability: 'Moxie' }, GYARADOS_ABILITIES)).toBe('moxie');
    expect(resolveBattleAbility({ ability: { name: 'moxie' } }, GYARADOS_ABILITIES)).toBe('moxie');
  });

  it('keeps an ability already in play (persisted between multiplayer turns)', () => {
    expect(resolveBattleAbility({ currentAbility: 'levitate', ability: 'moxie' }, GYARADOS_ABILITIES)).toBe('levitate');
  });

  it('falls back to a hidden ability, then to nothing', () => {
    expect(resolveBattleAbility({}, [{ ability: { name: 'moxie' }, is_hidden: true, slot: 3 }])).toBe('moxie');
    expect(resolveBattleAbility({}, [])).toBeUndefined();
    expect(resolveBattleAbility(undefined, undefined)).toBeUndefined();
  });
});

describe('multiplayer hydration', () => {
  it('gives hydrated Pokémon their species ability', async () => {
    const { __test__ } = await import('../battle-resolution');
    const [mon] = await __test__.hydrateTeam([
      {
        pokemon: {
          id: 130,
          name: 'gyarados',
          types: [{ type: { name: 'water' } }],
          stats: [{ stat: { name: 'hp' }, base_stat: 95 }],
          abilities: GYARADOS_ABILITIES,
        },
        level: 50,
        moves: ['waterfall'],
      },
    ]);
    expect(mon.currentAbility).toBe('intimidate');
  });
});
