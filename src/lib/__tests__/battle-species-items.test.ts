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
import { holdsSpeciesItem, itemCritStages } from '../team-battle-held-items';
import { itemsForSpecies } from '../battle-items-catalog';

const base = { critRateStage: 0, bypassAccuracyCheck: false, hits: null, makesContact: false, priority: 0, pp: 20 } as const;
const MOVES: Record<string, CompiledMove> = {
  tackle: { ...base, id: 33, name: 'tackle', type: 'Normal', category: 'Physical', power: 40, accuracy: 100 },
  thunderbolt: { ...base, id: 85, name: 'thunderbolt', type: 'Electric', category: 'Special', power: 90, accuracy: 100 },
  'water-gun': { ...base, id: 55, name: 'water-gun', type: 'Water', category: 'Special', power: 40, accuracy: 100 },
  ember: { ...base, id: 52, name: 'ember', type: 'Fire', category: 'Special', power: 40, accuracy: 100 },
  'dragon-pulse': { ...base, id: 406, name: 'dragon-pulse', type: 'Dragon', category: 'Special', power: 85, accuracy: 100 },
  judgment: { ...base, id: 449, name: 'judgment', type: 'Normal', category: 'Special', power: 100, accuracy: 100 },
  'knock-off': { ...base, id: 282, name: 'knock-off', type: 'Dark', category: 'Physical', power: 65, accuracy: 100 },
  trick: { ...base, id: 271, name: 'trick', type: 'Psychic', category: 'Status', power: null, accuracy: 100, target: 'selected-pokemon' },
  transform: { ...base, id: 144, name: 'transform', type: 'Normal', category: 'Status', power: null, accuracy: null, bypassAccuracyCheck: true },
  splash: { ...base, id: 150, name: 'splash', type: 'Normal', category: 'Status', power: null, accuracy: null, bypassAccuracyCheck: true },
} as unknown as Record<string, CompiledMove>;

vi.mock('../moveCache', () => ({
  getMove: vi.fn(async (id: string | number) => MOVES[String(id).toLowerCase()] ?? null),
  getCachedMove: vi.fn((id: string | number) => MOVES[String(id).toLowerCase()]),
}));

