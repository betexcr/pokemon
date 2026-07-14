import { describe, it, expect, vi } from 'vitest';
import type { BattlePokemon, BattleState, BattleTeam } from '../team-battle-engine';
import {
  getEffectiveSpeed,
  canUseMove,
  isTailwindActive,
} from '../team-battle-engine';
import { applyVolatileAndHazardScripts, setTailwind, clearSideHazards } from '../team-battle-scripts';
import { applyEntryHazards } from '../team-battle-hazards';
import { checkTypeResistBerry, removeHeldItem } from '../team-battle-items';
import { calculateComprehensiveDamage } from '../damage-calculator';
import { createBattleRng } from '../battle-rng';
import { createFieldState, EMPTY_HAZARDS } from '../team-battle-types';
import { processEndOfTurn } from '../team-battle-engine-additional';

vi.mock('../moveCache', () => {
  const cache = new Map([
    ['growl', { name: 'growl', type: 'Normal', category: 'Status', power: 0, accuracy: 100, priority: 0 }],
    ['tackle', { name: 'tackle', type: 'Normal', category: 'Physical', power: 40, accuracy: 100, priority: 0 }],
  ]);
  return {
    getMove: vi.fn(async (id: string) => cache.get(String(id).toLowerCase()) ?? {
      name: id,
      type: 'Normal',
      category: 'Physical',
      power: 40,
      accuracy: 100,
      priority: 0,
    }),
    getCachedMove: (id: string) => cache.get(String(id).toLowerCase()) ?? null,
  };
});

function makePokemon(overrides: Partial<BattlePokemon> = {}): BattlePokemon {
  return {
    pokemon: {
      id: 1,
      name: 'testmon',
      types: [{ type: { name: 'normal' } }] as any,
      stats: [
        { stat: { name: 'hp' }, base_stat: 100 },
        { stat: { name: 'attack' }, base_stat: 100 },
        { stat: { name: 'defense' }, base_stat: 80 },
        { stat: { name: 'special-attack' }, base_stat: 50 },
        { stat: { name: 'special-defense' }, base_stat: 70 },
        { stat: { name: 'speed' }, base_stat: 100 },
      ],
      weight: 100,
      abilities: [],
    } as any,
    level: 50,
    currentHp: 200,
    maxHp: 200,
    moves: [
      { id: 'tackle', pp: 20, maxPp: 20 },
      { id: 'growl', pp: 20, maxPp: 20 },
    ],
    volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    ...overrides,
  };
}

function makeTeam(active: BattlePokemon): BattleTeam {
  return {
    pokemon: [active],
    currentIndex: 0,
    faintedCount: 0,
    sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } },
  };
}

function makeState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    player: makeTeam(makePokemon()),
    opponent: makeTeam(makePokemon({ pokemon: { ...makePokemon().pokemon, name: 'foe' } as any })),
    turn: 1,
    field: createFieldState(),
    battleLog: [],
    actionQueue: [],
    rng: createBattleRng('m1-m3'),
    isComplete: false,
    phase: 'choice',
    ...overrides,
  } as BattleState;
}

