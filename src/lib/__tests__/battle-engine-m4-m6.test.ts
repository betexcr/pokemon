import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BattlePokemon, BattleState, BattleTeam } from '../team-battle-engine';
import { getMovePriority, applySwitchOutAbilities, getCurrentPokemon } from '../team-battle-engine';
import { handleOnEntryAbilities } from '../team-battle-abilities';
import { applyWeatherResidual, getWeatherDuration, getTerrainDuration, getScreenDuration } from '../team-battle-field';
import { applyEndOfTurnStatus } from '../team-battle-status';
import { createBattleRng } from '../battle-rng';
import { createFieldState, EMPTY_HAZARDS } from '../team-battle-types';

vi.mock('../moveCache', () => {
  const cache = new Map<string, { priority: number; category: string; type: string; name: string }>();
  cache.set('thunder-wave', { priority: 0, category: 'Status', type: 'Electric', name: 'thunder-wave' });
  cache.set('aerial-ace', { priority: 0, category: 'Physical', type: 'Flying', name: 'aerial-ace' });
  cache.set('recover', { priority: 0, category: 'Status', type: 'Normal', name: 'recover' });
  cache.set('quick-attack', { priority: 1, category: 'Physical', type: 'Normal', name: 'quick-attack' });
  return {
    getMove: vi.fn(async (id: string) => cache.get(String(id).toLowerCase()) ?? null),
    getCachedMove: (id: string) => cache.get(String(id).toLowerCase()),
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
        { stat: { name: 'speed' }, base_stat: 90 },
      ],
      weight: 100,
      abilities: [],
    } as any,
    level: 50,
    currentHp: 200,
    maxHp: 200,
    moves: [{ id: 'tackle', pp: 20, maxPp: 20 }],
    volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    ...overrides,
  };
}

function makeTeam(active: BattlePokemon, bench?: BattlePokemon): BattleTeam {
  return {
    pokemon: [active, bench || makePokemon({ currentHp: 150, maxHp: 150 })],
    currentIndex: 0,
    faintedCount: 0,
    sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } },
  };
}

function makeState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    player: makeTeam(makePokemon()),
    opponent: makeTeam(makePokemon()),
    turn: 1,
    field: createFieldState(),
    battleLog: [],
    actionQueue: [],
    rng: createBattleRng('m4-m6'),
    isComplete: false,
    phase: 'choice',
    ...overrides,
  } as BattleState;
}

describe('M4 priority abilities', () => {
  it('Prankster adds +1 to status moves', () => {
    const mon = makePokemon({ currentAbility: 'prankster' });
    expect(getMovePriority('thunder-wave', mon)).toBe(1);
    expect(getMovePriority('quick-attack', mon)).toBe(1);
  });

  it('Gale Wings adds +1 to Flying moves at full HP', () => {
    const mon = makePokemon({ currentAbility: 'gale-wings', currentHp: 200, maxHp: 200 });
    expect(getMovePriority('aerial-ace', mon)).toBe(1);
    mon.currentHp = 100;
    expect(getMovePriority('aerial-ace', mon)).toBe(0);
  });

  it('Triage adds +3 to healing moves', () => {
    const mon = makePokemon({ currentAbility: 'triage' });
    expect(getMovePriority('recover', mon)).toBe(3);
  });
});

describe('M4 Intimidate', () => {
  it('skips Attack drop when target has Inner Focus', () => {
    const state = makeState();
    getCurrentPokemon(state.opponent).currentAbility = 'inner-focus';
    const incoming = makePokemon({ currentAbility: 'intimidate', pokemon: { ...makePokemon().pokemon, name: 'gyarados' } as any });
    handleOnEntryAbilities(state, 'player', incoming);
    expect(getCurrentPokemon(state.opponent).statModifiers.attack).toBe(0);
  });

  it('triggers Defiant when Intimidate lands', () => {
    const state = makeState();
    getCurrentPokemon(state.opponent).currentAbility = 'defiant';
    handleOnEntryAbilities(state, 'player', makePokemon({ currentAbility: 'intimidate' }));
    // -1 from Intimidate, then +2 Defiant
    expect(getCurrentPokemon(state.opponent).statModifiers.attack).toBe(1);
  });

  it('Clear Body blocks the Attack drop', () => {
    const state = makeState();
    getCurrentPokemon(state.opponent).currentAbility = 'clear-body';
    handleOnEntryAbilities(state, 'player', makePokemon({ currentAbility: 'intimidate' }));
    expect(getCurrentPokemon(state.opponent).statModifiers.attack).toBe(0);
  });
});

describe('M4 switch-out + Poison Heal', () => {
  it('Regenerator heals 1/3 on switch-out', () => {
    const mon = makePokemon({ currentAbility: 'regenerator', currentHp: 100, maxHp: 300 });
    applySwitchOutAbilities(mon);
    expect(mon.currentHp).toBe(200);
  });

  it('Natural Cure clears status on switch-out', () => {
    const mon = makePokemon({ currentAbility: 'natural-cure', status: 'burned' });
    applySwitchOutAbilities(mon);
    expect(mon.status).toBeUndefined();
  });

  it('Poison Heal skips poison residual damage', () => {
    const state = makeState();
    const mon = getCurrentPokemon(state.player);
    mon.currentAbility = 'poison-heal';
    mon.status = 'poisoned';
    const hp = mon.currentHp;
    applyEndOfTurnStatus(state, mon);
    expect(mon.currentHp).toBe(hp);
  });
});

describe('M6 field items + sand immunities', () => {
  it('weather rocks / terrain extender / light clay extend to 8 turns', () => {
    expect(getWeatherDuration('rain', 'damp-rock')).toBe(8);
    expect(getWeatherDuration('sun', 'heat-rock')).toBe(8);
    expect(getWeatherDuration('sandstorm', 'smooth-rock')).toBe(8);
    expect(getWeatherDuration('snow', 'icy-rock')).toBe(8);
    expect(getWeatherDuration('rain')).toBe(5);
    expect(getTerrainDuration('terrain-extender')).toBe(8);
    expect(getScreenDuration('light-clay')).toBe(8);
  });

  it('drizzle with damp-rock sets 8-turn rain', () => {
    const state = makeState();
    handleOnEntryAbilities(state, 'player', makePokemon({ currentAbility: 'drizzle', heldItem: 'damp-rock' }));
    expect(state.field.weather?.kind).toBe('rain');
    expect(state.field.weather?.turns).toBe(8);
  });

  it('sand residual skips Magic Guard, Overcoat, Safety Goggles', () => {
    const state = makeState();
    state.field.weather = { kind: 'sandstorm', turns: 5 };
    const mg = getCurrentPokemon(state.player);
    mg.currentAbility = 'magic-guard';
    mg.pokemon.types = [{ type: { name: 'normal' } }] as any;
    const hp = mg.currentHp;
    applyWeatherResidual(state);
    expect(mg.currentHp).toBe(hp);

    const goggles = getCurrentPokemon(state.opponent);
    goggles.heldItem = 'safety-goggles';
    goggles.pokemon.types = [{ type: { name: 'fire' } }] as any;
    const hp2 = goggles.currentHp;
    applyWeatherResidual(state);
    expect(goggles.currentHp).toBe(hp2);
  });
});
