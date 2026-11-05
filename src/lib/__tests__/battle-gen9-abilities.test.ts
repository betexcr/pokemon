import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CompiledMove } from '../adapters/pokeapiMoveAdapter';
import { runBattleTurnFromQueue } from '../team-battle-engine-additional';
import {
  buildActionQueue,
  getCurrentPokemon,
  getEffectiveSpeed,
  normalizeServerBattleAction,
  type BattleAction,
  type BattlePokemon,
  type BattleState,
  type BattleTeam,
} from '../team-battle-engine';
import { createBattleRng } from '../battle-rng';
import { createFieldState, EMPTY_HAZARDS } from '../team-battle-types';
import { isTrapped } from '../team-battle-held-items';
import { effectiveItem } from '../battle-item-access';

const base = { critRateStage: 0, bypassAccuracyCheck: false, hits: null, makesContact: false, priority: 0, pp: 20 } as const;
const phys = (name: string, type: string, power: number, extra: Record<string, unknown> = {}) =>
  ({ ...base, id: 1, name, type, category: 'Physical', power, accuracy: 100, ...extra });
const spec = (name: string, type: string, power: number, extra: Record<string, unknown> = {}) =>
  ({ ...base, id: 1, name, type, category: 'Special', power, accuracy: 100, ...extra });
const status = (name: string, type = 'Normal', extra: Record<string, unknown> = {}) =>
  ({ ...base, id: 1, name, type, category: 'Status', power: null, accuracy: null, bypassAccuracyCheck: true, ...extra });

const MOVES: Record<string, CompiledMove> = Object.fromEntries(
  [
    phys('tackle', 'Normal', 40, { makesContact: true }),
    phys('strength', 'Normal', 80),
    phys('mach-punch', 'Fighting', 40, { makesContact: true, priority: 1 }),
    phys('drain-punch', 'Fighting', 75, { makesContact: true, drain: { fraction: 0.5 } }),
    phys('crunch', 'Dark', 80, { makesContact: true }),
    phys('slash', 'Normal', 70, { makesContact: true }),
    phys('double-edge', 'Normal', 120, { makesContact: true, recoil: { fraction: 1 / 3 } }),
    phys('rock-slide', 'Rock', 75, { accuracy: 50 }),
    spec('thunderbolt', 'Electric', 90),
    spec('dark-pulse', 'Dark', 80),
    spec('ember', 'Fire', 40),
    status('swords-dance', 'Normal'),
    status('protect', 'Normal', { priority: 4 }),
    status('splash'),
  ].map((m) => [m.name, m as unknown as CompiledMove]),
);

vi.mock('../moveCache', () => ({
  getMove: vi.fn(async (id: string | number) => MOVES[String(id).toLowerCase()] ?? null),
  getCachedMove: vi.fn((id: string | number) => MOVES[String(id).toLowerCase()]),
}));

type Opts = { types?: string[]; speed?: number; ability?: string; item?: string; hp?: number };
function makeMon(name: string, o: Opts = {}): BattlePokemon {
  return {
    pokemon: {
      id: 1, name,
      types: (o.types ?? ['normal']).map((t) => ({ type: { name: t } })) as any,
      stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense'].map((st) => ({ stat: { name: st }, base_stat: 100 }))
        .concat([{ stat: { name: 'speed' }, base_stat: o.speed ?? 50 }]),
      weight: 100, abilities: [],
    } as any,
    level: 50, currentHp: o.hp ?? 400, maxHp: 400,
    moves: Object.keys(MOVES).map((id) => ({ id, pp: 10, maxPp: 10 })),
    volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    currentAbility: o.ability,
    originalAbility: o.ability,
    heldItem: o.item,
  };
}
const team = (members: BattlePokemon[]): BattleTeam =>
  ({ pokemon: members, currentIndex: 0, faintedCount: 0, sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } } }) as BattleTeam;
