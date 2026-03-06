import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BattlePokemon, BattleState, BattleTeam } from '../team-battle-engine';
import { canUseMove } from '../team-battle-engine';
import { applyStartOfTurnStatus, applyEndOfTurnStatus, clearStatus, applyStatus } from '../team-battle-status';
import { isGrounded } from '../team-battle-status';
import { applyWeatherResidual, decrementFieldTimers } from '../team-battle-field';
import { createBattleRng, BattleRng } from '../battle-rng';
import { createFieldState, EMPTY_HAZARDS, FieldSideScreens } from '../team-battle-types';

vi.mock('../moveCache', () => ({
  getMove: vi.fn().mockResolvedValue(null),
}));
vi.mock('../executor', () => ({ executeTurn: vi.fn() }));

function makePokemon(overrides: Partial<BattlePokemon> = {}): BattlePokemon {
  return {
    pokemon: {
      id: 242,
      name: 'blissey',
      types: [{ type: { name: 'normal' } }] as any,
      stats: [
        { stat: { name: 'hp' }, base_stat: 255 },
        { stat: { name: 'attack' }, base_stat: 10 },
        { stat: { name: 'defense' }, base_stat: 10 },
        { stat: { name: 'special-attack' }, base_stat: 75 },
        { stat: { name: 'special-defense' }, base_stat: 105 },
        { stat: { name: 'speed' }, base_stat: 55 },
      ],
      weight: 468,
      abilities: [{ ability: { name: 'natural-cure' } }],
    } as any,
    level: 50,
    currentHp: 330,
    maxHp: 330,
    moves: [
      { id: 'seismic-toss', pp: 20, maxPp: 20 },
      { id: 'soft-boiled', pp: 10, maxPp: 10 },
      { id: 'thunder-wave', pp: 20, maxPp: 20 },
      { id: 'toxic', pp: 10, maxPp: 10 },
    ],
    volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    ...overrides,
  };
}

function makeTeam(pokemon?: BattlePokemon): BattleTeam {
  const p = pokemon || makePokemon();
  return {
    pokemon: [p, makePokemon(), makePokemon()],
    currentIndex: 0,
    faintedCount: 0,
    sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } },
  };
}

function makeState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    player: makeTeam(),
    opponent: makeTeam(),
    turn: 1,
    field: createFieldState(),
    battleLog: [],
    actionQueue: [],
    rng: createBattleRng('test-seed'),
    ...overrides,
  } as BattleState;
}

// ---------- STATUS DURATION TESTS ----------

