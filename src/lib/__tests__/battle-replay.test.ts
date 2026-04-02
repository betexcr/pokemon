import { describe, it, expect } from 'vitest';
import { hashBattleState, stableStringify } from '../battle-replay';
import { createBattleRng } from '../battle-rng';
import { createFieldState } from '../team-battle-types';
import type { BattleState } from '../team-battle-engine';

function makeState(seed: number): BattleState {
  return {
    player: { pokemon: [], currentIndex: 0, faintedCount: 0, sideConditions: {} },
    opponent: { pokemon: [], currentIndex: 0, faintedCount: 0, sideConditions: {} },
    turn: 1,
    rng: createBattleRng(seed),
    battleLog: [{ type: 'turn_start', message: 'Turn 1' }],
    isComplete: false,
    phase: 'choice',
    actionQueue: [],
    field: createFieldState(),
  };
}

describe('battle replay artifacts', () => {
  it('stableStringify is key-order deterministic', () => {
    const a = { b: 1, a: { y: 2, x: 3 } };
    const b = { a: { x: 3, y: 2 }, b: 1 };
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it('hashBattleState is deterministic for same state', () => {
    const s1 = makeState(123);
    const s2 = makeState(123);
    expect(hashBattleState(s1)).toBe(hashBattleState(s2));
  });
});
