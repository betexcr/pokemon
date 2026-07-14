import { describe, it, expect } from 'vitest';
import {
  applyDynamicBasePower,
  attackerHasGuts,
  computeAttackDefensePowerMultipliers,
  fieldWeatherToDamageWeather,
  prepareLiveDamageModifiers,
  toDamageTypeName,
} from '../battle-damage-modifiers';
import type { BattlePokemon } from '../team-battle-engine';
import { createBattleRng } from '../battle-rng';

function mon(overrides: Partial<BattlePokemon> = {}): BattlePokemon {
  return {
    pokemon: {
      id: 1,
      name: 'test',
      types: [{ type: { name: 'normal' } }],
      stats: [],
      abilities: [],
      weight: 100,
    } as any,
    level: 50,
    currentHp: 100,
    maxHp: 100,
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
    ...overrides,
  };
}

describe('battle-damage-modifiers', () => {
  it('maps field weather/types for the calculator', () => {
    expect(fieldWeatherToDamageWeather('snow')).toBe('Hail');
    expect(toDamageTypeName('fire')).toBe('Fire');
  });

  it('applies Knock Off / Facade / Technician BP hooks', () => {
    const attacker = mon({ status: 'burned', currentAbility: 'technician' });
    const defender = mon({ heldItem: 'leftovers' });
    expect(
      applyDynamicBasePower({
        basePower: 40,
        moveId: 'knock-off',
        moveType: 'dark',
        attacker,
        defender,
      })
    ).toBe(Math.floor(40 * 1.5 * 1.5)); // knock-off then technician on ≤60

    expect(
      applyDynamicBasePower({
        basePower: 70,
        moveId: 'facade',
        moveType: 'normal',
        attacker,
        defender: mon(),
      })
    ).toBe(140);
  });

  it('detects Guts and Choice Band multiplier', () => {
    const gutsMon = mon({ currentAbility: 'guts', status: 'burned', heldItem: 'choice-band' });
    expect(attackerHasGuts(gutsMon)).toBe(true);
    const m = computeAttackDefensePowerMultipliers({
      isPhysical: true,
      moveType: 'normal',
      attacker: gutsMon,
      defender: mon(),
    });
    expect(m.attackMultiplier).toBe(1.5);
  });

  it('prepareLiveDamageModifiers is deterministic for fixed seed', () => {
    const prep = prepareLiveDamageModifiers({
      rng: createBattleRng(42),
      move: { power: 80, type: 'Normal', category: 'Physical', critRateStage: 0 },
      moveId: 'tackle',
      weatherKind: 'sun',
      terrainKind: 'electric',
      attacker: mon({ heldItem: 'choice-band' }),
      defender: mon({ heldItem: 'eviolite' }),
    });
    expect(prep.weather).toBe('Sun');
    expect(prep.terrain).toBe('Electric');
    expect(prep.attackMultiplier).toBe(1.5);
    expect(prep.defenseMultiplier).toBe(1.5);
    expect(prep.movePower).toBe(80);
  });
});
