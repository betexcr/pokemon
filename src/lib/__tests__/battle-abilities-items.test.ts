import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CompiledMove } from '../adapters/pokeapiMoveAdapter';
import { runBattleTurnFromQueue } from '../team-battle-engine-additional';
import {
  buildActionQueue,
  getCurrentPokemon,
  getEffectiveSpeed,
  type BattleAction,
  type BattlePokemon,
  type BattleState,
  type BattleTeam,
} from '../team-battle-engine';
import { createBattleRng } from '../battle-rng';
import { createFieldState, EMPTY_HAZARDS } from '../team-battle-types';
import { targetAbility } from '../team-battle-ability-rules';

const base = { critRateStage: 0, bypassAccuracyCheck: false, hits: null, makesContact: false, priority: 0, pp: 20 } as const;
type StatChange = { stat: string; stages: number; chance: number };
const status = (name: string, extra: Record<string, unknown> = {}) => ({
  ...base, id: 1, name, type: 'Normal', category: 'Status', power: null, accuracy: null, bypassAccuracyCheck: true, ...extra,
});
const sc = (stat: string, stages: number, chance = 100): StatChange => ({ stat, stages, chance });

const MOVES: Record<string, CompiledMove> = {
  tackle: { ...base, id: 33, name: 'tackle', type: 'Normal', category: 'Physical', power: 40, accuracy: 100, makesContact: true },
  'mega-hit': { ...base, id: 2, name: 'mega-hit', type: 'Normal', category: 'Physical', power: 250, accuracy: 100 },
  earthquake: { ...base, id: 89, name: 'earthquake', type: 'Ground', category: 'Physical', power: 100, accuracy: 100 },
  'water-gun': { ...base, id: 55, name: 'water-gun', type: 'Water', category: 'Special', power: 40, accuracy: 100 },
  flamethrower: { ...base, id: 53, name: 'flamethrower', type: 'Fire', category: 'Special', power: 90, accuracy: 100, ailment: { kind: 'burn', chance: 100 } },
  'close-combat': { ...base, id: 370, name: 'close-combat', type: 'Fighting', category: 'Physical', power: 120, accuracy: 100, statChanges: [sc('def', -1), sc('spd', -1)] },
  splash: status('splash'),
  'swords-dance': status('swords-dance', { statChanges: [sc('atk', 2)], target: 'user' }),
  growl: status('growl', { accuracy: 100, bypassAccuracyCheck: false, statChanges: [sc('atk', -1)], target: 'all-opponents' }),
  swagger: status('swagger', { statChanges: [sc('atk', 2)], target: 'selected-pokemon' }),
  'shell-smash': status('shell-smash', {
    statChanges: [sc('atk', 2), sc('spa', 2), sc('spe', 2), sc('def', -1), sc('spd', -1)],
    target: 'user',
  }),
  'stealth-rock': status('stealth-rock', { target: 'opponents-field' }),
  roar: status('roar', { priority: -6, target: 'selected-pokemon' }),
} as unknown as Record<string, CompiledMove>;

vi.mock('../moveCache', () => ({
  getMove: vi.fn(async (id: string | number) => MOVES[String(id).toLowerCase()] ?? null),
  getCachedMove: vi.fn((id: string | number) => MOVES[String(id).toLowerCase()]),
}));

type MonOpts = {
  types?: string[];
  ability?: string;
  item?: string;
  speed?: number;
  level?: number;
  stats?: Partial<Record<'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense', number>>;
  hp?: number;
};

function makeMon(name: string, o: MonOpts = {}): BattlePokemon {
  const stats = { hp: 100, attack: 100, defense: 100, 'special-attack': 100, 'special-defense': 100, speed: o.speed ?? 50, ...o.stats };
  return {
    pokemon: {
      id: 1,
      name,
      types: (o.types ?? ['normal']).map((t) => ({ type: { name: t } })) as any,
      stats: Object.entries(stats).map(([stat, base_stat]) => ({ stat: { name: stat }, base_stat })),
      weight: 100,
      abilities: [],
    } as any,
    level: o.level ?? 50,
    currentHp: o.hp ?? 300,
    maxHp: 300,
    moves: Object.keys(MOVES).map((id) => ({ id, pp: 10, maxPp: 10 })),
    volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    currentAbility: o.ability,
    heldItem: o.item,
  };
}

const team = (members: BattlePokemon[]): BattleTeam =>
  ({ pokemon: members, currentIndex: 0, faintedCount: 0, sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } } }) as BattleTeam;

