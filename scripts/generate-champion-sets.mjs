#!/usr/bin/env node
// Generates src/data/champion-sets.ts: battle sets (moves, ability, item, nature, EVs, Tera Type) for the
// gym leader / Elite Four / Champion teams in src/lib/gym_champions.ts.
//
// Source data: Pokémon Showdown's curated random-battle sets (moves, abilities, Tera Types), its Pokédex
// and its move data. Download them once, then run:
//
//   node scripts/generate-champion-sets.mjs <showdown-data-dir>
//
// where <showdown-data-dir> contains:
//   pokedex.ts, moves.json (moves keyed by id), rb/gen9-sets.json ... rb/gen3-sets.json
//   (raw files from github.com/smogon/pokemon-showdown: data/pokedex.ts, data/moves.ts -> JSON,
//    data/random-battles/genN/sets.json)
//
// Difficulty follows the games: below level 30 trainers keep level-up moves and no items (no entry here);
// from 30 they get curated moves, natures and half EVs, and only their ace holds an item; from 50
// (Elite Four, Champions) they get full sets with items and full EVs. The output is static, so battles
// never depend on these sources at runtime.

import fs from 'node:fs';
import path from 'node:path';

const dataDir = process.argv[2];
if (!dataDir) {
  console.error('usage: node scripts/generate-champion-sets.mjs <showdown-data-dir>');
  process.exit(1);
}
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const toID = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const pokeapiId = (name) =>
  String(name).toLowerCase().replace(/['.,:]/g, '').replace(/[\s_]+/g, '-');

// --- Pokédex: dex number -> species (base forms only)
const dexSrc = fs.readFileSync(path.join(dataDir, 'pokedex.ts'), 'utf8');
const speciesByNum = new Map();
for (const m of dexSrc.matchAll(/^\t(\w+): \{\n([\s\S]*?)^\t\},/gm)) {
  const [, key, body] = m;
  const num = body.match(/\bnum: (-?\d+)/);
  if (!num || body.includes('baseSpecies:')) continue;
  const stats = body.match(/baseStats: \{hp: (\d+), atk: (\d+), def: (\d+), spa: (\d+), spd: (\d+), spe: (\d+)\}/);
  const types = [...(body.match(/types: \[([^\]]*)\]/)?.[1] ?? '').matchAll(/"([^"]+)"/g)].map((x) => x[1].toLowerCase());
  const ability0 = body.match(/abilities: \{0: "([^"]+)"/)?.[1];
  if (!speciesByNum.has(Number(num[1]))) {
    speciesByNum.set(Number(num[1]), {
      id: key,
      stats: stats ? { hp: +stats[1], atk: +stats[2], def: +stats[3], spa: +stats[4], spd: +stats[5], spe: +stats[6] } : null,
      types,
      ability0,
      nfe: /\bevos: \[/.test(body),
    });
  }
}

const moves = JSON.parse(fs.readFileSync(path.join(dataDir, 'moves.json'), 'utf8'));
const GENS = ['gen9', 'gen8', 'gen7', 'gen6', 'gen5', 'gen4', 'gen3'];
const randomSets = Object.fromEntries(
  GENS.map((g) => [g, JSON.parse(fs.readFileSync(path.join(dataDir, 'rb', `${g}-sets.json`), 'utf8'))]),
);

// --- Champions (parsed from the source so the data stays aligned with it)
const champSrc = fs.readFileSync(path.join(repo, 'src/lib/gym_champions.ts'), 'utf8');
const champions = [];
for (const block of champSrc.split(/\n\s*\{\s*\n?\s*id: '/).slice(1)) {
  const id = block.match(/^([^']+)'/)?.[1];
  const name = block.match(/name: '([^']+)'/)?.[1] ?? '';
  // Names may be single- or double-quoted ("Sirfetch'd")
  const slots = [...block.matchAll(/\{ id: (\d+), level: (\d+), name: (?:'([^']*)'|"([^"]*)") \}/g)].map((m) => ({
    id: +m[1],
    level: +m[2],
    name: m[3] ?? m[4],
  }));
  if (id && slots.length) champions.push({ id, name, slots });
}

// --- Move picking
const RECOVERY = new Set(['recover', 'roost', 'slackoff', 'softboiled', 'synthesis', 'moonlight', 'morningsun', 'shoreup', 'strengthsap', 'wish', 'milkdrink', 'rest']);
const SETUP = new Set(['swordsdance', 'nastyplot', 'dragondance', 'calmmind', 'bulkup', 'quiverdance', 'shellsmash', 'shiftgear', 'coil', 'agility', 'rockpolish', 'curse', 'bellydrum', 'victorydance', 'tidyup', 'tailglow', 'geomancy', 'workup', 'growth', 'honeclaws', 'irondefense', 'cosmicpower', 'autotomize', 'clangoroussoul', 'noretreat', 'filletaway']);
const HAZARDS = new Set(['stealthrock', 'spikes', 'toxicspikes', 'stickyweb']);
const STATUSERS = new Set(['toxic', 'willowisp', 'thunderwave', 'spore', 'sleeppowder', 'yawn', 'glare', 'hypnosis', 'stunspore', 'nuzzle']);
const SKIP = (id) => id.startsWith('hiddenpower');

function scoreMove(id, species, physicalLean) {
  const mv = moves[id];
  if (!mv) return { score: -1, damaging: false };
  if (mv.category === 'Status') {
    if (RECOVERY.has(id)) return { score: 70, damaging: false, kind: 'recovery' };
    if (SETUP.has(id)) return { score: 75, damaging: false, kind: 'setup' };
    if (HAZARDS.has(id)) return { score: 55, damaging: false, kind: 'hazard' };
    if (STATUSERS.has(id)) return { score: 50, damaging: false, kind: 'status' };
    return { score: 35, damaging: false, kind: 'other' };
  }
  let bp = mv.basePower || 60; // fixed / variable damage moves count as 60
  if (Array.isArray(mv.multihit)) bp *= (mv.multihit[0] + mv.multihit[1]) / 2 === 3.5 ? 3 : (mv.multihit[0] + mv.multihit[1]) / 2;
  else if (typeof mv.multihit === 'number') bp *= mv.multihit;
  let score = bp * (mv.accuracy === true ? 1 : (mv.accuracy ?? 100) / 100);
  if (species.types.includes(String(mv.type).toLowerCase())) score *= 1.5;
  const physical = mv.category === 'Physical';
  score *= physical === physicalLean ? 1.15 : 0.7;
  if ((mv.priority ?? 0) > 0) score += 15;
  return { score, damaging: true, type: mv.type, category: mv.category };
}

function pickMoves(pool, species) {
  const lean = species.stats ? species.stats.atk >= species.stats.spa : true;
  const scored = pool
    .map((m) => toID(m))
    .filter((id) => !SKIP(id) && moves[id])
    .map((id) => ({ id, ...scoreMove(id, species, lean) }))
    .filter((m) => m.score > 0);
  const chosen = [];
  const types = new Set();
  let statusCount = 0;
  let setupCount = 0;
  const remaining = [...scored];
  while (chosen.length < 4 && remaining.length) {
    for (const m of remaining) {
      m.eff = m.score;
      if (m.damaging && types.has(m.type)) m.eff *= 0.55;
      if (!m.damaging && statusCount >= 2) m.eff = -1;
      if (m.kind === 'setup' && setupCount >= 1) m.eff = -1;
    }
    remaining.sort((a, b) => b.eff - a.eff || a.id.localeCompare(b.id));
    const next = remaining.shift();
    if (!next || next.eff < 0) break;
    chosen.push(next);
    if (next.damaging) types.add(next.type);
    else statusCount += 1;
    if (next.kind === 'setup') setupCount += 1;
  }
  return chosen;
}

const evRound = (n) => Math.floor(n / 4) * 4;
const POISON_OR_STEEL = (types) => types.includes('poison');

function buildSet(slot, slotIndex, champion) {
  const species = speciesByNum.get(slot.id);
  if (!species || slot.level < 30) return null;
  const tier = slot.level >= 50 ? 'full' : 'half';
  const isAce = slotIndex === champion.slots.length - 1;
  const gen = GENS.find((g) => randomSets[g][species.id]);
  const entry = gen ? randomSets[gen][species.id] : null;
  const sets = entry?.sets ?? [];
  const preferred = isAce
    ? sets.find((s) => /Sweeper|Attacker|Wallbreaker/.test(s.role)) ?? sets[0]
    : sets[slotIndex % Math.max(1, sets.length)];

  const picked = preferred ? pickMoves(preferred.movepool, species) : [];
  const damaging = picked.filter((m) => m.damaging);
  const physicalCount = damaging.filter((m) => m.category === 'Physical').length;
  const physical = damaging.length ? physicalCount * 2 >= damaging.length : (species.stats?.atk ?? 0) >= (species.stats?.spa ?? 0);
  const role = preferred?.role ?? '';
  const bulky = /Bulky|Support|Staller|Pivot|\bWall\b/.test(role) && !/Attacker|Setup|Wallbreaker/.test(role);
  const fast = (species.stats?.spe ?? 0) >= 80 && !/Bulky/.test(role);
  const atkKey = physical ? 'attack' : 'special-attack';

  let nature;
  let evs;
  if (bulky) {
    const defKey = (species.stats?.def ?? 0) <= (species.stats?.spd ?? 0) ? 'defense' : 'special-defense';
    nature = defKey === 'defense' ? (physical ? 'impish' : 'bold') : (physical ? 'careful' : 'calm');
    evs = { hp: 252, [defKey]: 252, [atkKey]: 4 };
  } else if (fast) {
    nature = /Wallbreaker/.test(role) ? (physical ? 'adamant' : 'modest') : (physical ? 'jolly' : 'timid');
    evs = { [atkKey]: 252, speed: 252, hp: 4 };
  } else {
    nature = physical ? 'adamant' : 'modest';
    evs = { hp: 252, [atkKey]: 252, speed: 4 };
  }
  if (tier === 'half') evs = Object.fromEntries(Object.entries(evs).map(([k, v]) => [k, evRound(v / 2)]));

  const hasStatus = picked.some((m) => !m.damaging);
  let item;
  if (tier === 'full') {
    if (species.nfe) item = 'eviolite';
    else if (/Wallbreaker/.test(role) && !hasStatus) item = physical ? 'choice-band' : 'choice-specs';
    else if (/Fast Attacker/.test(role) && !hasStatus && (species.stats?.spe ?? 0) >= 60 && (species.stats?.spe ?? 0) <= 100) item = 'choice-scarf';
    else if (bulky) item = POISON_OR_STEEL(species.types) ? 'black-sludge' : 'leftovers';
    else if (/Setup|Attacker|Wallbreaker/.test(role)) item = 'life-orb';
    else item = 'sitrus-berry';
  } else if (isAce) {
    item = 'sitrus-berry';
  }

  const abilityName = preferred?.abilities?.[0] ?? species.ability0;
  const teraType = preferred?.teraTypes?.[0]?.toLowerCase();
  return {
    ...(picked.length >= 2 ? { moves: picked.map((m) => pokeapiId(moves[m.id].name)) } : {}),
    ...(abilityName ? { ability: pokeapiId(abilityName) } : {}),
    ...(item ? { item } : {}),
    nature,
    evs,
    ...(teraType && tier === 'full' ? { teraType } : {}),
  };
}

const out = {};
let withMoves = 0;
let total = 0;
for (const champ of champions) {
  const sets = champ.slots.map((slot, i) => buildSet(slot, i, champ));
  if (sets.some(Boolean)) out[champ.id] = sets;
  for (const s of sets) {
    if (!s) continue;
    total += 1;
    if (s.moves) withMoves += 1;
  }
}

const header = `// Generated by scripts/generate-champion-sets.mjs from Pokémon Showdown's random-battle sets,
// Pokédex and move data. Do not edit by hand: change the generator and run it again.
// One entry per team slot of each champion in src/lib/gym_champions.ts (null: level-up moves, no extras).

export type ChampionSet = {
  /** PokeAPI move ids; omitted when no curated set exists (level-up moves are used). */
  moves?: string[];
  ability?: string;
  item?: string;
  nature: string;
  evs: Partial<Record<'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed', number>>;
  teraType?: string;
};

export const CHAMPION_SETS: Record<string, Array<ChampionSet | null>> = `;
fs.writeFileSync(path.join(repo, 'src/data/champion-sets.ts'), `${header}${JSON.stringify(out, null, 2)};\n`);
console.log(`champions: ${champions.length}, slots with sets: ${total}, with curated moves: ${withMoves}`);