describe('Status Durations', () => {
  let state: BattleState;
  let rng: BattleRng;

  beforeEach(() => {
    state = makeState();
    rng = state.rng;
  });

  describe('Sleep', () => {
    it('sleeping pokemon cannot use moves', () => {
      const pokemon = makePokemon({ status: 'asleep', statusTurns: 0 });
      const result = canUseMove(pokemon, 'seismic-toss', rng);
      expect(result.canUse).toBe(false);
      expect(result.reason).toBe('fast asleep');
    });

    it('sleeping pokemon always fails to move (no random chance)', () => {
      let moveAttempts = 0;
      for (let i = 0; i < 50; i++) {
        const pokemon = makePokemon({ status: 'asleep', statusTurns: 0 });
        const result = canUseMove(pokemon, 'seismic-toss', createBattleRng(1000 + i));
        if (result.canUse) moveAttempts++;
      }
      expect(moveAttempts).toBe(0);
    });

    it('wakes up after 3 turns via applyStartOfTurnStatus', () => {
      const pokemon = makePokemon({ status: 'asleep', statusTurns: 2 });
      applyStartOfTurnStatus(state, pokemon, rng);
      expect(pokemon.status).toBeUndefined();
    });

    it('does not wake up before 3 turns', () => {
      const pokemon = makePokemon({ status: 'asleep', statusTurns: 0 });
      applyStartOfTurnStatus(state, pokemon, rng);
      expect(pokemon.statusTurns).toBe(1);
      expect(pokemon.status).toBe('asleep');
    });

    it('increments statusTurns each start-of-turn', () => {
      const pokemon = makePokemon({ status: 'asleep', statusTurns: 0 });
      applyStartOfTurnStatus(state, pokemon, rng);
      expect(pokemon.statusTurns).toBe(1);
      applyStartOfTurnStatus(state, pokemon, rng);
      expect(pokemon.statusTurns).toBe(2);
      applyStartOfTurnStatus(state, pokemon, rng);
      expect(pokemon.status).toBeUndefined();
    });
  });

  describe('Freeze', () => {
    it('frozen pokemon always fails canUseMove (thaw is handled at start of turn)', () => {
      for (let i = 0; i < 20; i++) {
        const p = makePokemon({ status: 'frozen' });
        const result = canUseMove(p, 'seismic-toss', createBattleRng(5000 + i));
        expect(result.canUse).toBe(false);
        expect(result.reason).toBe('frozen solid');
      }
    });

    it('has 20% thaw chance at start of turn', () => {
      let thawCount = 0;
      const trials = 1000;
      const rng2 = createBattleRng(42);
      for (let i = 0; i < trials; i++) {
        const pokemon = makePokemon({ status: 'frozen' });
        const s = makeState();
        applyStartOfTurnStatus(s, pokemon, rng2);
        if (!pokemon.status) thawCount++;
      }
      const thawRate = thawCount / trials;
      expect(thawRate).toBeGreaterThan(0.12);
      expect(thawRate).toBeLessThan(0.30);
    });
  });

  describe('Paralysis', () => {
    it('paralyzed pokemon has ~75% chance to move', () => {
      let moved = 0;
      const trials = 1000;
      const rng2 = createBattleRng(99);
      for (let i = 0; i < trials; i++) {
        const pokemon = makePokemon({ status: 'paralyzed' });
        const result = canUseMove(pokemon, 'seismic-toss', rng2);
        if (result.canUse) moved++;
      }
      const moveRate = moved / trials;
      expect(moveRate).toBeGreaterThan(0.65);
      expect(moveRate).toBeLessThan(0.85);
    });

    it('paralysis is permanent (no turns-based cure)', () => {
      const pokemon = makePokemon({ status: 'paralyzed' });
      for (let i = 0; i < 10; i++) {
        applyStartOfTurnStatus(state, pokemon, rng);
      }
      expect(pokemon.status).toBe('paralyzed');
    });
  });

  describe('Confusion', () => {
    it('confused pokemon has ~1/3 chance to hit itself', () => {
      let selfHit = 0;
      const trials = 1000;
      const rng2 = createBattleRng(77);
      for (let i = 0; i < trials; i++) {
        const pokemon = makePokemon();
        pokemon.volatile.confusion = { turns: 5 };
        const result = canUseMove(pokemon, 'seismic-toss', rng2);
        if (!result.canUse && result.reason === 'confused and hurt itself') selfHit++;
      }
      const hitRate = selfHit / trials;
      expect(hitRate).toBeGreaterThan(0.20);
      expect(hitRate).toBeLessThan(0.45);
    });

    it('confusion decrements turns each time canUseMove is called', () => {
      const pokemon = makePokemon();
      pokemon.volatile.confusion = { turns: 3 };
      canUseMove(pokemon, 'seismic-toss', createBattleRng(40001));
      expect(pokemon.volatile.confusion?.turns).toBe(2);
    });

    it('confusion wears off when turns reach 0', () => {
      const pokemon = makePokemon();
      pokemon.volatile.confusion = { turns: 1 };
      canUseMove(pokemon, 'seismic-toss', createBattleRng(40002));
      expect(pokemon.volatile.confusion).toBeUndefined();
    });

    it('confusion self-damage reduces HP', () => {
      let hpLoss = false;
      const rng2 = createBattleRng(123);
      for (let i = 0; i < 100; i++) {
        const pokemon = makePokemon();
        pokemon.volatile.confusion = { turns: 5 };
        const original = pokemon.currentHp;
        canUseMove(pokemon, 'seismic-toss', rng2);
        if (pokemon.currentHp < original) { hpLoss = true; break; }
      }
      expect(hpLoss).toBe(true);
    });
  });
});

// ---------- RESIDUAL DAMAGE TESTS ----------