/** Player lead is fast (150) unless overridden; opponent lead slow (30). Both sides get a bench Pokémon. */
function makeBattle(player: BattlePokemon = makeMon('p', { speed: 150 }), opponent: BattlePokemon = makeMon('o', { speed: 30 }), seed = 5): BattleState {
  return {
    player: team([player, makeMon('p-bench')]),
    opponent: team([opponent, makeMon('o-bench')]),
    turn: 1,
    field: createFieldState(),
    battleLog: [],
    actionQueue: [],
    rng: createBattleRng(seed),
    isComplete: false,
    phase: 'choice',
  } as BattleState;
}

const move = (moveId: string): BattleAction => ({ type: 'move', moveId, target: 'opponent' });
const SPLASH = move('splash');

async function playTurn(state: BattleState, p: BattleAction, o: BattleAction = SPLASH) {
  await runBattleTurnFromQueue(state, buildActionQueue(state, p, o), { clearBattleLog: true });
  state.turn += 1;
  return state.battleLog.map((e) => e.message);
}

const P = (s: BattleState) => getCurrentPokemon(s.player);
const O = (s: BattleState) => getCurrentPokemon(s.opponent);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('stat stage changes', () => {
  it('status moves apply their stat changes once (Swords Dance +2, Growl -1)', async () => {
    const state = makeBattle();
    await playTurn(state, move('swords-dance'), move('growl'));
    // Growl (-1) and Swords Dance (+2) on the player
    expect(P(state).statModifiers.attack).toBe(1);
    const fresh = makeBattle();
    await playTurn(fresh, move('growl'));
    expect(O(fresh).statModifiers.attack).toBe(-1);
  });

  it('uses the move target for status moves: Swagger raises the foe', async () => {
    const state = makeBattle();
    await playTurn(state, move('swagger'));
    expect(O(state).statModifiers.attack).toBe(2);
    expect(P(state).statModifiers.attack).toBe(0);
  });

  it('logs sharp rises and caps at +6', async () => {
    const state = makeBattle();
    P(state).statModifiers.attack = 6;
    const log = await playTurn(state, move('swords-dance'));
    expect(log).toContain("p's Attack won't go any higher!");
    const fresh = makeBattle();
    expect(await playTurn(fresh, move('swords-dance'))).toContain("p's Attack rose sharply!");
  });
});

describe('Contrary / Simple', () => {
  it('Contrary inverts self-boosts and Close Combat drops', async () => {
    const state = makeBattle(makeMon('contrarian', { speed: 150, ability: 'contrary' }));
    await playTurn(state, move('swords-dance'));
    expect(P(state).statModifiers.attack).toBe(-2);
    await playTurn(state, move('close-combat'));
    expect(P(state).statModifiers.defense).toBe(1);
    expect(P(state).statModifiers.specialDefense).toBe(1);
  });

  it('Contrary turns Intimidate into an Attack boost', async () => {
    const state = makeBattle(makeMon('contrarian', { speed: 150, ability: 'contrary' }));
    state.opponent.pokemon[1].currentAbility = 'intimidate';
    await playTurn(state, SPLASH, { type: 'switch', switchIndex: 1 });
    expect(P(state).statModifiers.attack).toBe(1);
  });

  it('Simple doubles stat changes', async () => {
    const state = makeBattle(makeMon('simpleton', { speed: 150, ability: 'simple' }));
    await playTurn(state, move('swords-dance'));
    expect(P(state).statModifiers.attack).toBe(4);
  });
});

describe('drop blockers and Defiant', () => {
  it('Clear Body blocks foe drops but not self-inflicted ones', async () => {
    const state = makeBattle(makeMon('p', { speed: 150 }), makeMon('golem', { speed: 30, ability: 'clear-body' }));
    const log = await playTurn(state, move('growl'), move('close-combat'));
    expect(O(state).statModifiers.attack).toBe(0);
    expect(log.some((m) => m.includes('Clear Body prevents'))).toBe(true);
    expect(O(state).statModifiers.defense).toBe(-1);
  });

  it('Defiant answers a foe drop with +2 Attack', async () => {
    const state = makeBattle(makeMon('p', { speed: 150 }), makeMon('bisharp', { speed: 30, ability: 'defiant' }));
    await playTurn(state, move('growl'));
    expect(O(state).statModifiers.attack).toBe(1);
  });

  it('Sticky Web triggers Defiant and is blocked by Clear Body', async () => {
    const state = makeBattle();
    state.player.sideConditions.hazards.stickyWeb = true;
    state.player.pokemon[1].currentAbility = 'defiant';
    await playTurn(state, { type: 'switch', switchIndex: 1 });
    expect(P(state).statModifiers.speed).toBe(-1);
    expect(P(state).statModifiers.attack).toBe(2);
  });
});

