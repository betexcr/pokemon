import { describe, it, expect } from 'vitest';
import { evTotal, hpFromBase, maxHpFor, natureMultiplier, otherStatFromBase, sanitizeEvs } from '../battle-evs';
import { rawStat } from '../battle-stats';
import { getEffectiveSpeed, type BattlePokemon } from '../team-battle-engine';

function mon(o: Partial<BattlePokemon> = {}, base = 100): BattlePokemon {
  return {
    pokemon: {
      id: 1, name: 'm', types: [{ type: { name: 'normal' } }] as any,
      stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((n) => ({ stat: { name: n }, base_stat: base })),
      weight: 100, abilities: [],
    } as any,
    level: 50, currentHp: 100, maxHp: 100, moves: [], volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    ...o,
  };
}

describe('EV spreads', () => {
  it('sanitizes to 252 per stat and 510 total', () => {
    expect(sanitizeEvs({ attack: 300, speed: 252, hp: 100 })).toEqual({ hp: 100, attack: 252, speed: 158 });
    expect(evTotal(sanitizeEvs({ hp: 252, attack: 252, defense: 252 }))).toBe(510);
    expect(sanitizeEvs({ attack: -4, speed: 'x' })).toBeUndefined();
    expect(sanitizeEvs(null)).toBeUndefined();
  });

  it('matches the main-series formulas (Garchomp, level 100, Jolly 252 Atk / 252 Spe)', () => {
    // Base 108 HP, 130 Atk, 102 Spe
    expect(hpFromBase(108, 100, 4)).toBe(358);
    expect(otherStatFromBase(130, 100, 252, natureMultiplier('jolly', 'attack'))).toBe(359);
    expect(otherStatFromBase(102, 100, 252, natureMultiplier('jolly', 'speed'))).toBe(333);
    expect(otherStatFromBase(80, 100, 0, natureMultiplier('jolly', 'special-attack'))).toBe(176);
    expect(hpFromBase(1, 100, 252)).toBe(1); // Shedinja
  });

  it('feeds every raw stat, max HP and Speed in battle', () => {
    const plain = mon();
    const invested = mon({ evs: { attack: 252, speed: 252 }, nature: 'adamant' });
    expect(rawStat(invested, 'attack')).toBe(Math.floor((Math.floor(((200 + 31 + 63) * 50) / 100) + 5) * 1.1));
    expect(rawStat(invested, 'special-attack')).toBeLessThan(rawStat(plain, 'special-attack'));
    expect(getEffectiveSpeed(invested)).toBeGreaterThan(getEffectiveSpeed(plain));
    expect(maxHpFor(plain.pokemon.stats as any, 50, { hp: 252 })).toBe(hpFromBase(100, 50) + 32);
  });

  it('applies nature to all stats, not only Speed', () => {
    expect(rawStat(mon({ nature: 'modest' }), 'special-attack')).toBe(Math.floor(rawStat(mon(), 'special-attack') * 1.1));
    expect(rawStat(mon({ nature: 'modest' }), 'attack')).toBe(Math.floor(rawStat(mon(), 'attack') * 0.9));
  });
});

describe('team builder helpers', () => {
  it('computes all six stats for a slot', async () => {
    const { slotStats, fixedGenderForRate } = await import('../battle-evs');
    const stats = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((n) => ({ stat: { name: n }, base_stat: 100 }));
    const s = slotStats(stats, 100, 'adamant', { attack: 252 });
    expect(s.hp).toBe(hpFromBase(100, 100));
    expect(s.attack).toBe(otherStatFromBase(100, 100, 252, 1.1));
    expect(s['special-attack']).toBe(otherStatFromBase(100, 100, 0, 0.9));
    expect(fixedGenderForRate(-1)).toBe('genderless');
    expect(fixedGenderForRate(0)).toBe('male');
    expect(fixedGenderForRate(8)).toBe('female');
    expect(fixedGenderForRate(4)).toBeUndefined();
  });

  it('only accepts abilities the species can have', async () => {
    const { legalSlotAbility } = await import('../battle-default-ability');
    const abilities = [{ ability: { name: 'blaze' }, is_hidden: false, slot: 1 }, { ability: { name: 'solar-power' }, is_hidden: true, slot: 3 }];
    expect(legalSlotAbility('solar-power', abilities)).toBe('solar-power');
    expect(legalSlotAbility('Solar Power', abilities)).toBe('solar-power');
    expect(legalSlotAbility('drought', abilities)).toBeUndefined();
  });
});