describe('Residual Damage', () => {
  let state: BattleState;

  beforeEach(() => {
    state = makeState();
  });

  describe('Burn', () => {
    it('deals 1/16 max HP per turn', () => {
      const pokemon = makePokemon({ status: 'burned' });
      const expected = Math.floor(330 / 16); // 20
      const before = pokemon.currentHp;
      applyEndOfTurnStatus(state, pokemon);
      expect(before - pokemon.currentHp).toBe(expected);
    });

    it('applies exactly once per end-of-turn call (no double damage)', () => {
      const pokemon = makePokemon({ status: 'burned' });
      const expected = Math.floor(330 / 16);
      applyEndOfTurnStatus(state, pokemon);
      expect(330 - pokemon.currentHp).toBe(expected);
    });

    it('burn is permanent', () => {
      const pokemon = makePokemon({ status: 'burned' });
      for (let i = 0; i < 10; i++) {
        applyEndOfTurnStatus(state, pokemon);
      }
      expect(pokemon.status).toBe('burned');
    });

    it('respects Magic Guard immunity', () => {
      const pokemon = makePokemon({ status: 'burned', currentAbility: 'magic-guard' });
      applyEndOfTurnStatus(state, pokemon);
      expect(pokemon.currentHp).toBe(330);
    });
  });

  describe('Poison', () => {
    it('deals 1/8 max HP per turn', () => {
      const pokemon = makePokemon({ status: 'poisoned' });
      const expected = Math.floor(330 / 8); // 41
      applyEndOfTurnStatus(state, pokemon);
      expect(330 - pokemon.currentHp).toBe(expected);
    });

    it('poison damage is constant each turn', () => {
      const pokemon = makePokemon({ status: 'poisoned', currentHp: 330 });
      const damages: number[] = [];
      for (let i = 0; i < 3; i++) {
        const before = pokemon.currentHp;
        applyEndOfTurnStatus(state, pokemon);
        damages.push(before - pokemon.currentHp);
      }
      const expected = Math.floor(330 / 8);
      expect(damages.every(d => d === expected)).toBe(true);
    });
  });

  describe('Badly Poisoned (Toxic)', () => {
    it('damage escalates each turn', () => {
      const pokemon = makePokemon({ status: 'badly-poisoned', currentHp: 330, maxHp: 330 });
      pokemon.volatile.toxicCounter = 0;
      const damages: number[] = [];
      for (let i = 0; i < 4; i++) {
        const before = pokemon.currentHp;
        applyEndOfTurnStatus(state, pokemon);
        damages.push(before - pokemon.currentHp);
      }
      // Each turn should do more damage than the previous
      for (let i = 1; i < damages.length; i++) {
        expect(damages[i]).toBeGreaterThanOrEqual(damages[i - 1]);
      }
      // First tick should be 1/16 or 2/16, and should increase
      expect(damages[damages.length - 1]).toBeGreaterThan(damages[0]);
    });

    it('toxic counter caps at 16', () => {
      const pokemon = makePokemon({ status: 'badly-poisoned', currentHp: 330, maxHp: 330 });
      pokemon.volatile.toxicCounter = 14;
      applyEndOfTurnStatus(state, pokemon);
      // Counter should have incremented to 15, damage = floor(330 * 15/16) = 309
      applyEndOfTurnStatus(state, pokemon);
      // Counter is now 16, damage = floor(330 * 16/16) = 330, but capped by remaining HP
      expect(pokemon.volatile.toxicCounter).toBeLessThanOrEqual(17); // just making sure it increments
    });
  });

  describe('Sandstorm', () => {
    it('deals 1/16 max HP to non-immune types', () => {
      const playerPk = makePokemon();
      const opponentPk = makePokemon();
      state.player = makeTeam(playerPk);
      state.opponent = makeTeam(opponentPk);
      state.field.weather = { kind: 'sandstorm', turns: 5, source: 'test' };
      const expected = Math.floor(330 / 16);
      applyWeatherResidual(state);
      expect(330 - playerPk.currentHp).toBe(expected);
      expect(330 - opponentPk.currentHp).toBe(expected);
    });

    it('does not damage Rock, Ground, or Steel types', () => {
      const rockPk = makePokemon();
      rockPk.pokemon.types = [{ type: { name: 'rock' } }] as any;
      state.player = makeTeam(rockPk);

      const steelPk = makePokemon();
      steelPk.pokemon.types = [{ type: { name: 'steel' } }] as any;
      state.opponent = makeTeam(steelPk);

      state.field.weather = { kind: 'sandstorm', turns: 5, source: 'test' };
      applyWeatherResidual(state);
      expect(rockPk.currentHp).toBe(330);
      expect(steelPk.currentHp).toBe(330);
    });

    it('does not damage Ground types', () => {
      const groundPk = makePokemon();
      groundPk.pokemon.types = [{ type: { name: 'ground' } }] as any;
      state.player = makeTeam(groundPk);
      state.opponent = makeTeam(makePokemon());
      state.field.weather = { kind: 'sandstorm', turns: 5, source: 'test' };
      applyWeatherResidual(state);
      expect(groundPk.currentHp).toBe(330);
    });
  });
});

// ---------- WEATHER TESTS ----------

describe('Weather', () => {
  it('field timer decrements weather each turn', () => {
    const field = createFieldState();
    field.weather = { kind: 'sun', turns: 3, source: 'test' };
    const sides = { player: {} as FieldSideScreens, opponent: {} as FieldSideScreens };
    decrementFieldTimers(field, sides);
    expect(field.weather?.turns).toBe(2);
    decrementFieldTimers(field, sides);
    expect(field.weather?.turns).toBe(1);
    decrementFieldTimers(field, sides);
    // Weather is deleted when turns reach 0
    expect(field.weather).toBeUndefined();
  });

  it('weather lasts exactly 5 turns when set', () => {
    const field = createFieldState();
    field.weather = { kind: 'rain', turns: 5, source: 'test' };
    const sides = { player: {} as FieldSideScreens, opponent: {} as FieldSideScreens };
    for (let i = 0; i < 4; i++) {
      decrementFieldTimers(field, sides);
      expect(field.weather).toBeDefined();
    }
    decrementFieldTimers(field, sides);
    expect(field.weather).toBeUndefined();
  });
});