describe('M1 volatiles + hazards', () => {
  it('sets Encore / Taunt / Disable / Leech Seed volatiles', () => {
    const state = makeState();
    const atk = state.player.pokemon[0];
    const def = state.opponent.pokemon[0];
    def.volatile.lastMoveUsed = 'tackle';

    expect(applyVolatileAndHazardScripts(state, 'encore', atk, def, true)).toBe(true);
    expect(def.volatile.encore?.move).toBe('tackle');
    expect(def.volatile.encore?.turns).toBe(3);

    expect(applyVolatileAndHazardScripts(state, 'taunt', atk, def, true)).toBe(true);
    expect(def.volatile.taunt?.turns).toBe(3);

    def.volatile.disable = undefined;
    expect(applyVolatileAndHazardScripts(state, 'disable', atk, def, true)).toBe(true);
    expect(def.volatile.disable?.move).toBe('tackle');

    expect(applyVolatileAndHazardScripts(state, 'leech-seed', atk, def, true)).toBe(true);
    expect(def.volatile.leechSeed).toBe(true);
  });

  it('sets Substitute and Tailwind on screens.tailwind', () => {
    const state = makeState();
    const atk = state.player.pokemon[0];
    const def = state.opponent.pokemon[0];
    expect(applyVolatileAndHazardScripts(state, 'substitute', atk, def, true)).toBe(true);
    expect(atk.volatile.substitute?.hp).toBeGreaterThan(0);
    expect(atk.currentHp).toBe(200 - Math.floor(200 / 4));

    expect(applyVolatileAndHazardScripts(state, 'tailwind', atk, def, true)).toBe(true);
    expect(isTailwindActive(state.player)).toBe(true);
    expect(state.player.sideConditions.screens.tailwind?.turns).toBe(4);
  });

  it('Heavy-Duty Boots skip Stealth Rock; Rapid Spin clears spikes', () => {
    const withBoots = makePokemon({ heldItem: 'heavy-duty-boots' });
    const hazards = { ...EMPTY_HAZARDS, stealthRock: true, spikes: 3 };
    expect(applyEntryHazards(withBoots, hazards).damage).toBe(0);

    const state = makeState();
    state.player.sideConditions.hazards.spikes = 2;
    state.player.sideConditions.hazards.stealthRock = true;
    applyVolatileAndHazardScripts(
      state,
      'rapid-spin',
      state.player.pokemon[0],
      state.opponent.pokemon[0],
      true
    );
    expect(state.player.sideConditions.hazards.spikes).toBe(0);
    expect(state.player.sideConditions.hazards.stealthRock).toBe(false);
  });

  it('Wish heals after countdown', async () => {
    const state = makeState();
    const mon = state.player.pokemon[0];
    mon.currentHp = 50;
    mon.volatile.wish = { turns: 1, heal: 40 };
    await processEndOfTurn(state);
    expect(mon.currentHp).toBe(90);
    expect(mon.volatile.wish).toBeUndefined();
  });
});

describe('M2 speed + Choice', () => {
  it('Choice Scarf and Chlorophyll multiply speed; Tailwind doubles', () => {
    const base = makePokemon();
    const scarf = makePokemon({ heldItem: 'choice-scarf' });
    expect(getEffectiveSpeed(scarf)).toBe(Math.floor(getEffectiveSpeed(base) * 1.5));

    const chloro = makePokemon({ currentAbility: 'chlorophyll' });
    const underSun = getEffectiveSpeed(chloro, false, { weather: { kind: 'sun' } });
    expect(underSun).toBe(getEffectiveSpeed(base) * 2);

    setTailwind(makeTeam(base), 4);
    const side = makeTeam(base);
    setTailwind(side, 4);
    expect(getEffectiveSpeed(base, isTailwindActive(side))).toBe(getEffectiveSpeed(base) * 2);
  });

  it('choiceLock blocks other moves; Assault Vest blocks status', () => {
    const rng = createBattleRng('choice');
    const locked = makePokemon({
      heldItem: 'choice-band',
      volatile: { choiceLock: 'tackle' },
    });
    expect(canUseMove(locked, 'growl', rng).canUse).toBe(false);
    expect(canUseMove(locked, 'tackle', rng).canUse).toBe(true);

    const vest = makePokemon({ heldItem: 'assault-vest' });
    expect(canUseMove(vest, 'growl', rng).canUse).toBe(false);
  });

  it('Unburden doubles speed after item loss', () => {
    const mon = makePokemon({ currentAbility: 'unburden', heldItem: 'leftovers' });
    const before = getEffectiveSpeed(mon);
    removeHeldItem(mon);
    expect(mon.volatile.unburdenActive).toBe(true);
    expect(getEffectiveSpeed(mon)).toBe(before * 2);
  });
});

