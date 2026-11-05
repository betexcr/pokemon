import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CompiledMove } from '../adapters/pokeapiMoveAdapter';
import { chooseAIAction, chooseAIReplacement, estimateDamagePercent, scoreMoves } from '../offline-battle-ai';
import type { BattlePokemon, BattleState, BattleTeam } from '../team-battle-engine';
import { createBattleRng } from '../battle-rng';
import { createFieldState, EMPTY_HAZARDS } from '../team-battle-types';

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
    phys('earthquake', 'Ground', 100),
    spec('thunderbolt', 'Electric', 90),
    spec('surf', 'Water', 90),
    spec('ice-beam', 'Ice', 90),
    spec('stored-power', 'Psychic', 20),
    phys('quick-attack', 'Normal', 40, { priority: 1, makesContact: true }),
    spec('dream-eater', 'Psychic', 100, { drain: { fraction: 0.5 } }),
    phys('fake-out', 'Normal', 40, { priority: 3, makesContact: true }),
    status('thunder-wave', 'Electric', { accuracy: 90, bypassAccuracyCheck: false, ailment: { kind: 'paralysis', chance: 0 } }),
    status('recover', 'Normal'),
    status('protect', 'Normal', { priority: 4 }),
    status('stealth-rock', 'Rock'),
    status('swords-dance', 'Normal', { target: 'user', statChanges: [{ stat: 'atk', stages: 2, chance: 100 }] }),
    status('splash'),
  ].map((m) => [m.name, m as unknown as CompiledMove]),
);

vi.mock('../moveCache', () => ({
  getMove: vi.fn(async (id: string | number) => MOVES[String(id).toLowerCase()] ?? null),
  getCachedMove: vi.fn((id: string | number) => MOVES[String(id).toLowerCase()]),
}));

type Opts = { types?: string[]; speed?: number; ability?: string; item?: string; hp?: number; moves?: string[] };
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
    moves: (o.moves ?? ['tackle']).map((id) => ({ id, pp: 10, maxPp: 10 })),
    volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    currentAbility: o.ability,
    heldItem: o.item,
  };
}
const team = (members: BattlePokemon[]): BattleTeam =>
  ({ pokemon: members, currentIndex: 0, faintedCount: 0, sideConditions: { screens: {}, hazards: { ...EMPTY_HAZARDS } } }) as BattleTeam;