type Opts = { types?: string[]; speed?: number; ability?: string; item?: string };
function makeMon(name: string, o: Opts = {}): BattlePokemon {
  return {
    pokemon: {
      id: 1, name,
      types: (o.types ?? ['normal']).map((t) => ({ type: { name: t } })) as any,
      stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense'].map((st) => ({ stat: { name: st }, base_stat: 100 }))
        .concat([{ stat: { name: 'speed' }, base_stat: o.speed ?? 50 }]),
      weight: 100, abilities: [],
    } as any,
    level: 50, currentHp: 400, maxHp: 400,
    moves: Object.keys(MOVES).map((id) => ({ id, pp: 10, maxPp: 10 })),
    volatile: {},
    statModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    currentAbility: o.ability,
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
async function play(s: BattleState, p: BattleAction, o: BattleAction = mv('splash')) {
  await runBattleTurnFromQueue(s, buildActionQueue(s, p, o), { clearBattleLog: true });
  return s.battleLog.map((e) => e.message);
}
const P = (s: BattleState) => getCurrentPokemon(s.player);
const O = (s: BattleState) => getCurrentPokemon(s.opponent);
const hit = (s: BattleState, name = 'target') => Number(s.battleLog.find((e) => e.type === 'damage_dealt' && e.pokemon === name)?.damage ?? 0);

async function damage(attacker: BattlePokemon, moveId: string, defender = makeMon('target', { speed: 30 })) {
  const s = makeBattle(attacker, defender);
  await play(s, mv(moveId));
  return hit(s, defender.pokemon.name);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('species-specific items', () => {
  it('Light Ball doubles Pikachu’s attacks (and does nothing for others)', async () => {
    const plain = await damage(makeMon('pikachu', { speed: 150 }), 'thunderbolt');
    const ball = await damage(makeMon('pikachu', { speed: 150, item: 'light-ball' }), 'thunderbolt');
    expect(ball / plain).toBeCloseTo(2, 0);
    expect(await damage(makeMon('raichu', { speed: 150, item: 'light-ball' }), 'thunderbolt'))
      .toBe(await damage(makeMon('raichu', { speed: 150 }), 'thunderbolt'));
  });

  it('Thick Club doubles Marowak’s physical attacks', async () => {
    const plain = await damage(makeMon('marowak', { speed: 150 }), 'tackle');
    const club = await damage(makeMon('marowak-alola', { speed: 150, item: 'thick-club' }), 'tackle');
    expect(club / plain).toBeGreaterThan(1.7);
  });

  it('Deep Sea Scale doubles Clamperl’s Sp. Def', async () => {
    const plain = await damage(makeMon('p', { speed: 150 }), 'water-gun', makeMon('clamperl', { speed: 30 }));
    const scale = await damage(makeMon('p', { speed: 150 }), 'water-gun', makeMon('clamperl', { speed: 30, item: 'deep-sea-scale' }));
    expect(scale).toBeLessThan(plain);
  });

  it('Leek / Lucky Punch add two crit stages for their species only', () => {
    expect(itemCritStages(makeMon('farfetchd', { item: 'leek' }))).toBe(2);
    expect(itemCritStages(makeMon('sirfetchd', { item: 'leek' }))).toBe(2);
    expect(itemCritStages(makeMon('chansey', { item: 'lucky-punch' }))).toBe(2);
    expect(itemCritStages(makeMon('blissey', { item: 'lucky-punch' }))).toBe(0);
  });

  it('Quick / Metal Powder work for Ditto until it Transforms', async () => {
    const ditto = makeMon('ditto', { speed: 48, item: 'quick-powder' });
    const base = getEffectiveSpeed(makeMon('ditto', { speed: 48 }));
    expect(getEffectiveSpeed(ditto)).toBe(base * 2);
    const s = makeBattle(ditto, makeMon('target', { speed: 30 }));
    await play(s, mv('transform'));
    expect(holdsSpeciesItem(P(s), 'quick-powder')).toBe(false);
  });

  it('Soul Dew and the legendary orbs boost their types by 20%', async () => {
    const plain = await damage(makeMon('dialga', { speed: 150 }), 'dragon-pulse');
    const orb = await damage(makeMon('dialga', { speed: 150, item: 'adamant-orb' }), 'dragon-pulse');
    expect(orb / plain).toBeCloseTo(1.2, 1);
    const dew = await damage(makeMon('latios', { speed: 150, item: 'soul-dew' }), 'dragon-pulse');
    expect(dew / plain).toBeCloseTo(1.2, 1);
  });

  it('Rusted Sword crowns Zacian once, and the item cannot be removed', async () => {
    const s = makeBattle(makeMon('zacian', { speed: 150, types: ['fairy'], item: 'rusted-sword' }), makeMon('target', { speed: 30 }));
    let log = await play(s, mv('splash'), mv('knock-off'));
    expect(log).toContain('zacian became Zacian, the Crowned Sword!');
    expect(P(s).pokemon.types.map((t: any) => t.type.name)).toEqual(['fairy', 'steel']);
    expect((P(s).pokemon.stats as any[]).find((x) => x.stat.name === 'attack').base_stat).toBe(170);
    expect(P(s).heldItem).toBe('rusted-sword');
    log = await play(s, mv('splash'), mv('trick'));
    expect(log).toContain('But it failed!');
    expect(log.filter((m) => m.includes('Crowned Sword'))).toEqual([]);
  });
});

describe('Plates', () => {
  it('boost their type by 20%', async () => {
    const plain = await damage(makeMon('p', { speed: 150 }), 'ember');
    const plate = await damage(makeMon('p', { speed: 150, item: 'flame-plate' }), 'ember');
    expect(plate / plain).toBeCloseTo(1.2, 1);
  });

  it('make Arceus (Multitype) and Judgment the Plate’s type', async () => {
    const s = makeBattle(
      makeMon('arceus', { speed: 150, ability: 'multitype', item: 'spooky-plate' }),
      makeMon('ghost-target', { speed: 30, types: ['ghost'] }),
    );
    await play(s, mv('judgment'));
    expect(P(s).pokemon.types.map((t: any) => t.type.name)).toEqual(['ghost']);
    // Normal-type Judgment would not touch a Ghost; Ghost-type Judgment hits it super-effectively
    expect(O(s).currentHp).toBeLessThan(400);
  });
});

describe('Gems', () => {
  it('power up the first move of their type once', async () => {
    const plain = await damage(makeMon('p', { speed: 150 }), 'ember');
    const s = makeBattle(makeMon('p', { speed: 150, item: 'fire-gem' }));
    const log = await play(s, mv('ember'));
    expect(log).toContain("The Fire Gem strengthened p's power!");
    expect(hit(s) / plain).toBeCloseTo(1.3, 1);
    expect(P(s).heldItem).toBeUndefined();
  });

  it('are kept for other types and against immune targets', async () => {
    let s = makeBattle(makeMon('p', { speed: 150, item: 'fire-gem' }));
    await play(s, mv('tackle'));
    expect(P(s).heldItem).toBe('fire-gem');
    s = makeBattle(makeMon('p', { speed: 150, item: 'normal-gem' }), makeMon('ghost', { speed: 30, types: ['ghost'] }));
    await play(s, mv('tackle'));
    expect(P(s).heldItem).toBe('normal-gem');
  });
});

describe('team builder catalog', () => {
  it('only offers species items to their species', () => {
    const forPikachu = itemsForSpecies('pikachu').map((i) => i.id);
    const forEevee = itemsForSpecies('eevee').map((i) => i.id);
    expect(forPikachu).toContain('light-ball');
    expect(forEevee).not.toContain('light-ball');
    expect(forEevee).toContain('flame-plate');
    expect(forEevee).toContain('fire-gem');
  });
});