describe('M3 damage + resist berries', () => {
  it('type-resist berry halves SE damage and consumes', () => {
    const state = makeState();
    const target = state.opponent.pokemon[0];
    target.heldItem = 'occa-berry';
    target.pokemon.types = [{ type: { name: 'grass' } }] as any;
    const mult = checkTypeResistBerry(state, target, 'Fire', 2, 'opponent');
    expect(mult).toBe(0.5);
    expect(target.heldItem).toBeUndefined();
  });

  it('Unnerve blocks resist berry', () => {
    const state = makeState();
    state.player.pokemon[0].currentAbility = 'unnerve';
    const target = state.opponent.pokemon[0];
    target.heldItem = 'occa-berry';
    expect(checkTypeResistBerry(state, target, 'Fire', 2, 'opponent')).toBe(1);
    expect(target.heldItem).toBe('occa-berry');
  });

  it('Guts boosts attack; Technician boosts low BP; Unaware ignores foe Def stages', () => {
    const rng = createBattleRng('dmg');
    const base = calculateComprehensiveDamage({
      level: 50,
      movePower: 60,
      moveType: 'Normal',
      attackerTypes: ['Normal'],
      defenderTypes: ['Normal'],
      attackStat: 100,
      defenseStat: 100,
      attackStatStages: 0,
      defenseStatStages: 0,
      isPhysical: true,
      isBurned: true,
      hasGuts: false,
      rng: createBattleRng('a'),
      precomputedCrit: false,
    });
    const guts = calculateComprehensiveDamage({
      level: 50,
      movePower: 60,
      moveType: 'Normal',
      attackerTypes: ['Normal'],
      defenderTypes: ['Normal'],
      attackStat: 100,
      defenseStat: 100,
      isPhysical: true,
      isBurned: true,
      hasGuts: true,
      rng: createBattleRng('a'),
      precomputedCrit: false,
    });
    expect(guts.damage).toBeGreaterThan(base.damage);

    const techPower = Math.floor(40 * 1.5);
    const tech = calculateComprehensiveDamage({
      level: 50,
      movePower: techPower,
      moveType: 'Normal',
      attackerTypes: ['Bug'],
      defenderTypes: ['Normal'],
      attackStat: 100,
      defenseStat: 100,
      isPhysical: true,
      powerMultiplier: 1,
      rng: createBattleRng('t'),
      precomputedCrit: false,
    });
    const noTech = calculateComprehensiveDamage({
      level: 50,
      movePower: 40,
      moveType: 'Normal',
      attackerTypes: ['Bug'],
      defenderTypes: ['Normal'],
      attackStat: 100,
      defenseStat: 100,
      isPhysical: true,
      rng: createBattleRng('t'),
      precomputedCrit: false,
    });
    expect(tech.damage).toBeGreaterThan(noTech.damage);

    const boostedDef = calculateComprehensiveDamage({
      level: 50,
      movePower: 80,
      moveType: 'Normal',
      attackerTypes: ['Normal'],
      defenderTypes: ['Normal'],
      attackStat: 100,
      defenseStat: 100,
      defenseStatStages: 2,
      isPhysical: true,
      rng,
      precomputedCrit: false,
    });
    const unaware = calculateComprehensiveDamage({
      level: 50,
      movePower: 80,
      moveType: 'Normal',
      attackerTypes: ['Normal'],
      defenderTypes: ['Normal'],
      attackStat: 100,
      defenseStat: 100,
      defenseStatStages: 2,
      ignoreDefenderStages: true,
      isPhysical: true,
      rng: createBattleRng('m1-m3'),
      precomputedCrit: false,
    });
    expect(unaware.damage).toBeGreaterThan(boostedDef.damage);
  });

  it('crit ignores negative Attack stages', () => {
    const shared = {
      level: 50,
      movePower: 80,
      moveType: 'Normal' as const,
      attackerTypes: ['Normal' as const],
      defenderTypes: ['Normal' as const],
      attackStat: 100,
      defenseStat: 100,
      isPhysical: true,
    };
    const withNeg = calculateComprehensiveDamage({
      ...shared,
      attackStatStages: -2,
      precomputedCrit: false,
      rng: createBattleRng('c1'),
    });
    const critIgnores = calculateComprehensiveDamage({
      ...shared,
      attackStatStages: Math.max(0, -2),
      precomputedCrit: true,
      rng: createBattleRng('c1'),
    });
    expect(critIgnores.damage).toBeGreaterThan(withNeg.damage);
  });

  it('Assault Vest and Eviolite raise defenses via multipliers', () => {
    const base = calculateComprehensiveDamage({
      level: 50,
      movePower: 80,
      moveType: 'Psychic',
      attackerTypes: ['Psychic'],
      defenderTypes: ['Normal'],
      attackStat: 100,
      defenseStat: 100,
      isPhysical: false,
      rng: createBattleRng('av'),
      precomputedCrit: false,
    });
    const vest = calculateComprehensiveDamage({
      level: 50,
      movePower: 80,
      moveType: 'Psychic',
      attackerTypes: ['Psychic'],
      defenderTypes: ['Normal'],
      attackStat: 100,
      defenseStat: 100,
      isPhysical: false,
      defenseMultiplier: 1.5,
      rng: createBattleRng('av'),
      precomputedCrit: false,
    });
    expect(vest.damage).toBeLessThan(base.damage);
  });
});

describe('clearSideHazards helper', () => {
  it('zeros all hazard layers', () => {
    const h = { ...EMPTY_HAZARDS, stealthRock: true, spikes: 3, toxicSpikes: 2, stickyWeb: true };
    clearSideHazards(h);
    expect(h).toEqual({ stealthRock: false, spikes: 0, toxicSpikes: 0, stickyWeb: false });
  });
});