function battle(ai: BattlePokemon[], player: BattlePokemon[], seed = 4_000_037): BattleState {
  return {
    player: team(player), opponent: team(ai),
    turn: 1, field: createFieldState(), battleLog: [], actionQueue: [], rng: createBattleRng(seed),
    isComplete: false, phase: 'choice',
  } as BattleState;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('offline AI', () => {
  it('uses real move data: picks the super-effective attack', async () => {
    const s = battle([makeMon('ai', { moves: ['tackle', 'surf', 'thunderbolt'] })], [makeMon('foe', { types: ['water'] })]);
    const action = await chooseAIAction(s);
    expect(action).toEqual({ type: 'move', moveId: 'thunderbolt' });
  });

  it('does not pick moves the target is immune to', async () => {
    const s = battle([makeMon('ai', { moves: ['earthquake', 'tackle'] })], [makeMon('bird', { types: ['flying'] })]);
    expect(await chooseAIAction(s)).toEqual({ type: 'move', moveId: 'tackle' });
    expect(estimateDamagePercent(s, s.opponent.pokemon[0], s.player.pokemon[0], 'earthquake')).toBe(0);
  });

  it('skips moves that would fail (Dream Eater on an awake foe, Fake Out after the first turn)', async () => {
    const ai = makeMon('ai', { moves: ['dream-eater', 'fake-out', 'tackle'] });
    ai.volatile.moveActionsSinceEntry = 2;
    const s = battle([ai], [makeMon('foe')]);
    const scores = Object.fromEntries((await (async () => { await chooseAIAction(s); return scoreMoves(s, 'opponent'); })()).map((m) => [m.moveId, m.score]));
    expect(scores['dream-eater']).toBeLessThan(0);
    expect(scores['fake-out']).toBeLessThan(0);
    expect(await chooseAIAction(s)).toEqual({ type: 'move', moveId: 'tackle' });
  });

  it('heals when low and does not heal at full HP', async () => {
    let s = battle([makeMon('ai', { moves: ['recover', 'tackle'], hp: 80 })], [makeMon('foe')]);
    expect(await chooseAIAction(s)).toEqual({ type: 'move', moveId: 'recover' });
    s = battle([makeMon('ai', { moves: ['recover', 'tackle'] })], [makeMon('foe')]);
    expect(await chooseAIAction(s)).toEqual({ type: 'move', moveId: 'tackle' });
  });

  it('does not paralyze an Electric type or a statused foe', async () => {
    let s = battle([makeMon('ai', { moves: ['thunder-wave', 'tackle'] })], [makeMon('foe', { types: ['electric'] })]);
    await chooseAIAction(s);
    expect(scoreMoves(s, 'opponent').find((m) => m.moveId === 'thunder-wave')!.score).toBe(0);
    const burned = makeMon('foe');
    burned.status = 'burned';
    s = battle([makeMon('ai', { moves: ['thunder-wave', 'tackle'] })], [burned]);
    expect(scoreMoves(s, 'opponent').find((m) => m.moveId === 'thunder-wave')!.score).toBe(0);
  });

  it('does not set Stealth Rock twice or use Protect twice in a row', async () => {
    const s = battle([makeMon('ai', { moves: ['stealth-rock', 'protect'] }), makeMon('b')], [makeMon('foe'), makeMon('foe2')]);
    await chooseAIAction(s);
    expect(scoreMoves(s, 'opponent').find((m) => m.moveId === 'stealth-rock')!.score).toBeGreaterThan(0);
    s.player.sideConditions.hazards.stealthRock = true;
    s.opponent.pokemon[0].volatile.protect = { counter: 1 };
    const scores = scoreMoves(s, 'opponent');
    expect(scores.find((m) => m.moveId === 'stealth-rock')!.score).toBe(0);
    expect(scores.find((m) => m.moveId === 'protect')!.score).toBe(0);
  });

  it('values variable power and stat stages (Stored Power with +2 Sp. Atk)', async () => {
    const boosted = makeMon('ai', { moves: ['stored-power'] });
    boosted.statModifiers.specialAttack = 2;
    const s = battle([boosted], [makeMon('foe')]);
    await chooseAIAction(s);
    const plain = battle([makeMon('ai', { moves: ['stored-power'] })], [makeMon('foe')]);
    // 20 → 60 power and doubled Sp. Atk
    expect(estimateDamagePercent(s, boosted, s.player.pokemon[0], 'stored-power'))
      .toBeGreaterThan(4 * estimateDamagePercent(plain, plain.opponent.pokemon[0], plain.player.pokemon[0], 'stored-power'));
  });

  it('switches out of a hopeless matchup, but never while trapped', async () => {
    const weak = makeMon('ai', { moves: ['tackle'], types: ['ground'], speed: 10 });
    const counter = makeMon('counter', { moves: ['thunderbolt'], types: ['water'] });
    const foe = makeMon('foe', { moves: ['surf'], types: ['water'], speed: 100 });
    const s = battle([weak, counter], [foe]);
    expect(await chooseAIAction(s)).toEqual({ type: 'switch', switchIndex: 1 });
    weak.volatile.trapped = { by: 'player' };
    expect((await chooseAIAction(s)).type).toBe('move');
    weak.volatile.trapped = undefined;
    foe.currentAbility = 'shadow-tag';
    expect((await chooseAIAction(s)).type).toBe('move');
  });

  it('picks the replacement with the best matchup', async () => {
    const s = battle(
      [makeMon('fainted', { hp: 0 }), makeMon('fire', { types: ['fire'], moves: ['tackle'] }), makeMon('water', { types: ['water'], moves: ['surf'] })],
      [makeMon('foe', { types: ['fire'], moves: ['tackle'] })],
    );
    s.opponent.pokemon[0].currentHp = 0;
    await chooseAIAction(s);
    expect(chooseAIReplacement(s, 'opponent', [1, 2])).toBe(2);
  });

  it('is reproducible: same seed, same choices', async () => {
    const make = () => battle([makeMon('ai', { moves: ['tackle', 'quick-attack', 'swords-dance'] })], [makeMon('foe')], 77_000_001);
    const a = await chooseAIAction(make());
    const b = await chooseAIAction(make());
    expect(a).toEqual(b);
  });
});