describe('Mold Breaker', () => {
  it('ignores Levitate, Sturdy and Clear Body', async () => {
    let state = makeBattle(makeMon('breaker', { speed: 150, ability: 'mold-breaker' }), makeMon('floaty', { speed: 30, ability: 'levitate' }));
    await playTurn(state, move('earthquake'));
    expect(O(state).currentHp).toBeLessThan(300);

    state = makeBattle(makeMon('breaker', { speed: 150, ability: 'mold-breaker', level: 100 }), makeMon('sturdy', { speed: 30, ability: 'sturdy', stats: { hp: 1, defense: 5 } }));
    await playTurn(state, move('mega-hit'));
    // Sturdy did not hold; the fainted lead is replaced at end of turn
    expect(state.opponent.pokemon[0].currentHp).toBe(0);

    state = makeBattle(makeMon('breaker', { speed: 150, ability: 'mold-breaker' }), makeMon('golem', { speed: 30, ability: 'clear-body' }));
    await playTurn(state, move('growl'));
    expect(O(state).statModifiers.attack).toBe(-1);
  });

  it('without Mold Breaker, Levitate and Sturdy still work', async () => {
    let state = makeBattle(makeMon('p', { speed: 150 }), makeMon('floaty', { speed: 30, ability: 'levitate' }));
    await playTurn(state, move('earthquake'));
    expect(O(state).currentHp).toBe(300);

    state = makeBattle(makeMon('p', { speed: 150, level: 100 }), makeMon('sturdy', { speed: 30, ability: 'sturdy', stats: { hp: 1, defense: 5 } }));
    await playTurn(state, move('mega-hit'));
    expect(O(state).currentHp).toBe(1);
  });

  it('lets Roar through Suction Cups and announces itself on entry', async () => {
    const state = makeBattle(makeMon('p', { speed: 150 }), makeMon('octillery', { speed: 30, ability: 'suction-cups' }));
    state.player.pokemon[1].currentAbility = 'mold-breaker';
    const entry = await playTurn(state, { type: 'switch', switchIndex: 1 });
    expect(entry).toContain('p-bench breaks the mold!');
    await playTurn(state, move('roar'));
    expect(state.opponent.currentIndex).toBe(1);
  });

  it('targetAbility only hides breakable abilities', () => {
    const breaker = makeMon('b', { ability: 'mold-breaker' });
    expect(targetAbility(breaker, makeMon('t', { ability: 'levitate' }))).toBeUndefined();
    expect(targetAbility(breaker, makeMon('t', { ability: 'rough-skin' }))).toBe('rough-skin');
    expect(targetAbility(makeMon('n'), makeMon('t', { ability: 'levitate' }))).toBe('levitate');
  });
});

describe('Magic Bounce', () => {
  it('reflects Growl back at the user', async () => {
    const state = makeBattle(makeMon('p', { speed: 150 }), makeMon('espeon', { speed: 30, ability: 'magic-bounce' }));
    const log = await playTurn(state, move('growl'));
    expect(log).toContain('espeon bounced the growl back!');
    expect(P(state).statModifiers.attack).toBe(-1);
    expect(O(state).statModifiers.attack).toBe(0);
    // Only the original user spends PP
    expect(O(state).moves.find((m) => m.id === 'growl')!.pp).toBe(10);
    expect(P(state).moves.find((m) => m.id === 'growl')!.pp).toBe(9);
  });

  it('reflects hazards onto the setter’s side', async () => {
    const state = makeBattle(makeMon('p', { speed: 150 }), makeMon('espeon', { speed: 30, ability: 'magic-bounce' }));
    await playTurn(state, move('stealth-rock'));
    expect(state.player.sideConditions.hazards.stealthRock).toBe(true);
    expect(state.opponent.sideConditions.hazards.stealthRock).toBeFalsy();
  });

  it('does not reflect self-targeting moves or Mold Breaker users', async () => {
    let state = makeBattle(makeMon('p', { speed: 150 }), makeMon('espeon', { speed: 30, ability: 'magic-bounce' }));
    await playTurn(state, move('swords-dance'));
    expect(P(state).statModifiers.attack).toBe(2);

    state = makeBattle(makeMon('breaker', { speed: 150, ability: 'mold-breaker' }), makeMon('espeon', { speed: 30, ability: 'magic-bounce' }));
    await playTurn(state, move('growl'));
    expect(O(state).statModifiers.attack).toBe(-1);
  });
});

