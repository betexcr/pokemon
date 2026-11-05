import { describe, it, expect } from 'vitest';
import { describeBattleConditions } from '../battle-conditions';
import type { BattlePokemon, BattleState, BattleTeam } from '../team-battle-engine';
import { createFieldState, EMPTY_HAZARDS } from '../team-battle-types';

const mon = (o: Partial<BattlePokemon> = {}): BattlePokemon => ({
  pokemon: { id: 1, name: 'm', types: [{ type: { name: 'normal' } }], stats: [], weight: 1, abilities: [] } as never,
  level: 50, currentHp: 100, maxHp: 100, moves: [], volatile: {},
  statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
  ...o,
});
const team = (m: BattlePokemon, extra: Partial<BattleTeam['sideConditions']> = {}): BattleTeam =>
  ({ pokemon: [m], currentIndex: 0, faintedCount: 0, sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS }, ...extra } }) as BattleTeam;

describe('describeBattleConditions', () => {
  it('lists field, side and active conditions with timers', () => {
    const field = createFieldState();
    field.weather = { kind: 'rain', turns: 3 } as never;
    field.terrain = { kind: 'grassy', turns: 2 } as never;
    field.rooms = { trickRoom: { turns: 4 } };
    const p1 = mon({ terastallized: true, teraType: 'stellar', volatile: { substitute: { hp: 25 }, charged: true } });
    const p2 = mon({ volatile: { confusion: { turns: 2 }, perishSong: { turns: 2 }, trapped: { by: 'player' } } });
    const state = {
      field,
      player: team(p1, { screens: { reflect: { turns: 5 }, tailwind: { turns: 3 } } }),
      opponent: team(p2, {
        hazards: { ...EMPTY_HAZARDS, stealthRock: true, spikes: 2 },
        futureAttack: { move: 'future-sight', turns: 2, user: 'x', level: 50, attackStat: 1, attackerTypes: [], power: 120, type: 'Psychic' },
      }),
    } as unknown as BattleState;
    const c = describeBattleConditions(state);
    expect(c.field.map((t) => [t.label, t.turns])).toEqual([['Rain', 3], ['Grassy Terrain', 2], ['Trick Room', 4]]);
    expect(c.p1.map((t) => t.label)).toEqual(['Tera Stellar', 'Substitute', 'Charged', 'Reflect', 'Tailwind']);
    expect(c.p2.map((t) => t.label)).toEqual(['Confused', 'Perish 2', "Can't escape", 'Stealth Rock', 'Spikes ×2', 'Future Sight incoming']);
    // RTDB rejects undefined: untimed tags carry no `turns` key at all
    expect(JSON.stringify(c)).not.toContain('undefined');
    expect('turns' in c.p1[1]).toBe(false);
  });

  it('shows nothing for a fainted active', () => {
    const state = { field: createFieldState(), player: team(mon({ currentHp: 0, volatile: { confusion: { turns: 1 } } })), opponent: team(mon()) } as unknown as BattleState;
    expect(describeBattleConditions(state).p1).toEqual([]);
  });
});
