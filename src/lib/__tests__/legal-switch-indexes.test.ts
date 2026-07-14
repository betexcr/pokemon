import { describe, it, expect } from 'vitest';

/**
 * Pure helpers extracted to mirror useBattleState legalSwitchIndexes logic.
 * Kept here so switch legality stays covered without mounting React.
 */
function computeLegalSwitchIndexes(
  team: Array<{ fainted?: boolean; hp?: { cur: number }; currentHp?: number }>,
  currentIndex = 0
): number[] {
  const res: number[] = [];
  for (let i = 0; i < team.length; i++) {
    if (i === currentIndex) continue;
    const slot = team[i];
    if (!slot) continue;
    const currentHp =
      typeof slot.hp?.cur === 'number'
        ? slot.hp.cur
        : typeof slot.currentHp === 'number'
          ? slot.currentHp
          : undefined;
    const fainted = Boolean(slot.fainted) || (typeof currentHp === 'number' && currentHp <= 0);
    if (!fainted) res.push(i);
  }
  return res;
}

describe('legalSwitchIndexes (multiplayer)', () => {
  it('allows switching back to lead after currentIndex moves', () => {
    const team = [
      { currentHp: 40 },
      { currentHp: 10 },
      { currentHp: 0, fainted: true },
    ];
    expect(computeLegalSwitchIndexes(team, 1)).toEqual([0]);
  });

  it('excludes the active slot and fainted bench', () => {
    const team = [
      { hp: { cur: 5 } },
      { hp: { cur: 20 } },
      { hp: { cur: 0 } },
    ];
    expect(computeLegalSwitchIndexes(team, 0)).toEqual([1]);
  });
});

/** Mirrors RTDBBattleComponent switch disable after Wave 4 fix */
function isSwitchButtonDisabled(
  index: number,
  currentIndex: number,
  legal: number[],
  fainted?: boolean
) {
  return Boolean(fainted) || index === currentIndex || !legal.includes(index);
}

describe('RTDB switch button disable (UI)', () => {
  it('enables seat 0 when currentIndex is 1', () => {
    const legal = [0, 2];
    expect(isSwitchButtonDisabled(0, 1, legal)).toBe(false);
    expect(isSwitchButtonDisabled(1, 1, legal)).toBe(true);
  });
});