describe('Sheer Force', () => {
  async function flamethrowerDamage(ability?: string, item?: string) {
    const state = makeBattle(makeMon('p', { speed: 150, ability, item }), makeMon('o', { speed: 30 }), 11);
    await playTurn(state, move('flamethrower'));
    // Read the hit from the log: the plain run also takes burn residual at end of turn
    const hit = state.battleLog.find((e) => e.type === 'damage_dealt' && e.pokemon === 'o');
    return { state, damage: Number(hit?.damage ?? 0) };
  }

  it('boosts moves with secondary effects by 30% and drops the effect', async () => {
    const plain = await flamethrowerDamage();
    const sheer = await flamethrowerDamage('sheer-force');
    expect(plain.state.opponent.pokemon[0].status).toBe('burned');
    expect(sheer.state.opponent.pokemon[0].status).toBeUndefined();
    expect(sheer.damage).toBeGreaterThan(plain.damage);
    expect(sheer.damage / plain.damage).toBeCloseTo(1.3, 1);
  });

  it('removes Life Orb recoil when it activates', async () => {
    const { state } = await flamethrowerDamage('sheer-force', 'life-orb');
    expect(P(state).currentHp).toBe(300);
    const plain = await flamethrowerDamage(undefined, 'life-orb');
    expect(P(plain.state).currentHp).toBe(270);
  });

  it('does not boost Close Combat, whose drops still apply', async () => {
    const state = makeBattle(makeMon('p', { speed: 150, ability: 'sheer-force' }));
    await playTurn(state, move('close-combat'));
    expect(P(state).statModifiers.defense).toBe(-1);
  });
});

describe('Weakness Policy', () => {
  it('sharply raises Attack and Sp. Atk after a super-effective hit, then is consumed', async () => {
    const state = makeBattle(makeMon('p', { speed: 150 }), makeMon('charizard', { speed: 30, types: ['fire'], item: 'weakness-policy' }));
    const log = await playTurn(state, move('water-gun'));
    expect(log).toContain('charizard used its Weakness Policy!');
    expect(O(state).statModifiers.attack).toBe(2);
    expect(O(state).statModifiers.specialAttack).toBe(2);
    expect(O(state).heldItem).toBeUndefined();
  });

  it('ignores neutral hits and hits on a Substitute', async () => {
    let state = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'weakness-policy' }));
    await playTurn(state, move('tackle'));
    expect(O(state).heldItem).toBe('weakness-policy');

    state = makeBattle(makeMon('p', { speed: 150 }), makeMon('charizard', { speed: 30, types: ['fire'], item: 'weakness-policy' }));
    O(state).volatile.substitute = { hp: 200 };
    await playTurn(state, move('water-gun'));
    expect(O(state).heldItem).toBe('weakness-policy');
  });
});

describe('White Herb', () => {
  it('restores Shell Smash drops but keeps the boosts', async () => {
    const state = makeBattle(makeMon('cloyster', { speed: 150, item: 'white-herb' }));
    const log = await playTurn(state, move('shell-smash'));
    const mods = P(state).statModifiers;
    expect(mods.attack).toBe(2);
    expect(mods.speed).toBe(2);
    expect(mods.defense).toBe(0);
    expect(mods.specialDefense).toBe(0);
    expect(P(state).heldItem).toBeUndefined();
    expect(log).toContain('cloyster returned its stats to normal using its White Herb!');
  });

  it('undoes an Intimidate drop on switch-in', async () => {
    const state = makeBattle(makeMon('p', { speed: 150, item: 'white-herb' }));
    state.opponent.pokemon[1].currentAbility = 'intimidate';
    await playTurn(state, SPLASH, { type: 'switch', switchIndex: 1 });
    expect(P(state).statModifiers.attack).toBe(0);
    expect(P(state).heldItem).toBeUndefined();
  });
});

describe('Air Balloon', () => {
  it('grants Ground immunity until popped by a hit', async () => {
    const state = makeBattle(makeMon('p', { speed: 150 }), makeMon('o', { speed: 30, item: 'air-balloon' }));
    let log = await playTurn(state, move('earthquake'));
    expect(log.some((m) => m.startsWith("It doesn't affect"))).toBe(true);
    expect(O(state).currentHp).toBe(300);

    log = await playTurn(state, move('tackle'));
    expect(log).toContain("o's Air Balloon popped!");
    const hpAfterTackle = O(state).currentHp;

    await playTurn(state, move('earthquake'));
    expect(O(state).currentHp).toBeLessThan(hpAfterTackle);
  });

  it('is announced on entry and keeps the holder off Spikes', async () => {
    const state = makeBattle();
    state.player.pokemon[1].heldItem = 'air-balloon';
    state.player.sideConditions.hazards.spikes = 3;
    const log = await playTurn(state, { type: 'switch', switchIndex: 1 });
    expect(log).toContain('p-bench floats in the air with its Air Balloon!');
    expect(P(state).currentHp).toBe(300);
  });
});

