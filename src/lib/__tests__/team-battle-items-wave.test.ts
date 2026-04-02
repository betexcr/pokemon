import { describe, it, expect } from 'vitest';
import { tryConsumeBerry } from '../team-battle-items';
import type { BattleState, BattlePokemon } from '../team-battle-engine';
import { createFieldState } from '../team-battle-types';
import { createBattleRng } from '../battle-rng';

function slot(
  name: string,
  item: string | undefined,
  hp: number,
  max: number,
  ability?: string
): BattlePokemon {
  return {
    pokemon: {
      id: 1,
      name,
      types: [{ type: { name: 'normal' } }],
      stats: [],
      weight: 100,
      abilities: [],
    } as BattlePokemon['pokemon'],
    level: 50,
    currentHp: hp,
    maxHp: max,
    moves: [],
    volatile: {},
    statModifiers: {
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0,
    },
    heldItem: item,
    currentAbility: ability,
  };
}

function st(player: BattlePokemon, opp: BattlePokemon): BattleState {
  return {
    player: { pokemon: [player], currentIndex: 0, faintedCount: 0, sideConditions: {} },
    opponent: { pokemon: [opp], currentIndex: 0, faintedCount: 0, sideConditions: {} },
    turn: 1,
    rng: createBattleRng(1),
    battleLog: [],
    isComplete: false,
    phase: 'choice',
    actionQueue: [],
    field: createFieldState(),
  };
}

describe('item wave (oran berry, unnerve blocks berries)', () => {
  it('Oran Berry restores 10 HP at low HP', () => {
    const p = slot('a', 'oran-berry', 40, 100);
    const battle = st(p, slot('b', undefined, 100, 100));
    tryConsumeBerry(battle, p, 'player');
    expect(p.currentHp).toBe(50);
    expect(p.heldItem).toBeUndefined();
  });

  it('Unnerve prevents berry consumption', () => {
    const p = slot('a', 'sitrus-berry', 40, 100);
    const o = slot('b', undefined, 100, 100, 'unnerve');
    const battle = st(p, o);
    tryConsumeBerry(battle, p, 'player');
    expect(p.heldItem).toBe('sitrus-berry');
    expect(p.currentHp).toBe(40);
  });
});