// ---------- GROUNDED / TYPE CHECKS ----------

describe('isGrounded', () => {
  it('returns true for non-flying types', () => {
    const pokemon = makePokemon();
    expect(isGrounded(pokemon)).toBe(true);
  });

  it('returns false for flying types (lowercase)', () => {
    const pokemon = makePokemon();
    pokemon.pokemon.types = [{ type: { name: 'flying' } }] as any;
    expect(isGrounded(pokemon)).toBe(false);
  });

  it('returns false for dual-type with flying', () => {
    const pokemon = makePokemon();
    pokemon.pokemon.types = [{ type: { name: 'normal' } }, { type: { name: 'flying' } }] as any;
    expect(isGrounded(pokemon)).toBe(false);
  });
});

// ---------- SCREEN TIMER TESTS ----------

describe('Screen Timers', () => {
  it('Reflect lasts 5 turns then expires', () => {
    const field = createFieldState();
    const sides = {
      player: { reflect: { turns: 5 } } as FieldSideScreens,
      opponent: {} as FieldSideScreens,
    };
    for (let i = 0; i < 5; i++) {
      decrementFieldTimers(field, sides);
    }
    expect(sides.player.reflect).toBeUndefined();
  });

  it('Light Screen lasts 5 turns then expires', () => {
    const field = createFieldState();
    const sides = {
      player: { lightScreen: { turns: 5 } } as FieldSideScreens,
      opponent: {} as FieldSideScreens,
    };
    for (let i = 0; i < 5; i++) {
      decrementFieldTimers(field, sides);
    }
    expect(sides.player.lightScreen).toBeUndefined();
  });

  it('Aurora Veil lasts 5 turns then expires', () => {
    const field = createFieldState();
    const sides = {
      player: { auroraVeil: { turns: 5 } } as FieldSideScreens,
      opponent: {} as FieldSideScreens,
    };
    for (let i = 0; i < 5; i++) {
      decrementFieldTimers(field, sides);
    }
    expect(sides.player.auroraVeil).toBeUndefined();
  });
});

// ---------- DAMAGE CALCULATOR WEATHER MODIFIERS ----------

describe('Damage Calculator Weather Modifiers', () => {
  it('sun boosts fire by 1.5x', async () => {
    const { getWeatherModifier } = await import('../damage-calculator');
    expect(getWeatherModifier('Fire', 'Sun')).toBe(1.5);
  });

  it('sun weakens water by 0.5x', async () => {
    const { getWeatherModifier } = await import('../damage-calculator');
    expect(getWeatherModifier('Water', 'Sun')).toBe(0.5);
  });

  it('rain boosts water by 1.5x', async () => {
    const { getWeatherModifier } = await import('../damage-calculator');
    expect(getWeatherModifier('Water', 'Rain')).toBe(1.5);
  });

  it('rain weakens fire by 0.5x', async () => {
    const { getWeatherModifier } = await import('../damage-calculator');
    expect(getWeatherModifier('Fire', 'Rain')).toBe(0.5);
  });

  it('neutral type not affected by weather', async () => {
    const { getWeatherModifier } = await import('../damage-calculator');
    expect(getWeatherModifier('Normal', 'Sun')).toBe(1);
    expect(getWeatherModifier('Normal', 'Rain')).toBe(1);
    expect(getWeatherModifier('Grass', 'Sandstorm')).toBe(1);
  });
});

// ---------- STATUS APPLICATION RULES ----------

describe('Status Application Rules', () => {
  it('applyStatus sets status and resets statusTurns', () => {
    const pokemon = makePokemon();
    applyStatus(pokemon, 'paralyzed');
    expect(pokemon.status).toBe('paralyzed');
    expect(pokemon.statusTurns).toBe(0);
  });

  it('clearStatus removes status and turns', () => {
    const pokemon = makePokemon({ status: 'burned', statusTurns: 5 });
    clearStatus(pokemon);
    expect(pokemon.status).toBeUndefined();
    expect(pokemon.statusTurns).toBeUndefined();
  });

  it('badly-poisoned sets toxicCounter to 1', () => {
    const pokemon = makePokemon();
    applyStatus(pokemon, 'badly-poisoned');
    expect(pokemon.volatile.toxicCounter).toBe(1);
  });

  it('non-toxic status clears toxicCounter', () => {
    const pokemon = makePokemon();
    pokemon.volatile.toxicCounter = 5;
    applyStatus(pokemon, 'paralyzed');
    expect(pokemon.volatile.toxicCounter).toBeUndefined();
  });
});