function makeBattle(player: BattlePokemon, opponent = makeMon('target', { speed: 30 }), seed = 4_000_037): BattleState {
  return {
    player: team([player, makeMon('p-bench')]), opponent: team([opponent, makeMon('o-bench')]),
    turn: 1, field: createFieldState(), battleLog: [], actionQueue: [], rng: createBattleRng(seed),
    isComplete: false, phase: 'choice',
  } as BattleState;
}
const mv = (moveId: string): BattleAction => ({ type: 'move', moveId, target: 'opponent' });
const sw = (switchIndex: number): BattleAction => ({ type: 'switch', switchIndex, target: 'opponent' });
async function play(s: BattleState, p: BattleAction, o: BattleAction = mv('splash')) {
  await runBattleTurnFromQueue(s, buildActionQueue(s, p, o), { clearBattleLog: true });
  s.turn += 1;
  return s.battleLog.map((e) => e.message);
}
const P = (s: BattleState) => getCurrentPokemon(s.player);
const O = (s: BattleState) => getCurrentPokemon(s.opponent);
const hit = (s: BattleState, name = 'target') => Number(s.battleLog.find((e) => e.type === 'damage_dealt' && e.pokemon === name)?.damage ?? 0);
const fast = (o: Opts = {}) => makeMon('user', { speed: 150, ...o });
async function damage(attacker: BattlePokemon, moveId: string, defender = makeMon('target', { speed: 30 }), seed?: number) {
  const s = makeBattle(attacker, defender, seed);
  await play(s, mv(moveId));
  return hit(s, defender.pokemon.name);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('power and stat abilities', () => {
  it('Iron Fist, Strong Jaw, Sharpness and Tough Claws boost their moves', async () => {
    expect(await damage(fast({ ability: 'iron-fist' }), 'mach-punch') / await damage(fast(), 'mach-punch')).toBeCloseTo(1.2, 1);
    expect(await damage(fast({ ability: 'strong-jaw' }), 'crunch') / await damage(fast(), 'crunch')).toBeCloseTo(1.5, 1);
    expect(await damage(fast({ ability: 'sharpness' }), 'slash') / await damage(fast(), 'slash')).toBeCloseTo(1.5, 1);
    expect(await damage(fast({ ability: 'tough-claws' }), 'tackle') / await damage(fast(), 'tackle')).toBeGreaterThan(1.2);
  });

  it('Pixilate turns Normal moves Fairy and boosts them', async () => {
    const dragon = makeMon('target', { speed: 30, types: ['dragon'] });
    const plain = await damage(fast(), 'strength', makeMon('target', { speed: 30, types: ['dragon'] }));
    // x2 vs Dragon and x1.2, but the Normal-type user loses STAB: 2 * 1.2 / 1.5 = 1.6
    expect(await damage(fast({ ability: 'pixilate' }), 'strength', dragon) / plain).toBeCloseTo(1.6, 1);
  });

  it('Blaze / Overgrow-style pinch abilities activate at 1/3 HP', async () => {
    const healthy = await damage(fast({ ability: 'blaze' }), 'ember');
    expect(await damage(fast({ ability: 'blaze', hp: 100 }), 'ember') / healthy).toBeCloseTo(1.5, 1);
  });

  it('Supreme Overlord grows with fainted allies', async () => {
    const plain = await damage(fast({ ability: 'supreme-overlord' }), 'strength');
    const s = makeBattle(fast({ ability: 'supreme-overlord' }));
    s.player.pokemon[1].currentHp = 0;
    await play(s, mv('strength'));
    expect(hit(s) / plain).toBeCloseTo(1.1, 1);
  });

  it('Sword of Ruin weakens the foe’s Defense; Tablets of Ruin the foe’s Attack', async () => {
    const plain = await damage(fast(), 'strength');
    expect(await damage(fast({ ability: 'sword-of-ruin' }), 'strength') / plain).toBeGreaterThan(1.25);
    expect(await damage(fast(), 'strength', makeMon('target', { speed: 30, ability: 'tablets-of-ruin' })) / plain).toBeLessThan(0.8);
  });

  it('Rock Head prevents recoil; Reckless boosts recoil moves', async () => {
    let s = makeBattle(fast({ ability: 'rock-head' }));
    await play(s, mv('double-edge'));
    expect(P(s).currentHp).toBe(400);
    s = makeBattle(fast());
    await play(s, mv('double-edge'));
    expect(P(s).currentHp).toBeLessThan(400);
    expect(await damage(fast({ ability: 'reckless' }), 'double-edge') / await damage(fast(), 'double-edge')).toBeCloseTo(1.2, 1);
  });

  it('Liquid Ooze hurts draining attackers', async () => {
    const s = makeBattle(fast({ hp: 300 }), makeMon('target', { speed: 30, ability: 'liquid-ooze' }));
    await play(s, mv('drain-punch'));
    expect(P(s).currentHp).toBeLessThan(300);
  });

  it('Parental Bond hits twice', async () => {
    const s = makeBattle(fast({ ability: 'parental-bond' }));
    const log = await play(s, mv('strength'));
    expect(log).toContain('Hit 2 time(s)!');
  });

  it('Scrappy lets Normal moves hit Ghost types', async () => {
    const s = makeBattle(fast({ ability: 'scrappy' }), makeMon('target', { speed: 30, types: ['ghost'] }));
    await play(s, mv('strength'));
    expect(O(s).currentHp).toBeLessThan(400);
  });

  it('No Guard makes a 50% move always hit', async () => {
    for (let i = 1; i <= 6; i++) {
      const s = makeBattle(fast({ ability: 'no-guard' }), undefined, i * 1_000_003);
      await play(s, mv('rock-slide'));
      expect(O(s).currentHp).toBeLessThan(400);
    }
  });
});

describe('reactions to being hit', () => {
  it('Stamina raises Defense; Weak Armor trades Defense for Speed', async () => {
    let s = makeBattle(fast(), makeMon('target', { speed: 30, ability: 'stamina' }));
    await play(s, mv('tackle'));
    expect(O(s).statModifiers.defense).toBe(1);
    s = makeBattle(fast(), makeMon('target', { speed: 30, ability: 'weak-armor' }));
    await play(s, mv('tackle'));
    expect(O(s).statModifiers.defense).toBe(-1);
    expect(O(s).statModifiers.speed).toBe(2);
  });

  it('Justified rises on Dark hits; Gooey slows contact attackers', async () => {
    let s = makeBattle(fast(), makeMon('target', { speed: 30, ability: 'justified' }));
    await play(s, mv('dark-pulse'));
    expect(O(s).statModifiers.attack).toBe(1);
    s = makeBattle(fast(), makeMon('target', { speed: 30, ability: 'gooey' }));
    await play(s, mv('tackle'));
    expect(P(s).statModifiers.speed).toBe(-1);
  });

  it('Mummy spreads to contact attackers', async () => {
    const s = makeBattle(fast({ ability: 'intimidate' }), makeMon('target', { speed: 30, ability: 'mummy' }));
    await play(s, mv('tackle'));
    expect(P(s).currentAbility).toBe('mummy');
  });

  it('Electromorphosis charges the next Electric move', async () => {
    const plain = await damage(makeMon('target2', { speed: 150 }), 'thunderbolt', makeMon('user', { speed: 30 }));
    const s = makeBattle(fast(), makeMon('target', { speed: 30, ability: 'electromorphosis' }));
    await play(s, mv('tackle'), mv('thunderbolt'));
    expect(hit(s, 'user') / plain).toBeGreaterThan(1.7);
  });

  it('Emergency Exit switches out at half HP', async () => {
    const s = makeBattle(fast(), makeMon('target', { speed: 30, ability: 'emergency-exit', hp: 210 }));
    const log = await play(s, mv('strength'));
    expect(log).toContain('target rushed back to safety!');
    expect(O(s).pokemon.name).toBe('o-bench');
  });

  it('Innards Out hits back with the HP it had left', async () => {
    const s = makeBattle(fast(), makeMon('target', { speed: 30, ability: 'innards-out', hp: 30 }));
    await play(s, mv('strength'));
    expect(P(s).currentHp).toBe(370);
  });
});

describe('entry, end of turn, speed, trapping', () => {
  it('Intrepid Sword raises Attack once per battle', async () => {
    const s = makeBattle(makeMon('user'), makeMon('target'));
    s.player.pokemon[1].currentAbility = 'intrepid-sword';
    await play(s, sw(1));
    expect(P(s).statModifiers.attack).toBe(1);
    await play(s, sw(0));
    await play(s, sw(1));
    expect(P(s).statModifiers.attack).toBe(0);
  });

  it('Trace copies the foe’s ability', async () => {
    const s = makeBattle(makeMon('user'), makeMon('target', { ability: 'levitate' }));
    s.player.pokemon[1].currentAbility = 'trace';
    await play(s, sw(1));
    expect(P(s).currentAbility).toBe('levitate');
  });

  it('Orichalcum Pulse sets sun on entry', async () => {
    const s = makeBattle(makeMon('user'), makeMon('target'));
    s.player.pokemon[1].currentAbility = 'orichalcum-pulse';
    await play(s, sw(1));
    expect(s.field.weather?.kind).toBe('sun');
  });

  it('Moody raises one stat by 2 and lowers another by 1 each turn', async () => {
    const s = makeBattle(fast({ ability: 'moody' }));
    await play(s, mv('splash'));
    const stages = Object.values(P(s).statModifiers);
    expect(stages).toContain(2);
    expect(stages).toContain(-1);
  });

  it('Quick Feet ignores the paralysis drop and boosts Speed', () => {
    const plain = getEffectiveSpeed(makeMon('a', { speed: 100 }));
    const mon = makeMon('a', { speed: 100, ability: 'quick-feet' });
    mon.status = 'paralyzed';
    expect(getEffectiveSpeed(mon)).toBe(Math.floor(plain * 1.5));
  });

  it('Stall moves last even when faster', async () => {
    const s = makeBattle(fast({ ability: 'stall' }), makeMon('target', { speed: 10 }));
    const log = await play(s, mv('tackle'), mv('tackle'));
    expect(log.indexOf('target used tackle!')).toBeLessThan(log.indexOf('user used tackle!'));
  });

  it('Shadow Tag, Arena Trap and Magnet Pull trap the foe', () => {
    const victim = makeMon('v');
    expect(isTrapped(victim, makeMon('f', { ability: 'shadow-tag' }))).toBe(true);
    expect(isTrapped(victim, makeMon('f', { ability: 'arena-trap' }))).toBe(true);
    expect(isTrapped(makeMon('bird', { types: ['flying'] }), makeMon('f', { ability: 'arena-trap' }))).toBe(false);
    expect(isTrapped(makeMon('steel', { types: ['steel'] }), makeMon('f', { ability: 'magnet-pull' }))).toBe(true);
    expect(isTrapped(makeMon('ghost', { types: ['ghost'] }), makeMon('f', { ability: 'shadow-tag' }))).toBe(false);
    const t = team([victim, makeMon('b')]);
    expect(normalizeServerBattleAction(t, sw(1), 'simplified', makeMon('f', { ability: 'shadow-tag' })).errorCode).toBe('switch_trapped');
  });

  it('Pressure spends an extra PP', async () => {
    const s = makeBattle(fast(), makeMon('target', { speed: 30, ability: 'pressure' }));
    await play(s, mv('tackle'));
    expect(P(s).moves.find((m) => m.id === 'tackle')!.pp).toBe(8);
  });

  it('Klutz disables the held item', () => {
    expect(effectiveItem(makeMon('a', { ability: 'klutz', item: 'choice-band' }))).toBeUndefined();
  });

  it('Cheek Pouch heals after eating a berry; Ripen doubles Sitrus', async () => {
    let s = makeBattle(fast(), makeMon('target', { speed: 30, ability: 'cheek-pouch', item: 'sitrus-berry', hp: 220 }));
    await play(s, mv('strength'));
    const cheek = O(s).currentHp;
    s = makeBattle(fast(), makeMon('target', { speed: 30, item: 'sitrus-berry', hp: 220 }));
    await play(s, mv('strength'));
    expect(cheek - O(s).currentHp).toBeGreaterThan(100);
    s = makeBattle(fast(), makeMon('target', { speed: 30, ability: 'ripen', item: 'sitrus-berry', hp: 220 }));
    await play(s, mv('strength'));
    const ripened = O(s).currentHp;
    s = makeBattle(fast(), makeMon('target', { speed: 30, item: 'sitrus-berry', hp: 220 }));
    await play(s, mv('strength'));
    expect(ripened - O(s).currentHp).toBeGreaterThan(80);
  });
});