describe('Flame Orb / Toxic Orb', () => {
  it('inflicts the status at end of turn', async () => {
    const state = makeBattle(makeMon('p', { speed: 150, item: 'flame-orb' }), makeMon('o', { speed: 30, item: 'toxic-orb' }));
    const log = await playTurn(state, SPLASH);
    expect(P(state).status).toBe('burned');
    expect(O(state).status).toBe('badly-poisoned');
    expect(log).toContain('p was burned by the Flame Orb!');
  });

  it('respects type immunity', async () => {
    const state = makeBattle(
      makeMon('p', { speed: 150, types: ['fire'], item: 'flame-orb' }),
      makeMon('o', { speed: 30, types: ['steel'], item: 'toxic-orb' }),
    );
    await playTurn(state, SPLASH);
    expect(P(state).status).toBeUndefined();
    expect(O(state).status).toBeUndefined();
  });
});

describe('Protosynthesis / Quark Drive / Booster Energy', () => {
  const sunMon = (o: MonOpts = {}) => makeMon('roaring', { speed: 30, ability: 'protosynthesis', stats: { attack: 140 }, ...o });

  it('sun activates a boost to the highest stat and it wears off when the sun ends', async () => {
    const state = makeBattle(makeMon('p', { speed: 150 }), sunMon());
    state.field.weather = { kind: 'sun', turns: 2 };
    let log = await playTurn(state, SPLASH);
    expect(log).toContain("The harsh sunlight activated roaring's Protosynthesis!");
    expect(O(state).volatile.paradoxBoost).toEqual({ stat: 'attack', source: 'field' });

    log = await playTurn(state, SPLASH);
    expect(log).toContain("The effects of roaring's Protosynthesis wore off!");
    expect(O(state).volatile.paradoxBoost).toBeUndefined();
  });

  it('Booster Energy activates the boost without the field and lasts until switch-out', async () => {
    const state = makeBattle(makeMon('p', { speed: 150 }), sunMon({ item: 'booster-energy' }));
    const log = await playTurn(state, SPLASH);
    expect(log).toContain('roaring used its Booster Energy to activate Protosynthesis!');
    expect(O(state).heldItem).toBeUndefined();
    await playTurn(state, SPLASH);
    expect(O(state).volatile.paradoxBoost?.source).toBe('booster');

    await playTurn(state, SPLASH, { type: 'switch', switchIndex: 1 });
    expect(state.opponent.pokemon[0].volatile.paradoxBoost).toBeUndefined();
  });

  it('a Speed boost is 1.5x and changes turn order from the next turn', async () => {
    const fast = makeMon('iron', { speed: 120, ability: 'quark-drive', stats: { attack: 50, defense: 50, 'special-attack': 50, 'special-defense': 50 } });
    const state = makeBattle(makeMon('p', { speed: 150 }), fast);
    state.field.terrain = { kind: 'electric', turns: 5 };
    const before = getEffectiveSpeed(O(state));
    // Turn 1: the boost activates at turn start, after this turn's order was fixed
    let log = await playTurn(state, move('tackle'), move('tackle'));
    expect(O(state).volatile.paradoxBoost?.stat).toBe('speed');
    expect(getEffectiveSpeed(O(state))).toBe(Math.floor(before * 1.5));
    expect(log.find((m) => m.endsWith('used tackle!'))).toBe('p used tackle!');
    // Turn 2: the boosted opponent now outspeeds
    log = await playTurn(state, move('tackle'), move('tackle'));
    expect(log.find((m) => m.endsWith('used tackle!'))).toBe('iron used tackle!');
  });

  it('boosts damage by 30%', async () => {
    const damageWith = async (weather: boolean) => {
      // Attack (140 base) is the highest stat; still faster than the opponent
      const state = makeBattle(sunMon({ speed: 60 }), makeMon('o', { speed: 30 }), 3);
      if (weather) state.field.weather = { kind: 'sun', turns: 5 };
      await playTurn(state, move('tackle'));
      return 300 - O(state).currentHp;
    };
    const plain = await damageWith(false);
    const boosted = await damageWith(true);
    expect(boosted / plain).toBeCloseTo(1.3, 1);
  });
});
