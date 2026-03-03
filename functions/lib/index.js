"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../src/data/natures.ts
var natures_exports = {};
__export(natures_exports, {
  DEFAULT_NATURE: () => DEFAULT_NATURE,
  NATURES: () => NATURES,
  getNature: () => getNature
});
function getNature(value) {
  const fallback = NATURES[0];
  return NATURES.find((nature) => nature.value === value) || fallback;
}
var NATURES, DEFAULT_NATURE;
var init_natures = __esm({
  "../src/data/natures.ts"() {
    "use strict";
    NATURES = [
      { value: "hardy", label: "Hardy", increasedStat: null, decreasedStat: null },
      { value: "lonely", label: "Lonely", increasedStat: "attack", decreasedStat: "defense" },
      { value: "brave", label: "Brave", increasedStat: "attack", decreasedStat: "speed" },
      { value: "adamant", label: "Adamant", increasedStat: "attack", decreasedStat: "special-attack" },
      { value: "naughty", label: "Naughty", increasedStat: "attack", decreasedStat: "special-defense" },
      { value: "bold", label: "Bold", increasedStat: "defense", decreasedStat: "attack" },
      { value: "docile", label: "Docile", increasedStat: null, decreasedStat: null },
      { value: "relaxed", label: "Relaxed", increasedStat: "defense", decreasedStat: "speed" },
      { value: "impish", label: "Impish", increasedStat: "defense", decreasedStat: "special-attack" },
      { value: "lax", label: "Lax", increasedStat: "defense", decreasedStat: "special-defense" },
      { value: "timid", label: "Timid", increasedStat: "speed", decreasedStat: "attack" },
      { value: "hasty", label: "Hasty", increasedStat: "speed", decreasedStat: "defense" },
      { value: "serious", label: "Serious", increasedStat: null, decreasedStat: null },
      { value: "jolly", label: "Jolly", increasedStat: "speed", decreasedStat: "special-attack" },
      { value: "naive", label: "Naive", increasedStat: "speed", decreasedStat: "special-defense" },
      { value: "modest", label: "Modest", increasedStat: "special-attack", decreasedStat: "attack" },
      { value: "mild", label: "Mild", increasedStat: "special-attack", decreasedStat: "defense" },
      { value: "quiet", label: "Quiet", increasedStat: "special-attack", decreasedStat: "speed" },
      { value: "bashful", label: "Bashful", increasedStat: null, decreasedStat: null },
      { value: "rash", label: "Rash", increasedStat: "special-attack", decreasedStat: "special-defense" },
      { value: "calm", label: "Calm", increasedStat: "special-defense", decreasedStat: "attack" },
      { value: "gentle", label: "Gentle", increasedStat: "special-defense", decreasedStat: "defense" },
      { value: "sassy", label: "Sassy", increasedStat: "special-defense", decreasedStat: "speed" },
      { value: "careful", label: "Careful", increasedStat: "special-defense", decreasedStat: "special-attack" },
      { value: "quirky", label: "Quirky", increasedStat: null, decreasedStat: null }
    ];
    DEFAULT_NATURE = "hardy";
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  api: () => api
});
module.exports = __toCommonJS(index_exports);
var import_express = __toESM(require("express"));
var functions = __toESM(require("firebase-functions"));
var admin = __toESM(require("firebase-admin"));

// ../src/lib/battle-resolution.ts
var import_database = require("firebase-admin/database");

// ../src/lib/battle-rng.ts
var RNG_MOD = 2147483647;
var RNG_MULT = 48271;
function createBattleRng(seed) {
  let base = seed ?? Date.now();
  if (!Number.isFinite(base)) {
    base = Date.now();
  }
  base = Math.floor(Math.abs(base)) % RNG_MOD;
  if (base === 0) {
    base = 1;
  }
  return {
    seed: base,
    state: base,
    calls: 0
  };
}
function advance(rng) {
  const next = rng.state * RNG_MULT % RNG_MOD;
  rng.state = next;
  rng.calls += 1;
  return next;
}
function rngNextFloat(rng) {
  return advance(rng) / RNG_MOD;
}
function rngRollChance(rng, probability) {
  if (probability <= 0) return false;
  if (probability >= 1) return true;
  return rngNextFloat(rng) < probability;
}

// ../src/lib/damage-calculator.ts
var TYPE_CHART = {
  "Normal": { "Rock": 0.5, "Ghost": 0, "Steel": 0.5 },
  "Fire": { "Fire": 0.5, "Water": 0.5, "Grass": 2, "Ice": 2, "Bug": 2, "Rock": 0.5, "Dragon": 0.5, "Steel": 2, "Poison": 0.5 },
  "Water": { "Fire": 2, "Water": 0.5, "Grass": 0.5, "Ground": 2, "Rock": 2, "Dragon": 0.5 },
  "Electric": { "Water": 2, "Electric": 0.5, "Grass": 0.5, "Ground": 0, "Flying": 2, "Dragon": 0.5 },
  "Grass": { "Fire": 0.5, "Water": 2, "Grass": 0.5, "Poison": 0.5, "Ground": 2, "Flying": 0.5, "Bug": 0.5, "Rock": 2, "Dragon": 0.5, "Steel": 0.5 },
  "Ice": { "Fire": 0.5, "Water": 0.5, "Grass": 2, "Ice": 0.5, "Ground": 2, "Flying": 2, "Dragon": 2, "Steel": 0.5 },
  "Fighting": { "Normal": 2, "Ice": 2, "Poison": 0.5, "Flying": 0.5, "Psychic": 0.5, "Bug": 1, "Rock": 2, "Ghost": 0, "Dark": 2, "Steel": 2, "Fairy": 0.5 },
  "Poison": { "Grass": 2, "Poison": 0.5, "Ground": 0.5, "Rock": 0.5, "Ghost": 0.5, "Steel": 0, "Fairy": 2 },
  "Ground": { "Fire": 2, "Electric": 2, "Grass": 0.5, "Poison": 2, "Flying": 0, "Bug": 1, "Rock": 2, "Steel": 2 },
  "Flying": { "Electric": 0.5, "Grass": 2, "Fighting": 2, "Bug": 2, "Rock": 0.5, "Steel": 0.5 },
  "Psychic": { "Fighting": 2, "Poison": 2, "Psychic": 0.5, "Dark": 0, "Steel": 0.5 },
  "Bug": { "Fire": 0.5, "Grass": 2, "Fighting": 0.5, "Poison": 0.5, "Flying": 0.5, "Psychic": 2, "Ghost": 0.5, "Dark": 2, "Steel": 0.5, "Fairy": 0.5 },
  "Rock": { "Fire": 2, "Ice": 2, "Fighting": 0.5, "Ground": 0.5, "Flying": 2, "Bug": 2, "Steel": 0.5 },
  "Ghost": { "Normal": 0, "Psychic": 2, "Ghost": 2, "Dark": 0.5 },
  "Dragon": { "Dragon": 2, "Steel": 0.5, "Fairy": 0 },
  "Dark": { "Fighting": 0.5, "Psychic": 2, "Ghost": 2, "Dark": 0.5, "Fairy": 0.5 },
  "Steel": { "Fire": 0.5, "Water": 0.5, "Electric": 0.5, "Ice": 2, "Rock": 2, "Fairy": 2, "Steel": 0.5 },
  "Fairy": { "Fire": 0.5, "Fighting": 2, "Poison": 0.5, "Dragon": 2, "Dark": 2, "Steel": 0.5 }
};
function calculateTypeEffectiveness(attackType, defenderTypes) {
  return defenderTypes.reduce((product, defenderType) => {
    const normalizedAttackType = attackType.charAt(0).toUpperCase() + attackType.slice(1).toLowerCase();
    const normalizedDefenderType = defenderType.charAt(0).toUpperCase() + defenderType.slice(1).toLowerCase();
    const effectiveness = TYPE_CHART[normalizedAttackType]?.[normalizedDefenderType] ?? 1;
    return product * effectiveness;
  }, 1);
}
function getStatStageMultiplier(stage) {
  if (stage >= 0) {
    return (2 + stage) / 2;
  } else {
    return 2 / (2 + Math.abs(stage));
  }
}
function calculateDamage({
  level,
  movePower,
  attackStat,
  defenseStat,
  isCrit,
  stab,
  typeEffect,
  weatherMod,
  burnMod,
  otherMods = 1,
  rng
}) {
  const crit = isCrit ? 1.5 : 1;
  const rand = 0.85 + rngNextFloat(rng) * 0.15;
  const base = Math.floor(
    Math.floor((2 * level / 5 + 2) * movePower * attackStat / defenseStat / 50) + 2
  );
  const modifier = stab * typeEffect * weatherMod * crit * burnMod * rand * otherMods;
  if (typeEffect === 0) {
    return 0;
  }
  return Math.max(1, Math.floor(base * modifier));
}
function getWeatherModifier(moveType, weather) {
  switch (weather) {
    case "Rain":
      return moveType === "Water" ? 1.5 : moveType === "Fire" ? 0.5 : 1;
    case "Sun":
      return moveType === "Fire" ? 1.5 : moveType === "Water" ? 0.5 : 1;
    default:
      return 1;
  }
}
function getBurnModifier(isBurned, isPhysical, hasGuts = false) {
  if (isBurned && isPhysical && !hasGuts) {
    return 0.5;
  }
  return 1;
}
function getStabMultiplier(moveType, attackerTypes, hasAdaptability = false) {
  const hasStab = attackerTypes.includes(moveType);
  if (!hasStab) return 1;
  return hasAdaptability ? 2 : 1.5;
}
function getCriticalHitChance(baseCritRate = 0.0625, hasHighCritMove = false, hasSuperLuck = false, rng) {
  let critRate = baseCritRate;
  if (hasHighCritMove) {
    critRate = 0.125;
  }
  if (hasSuperLuck) {
    critRate *= 2;
  }
  return rngRollChance(rng, critRate);
}
function calculateComprehensiveDamage({
  level,
  movePower,
  moveType,
  attackerTypes,
  defenderTypes,
  attackStat,
  defenseStat,
  attackStatStages = 0,
  defenseStatStages = 0,
  isPhysical,
  weather = "None",
  isBurned = false,
  hasGuts = false,
  hasAdaptability = false,
  hasLifeOrb = false,
  hasExpertBelt = false,
  hasReflect = false,
  hasLightScreen = false,
  hasAuroraVeil = false,
  isMultiTarget = false,
  terrain = "None",
  hasTintedLens = false,
  hasFilter = false,
  hasSolidRock = false,
  hasMultiscale = false,
  isFullHp = true,
  hasHugePower = false,
  hasPurePower = false,
  hasSniper = false,
  isHighCritMove = false,
  hasSuperLuck = false,
  rng
}) {
  const modifiedAttackStat = attackStat * getStatStageMultiplier(attackStatStages);
  const modifiedDefenseStat = defenseStat * getStatStageMultiplier(defenseStatStages);
  let finalAttackStat = modifiedAttackStat;
  if (hasHugePower || hasPurePower) {
    finalAttackStat *= 2;
  }
  let typeEffect = calculateTypeEffectiveness(moveType, defenderTypes);
  if (hasTintedLens && typeEffect < 1) {
    typeEffect *= 2;
  }
  if ((hasFilter || hasSolidRock) && typeEffect > 1) {
    typeEffect *= 0.75;
  }
  const stab = getStabMultiplier(moveType, attackerTypes, hasAdaptability);
  const weatherMod = getWeatherModifier(moveType, weather);
  const burnMod = getBurnModifier(isBurned, isPhysical, hasGuts);
  let otherMods = 1;
  if (hasLifeOrb) {
    otherMods *= 1.3;
  }
  if (hasExpertBelt && typeEffect > 1) {
    otherMods *= 1.2;
  }
  if (hasReflect && isPhysical) {
    otherMods *= 0.5;
  }
  if (hasLightScreen && !isPhysical) {
    otherMods *= 0.5;
  }
  if (hasAuroraVeil) {
    otherMods *= 0.5;
  }
  if (isMultiTarget) {
    otherMods *= 0.75;
  }
  if (terrain === "Electric" && moveType === "Electric") {
    otherMods *= 1.3;
  }
  if (terrain === "Grassy" && moveType === "Grass") {
    otherMods *= 1.3;
  }
  if (terrain === "Psychic" && moveType === "Psychic") {
    otherMods *= 1.3;
  }
  if (hasMultiscale && isFullHp) {
    otherMods *= 0.5;
  }
  const isCrit = getCriticalHitChance(0.0625, isHighCritMove, hasSuperLuck, rng);
  let critMultiplier = isCrit ? 1.5 : 1;
  if (isCrit && hasSniper) {
    critMultiplier = 2.25;
  }
  const damage = calculateDamage({
    level,
    movePower,
    attackStat: finalAttackStat,
    defenseStat: modifiedDefenseStat,
    isCrit,
    stab,
    typeEffect,
    weatherMod,
    burnMod,
    otherMods,
    rng
  });
  let effectivenessText;
  if (typeEffect === 0) {
    effectivenessText = "no_effect";
  } else if (typeEffect >= 2) {
    effectivenessText = "super_effective";
  } else if (typeEffect <= 0.5) {
    effectivenessText = "not_very_effective";
  } else {
    effectivenessText = "normal";
  }
  return {
    damage,
    effectiveness: typeEffect,
    critical: isCrit,
    effectivenessText
  };
}

// ../src/lib/pokeapi.ts
var BASE = "https://pokeapi.co/api/v2";
async function fetchWithRetry(url, retries = 3, delay = 1e3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status >= 500 && i < retries - 1) {
          await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
          continue;
        }
        throw new Error(`Fetch failed: ${res.status}`);
      }
      return res;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
  throw new Error("Unreachable");
}
async function fetchMove(idOrName) {
  const res = await fetchWithRetry(`${BASE}/move/${idOrName}`);
  return res.json();
}

// ../src/lib/adapters/pokeapiMoveAdapter.ts
function mapType(t) {
  const m = {
    normal: "Normal",
    fire: "Fire",
    water: "Water",
    electric: "Electric",
    grass: "Grass",
    ice: "Ice",
    fighting: "Fighting",
    poison: "Poison",
    ground: "Ground",
    flying: "Flying",
    psychic: "Psychic",
    bug: "Bug",
    rock: "Rock",
    ghost: "Ghost",
    dragon: "Dragon",
    dark: "Dark",
    steel: "Steel",
    fairy: "Fairy"
  };
  const v = m[t];
  if (!v) throw new Error(`Unknown type ${t}`);
  return v;
}
var STAT_MAP = {
  attack: "atk",
  defense: "def",
  "special-attack": "spa",
  "special-defense": "spd",
  speed: "spe",
  accuracy: "acc",
  evasion: "eva"
};
function mapCategory(s) {
  if (s === "status") return "Status";
  if (s === "physical") return "Physical";
  if (s === "special") return "Special";
  throw new Error(`Unknown damage_class: ${s}`);
}
function extractShortEffect(effect_entries, effect_chance) {
  const en = effect_entries.find((e) => e.language?.name === "en");
  if (!en) return void 0;
  const effect = en;
  const txt = effect.short_effect || void 0;
  if (!txt) return void 0;
  return txt.replace("$effect_chance", (effect_chance ?? "").toString());
}
function critStageFromMeta(meta) {
  const metaObj = meta;
  return Math.max(0, Math.min(3, metaObj?.crit_rate ?? 0));
}
function parseSecondary(meta) {
  const out = {};
  const metaObj = meta;
  if (metaObj?.ailment && metaObj.ailment?.name && metaObj.ailment.name !== "none") {
    out.ailment = { kind: metaObj.ailment.name, chance: metaObj.ailment_chance ?? 0 };
  }
  return out;
}
function parseTopLevelStatChanges(move) {
  const moveObj = move;
  const chance = moveObj.effect_chance ?? 100;
  if (!Array.isArray(moveObj.stat_changes) || moveObj.stat_changes.length === 0) return void 0;
  const list = moveObj.stat_changes.map((sc) => {
    const scObj = sc;
    const stat = STAT_MAP[scObj.stat?.name || ""];
    if (!stat) return void 0;
    return { stat, stages: scObj.change, chance };
  }).filter(Boolean);
  return list.length ? list : void 0;
}
function parseRecoilDrain(meta) {
  const out = {};
  const metaObj = meta;
  if (metaObj?.recoil && metaObj.recoil > 0) out.recoil = { fraction: metaObj.recoil / 100 };
  if (metaObj?.drain && metaObj.drain > 0) out.drain = { fraction: metaObj.drain / 100 };
  return out;
}
function parseHits(move) {
  const moveObj = move;
  if (moveObj.min_hits && moveObj.max_hits) return { min: moveObj.min_hits, max: moveObj.max_hits };
  return null;
}
function dynamicPowerResolver(name) {
  const n = name.toLowerCase();
  if (n === "low-kick" || n === "grass-knot") {
    return ({ defender }) => {
      const w = defender.weightKg ?? 0;
      if (w >= 200) return 120;
      if (w >= 100) return 100;
      if (w >= 50) return 80;
      if (w >= 25) return 60;
      if (w >= 10) return 40;
      return 20;
    };
  }
  if (n === "heavy-slam" || n === "heat-crash") {
    return ({ attacker, defender }) => {
      const a = attacker.weightKg ?? 1, d = defender.weightKg ?? 1;
      const ratio = a / d;
      if (ratio >= 5) return 120;
      if (ratio >= 4) return 100;
      if (ratio >= 3) return 80;
      if (ratio >= 2) return 60;
      return 40;
    };
  }
  if (n === "electro-ball") {
    return ({ attacker, defender }) => {
      const as = Math.max(1, attacker.speed ?? 1), ds = Math.max(1, defender.speed ?? 1);
      const r = as / ds;
      if (r >= 4) return 150;
      if (r >= 3) return 120;
      if (r >= 2) return 80;
      if (r >= 1) return 60;
      return 40;
    };
  }
  if (n === "gyro-ball") {
    return ({ attacker, defender }) => {
      const as = Math.max(1, attacker.speed ?? 1), ds = Math.max(1, defender.speed ?? 1);
      return Math.max(1, Math.min(150, Math.floor(25 * (ds / as))));
    };
  }
  if (n === "reversal" || n === "flail") {
    return ({ attacker }) => {
      const hp = attacker.curHP ?? 1, max = Math.max(1, attacker.maxHP ?? 1);
      const p = hp / max;
      if (p <= 1 / 48) return 200;
      if (p <= 1 / 6) return 150;
      if (p <= 1 / 5) return 100;
      if (p <= 1 / 3) return 80;
      if (p <= 1 / 2) return 40;
      return 20;
    };
  }
  if (n === "eruption" || n === "water-spout") {
    return ({ attacker }) => {
      const hp = attacker.curHP ?? 1, max = Math.max(1, attacker.maxHP ?? 1);
      return Math.floor(150 * (hp / max));
    };
  }
  return void 0;
}
async function loadMoveFromPokeAPI(idOrName) {
  const mv = await fetchMove(idOrName);
  const rm = {
    id: mv.id,
    name: mv.name,
    // keep API name ("thunderbolt"); you can display with toTitleName
    type: mapType(mv.type.name),
    category: mapCategory(mv.damage_class.name),
    power: mv.power ?? null,
    accuracy: mv.accuracy ?? null,
    pp: mv.pp ?? null,
    priority: mv.priority ?? 0,
    critRateStage: critStageFromMeta(mv.meta),
    ...parseRecoilDrain(mv.meta),
    hits: parseHits(mv),
    makesContact: !!mv.meta?.makes_contact,
    bypassAccuracyCheck: mv.accuracy === null,
    // per PokeAPI: null -> no accuracy check
    shortEffect: extractShortEffect(mv.effect_entries, mv.effect_chance),
    ...parseSecondary(mv.meta),
    statChanges: parseTopLevelStatChanges(mv)
  };
  const dyn = dynamicPowerResolver(mv.name);
  const compiled = { ...rm, getPower: dyn };
  return compiled;
}

// ../src/lib/moveCache.ts
function normalizeMoveIdentifier(idOrName) {
  if (typeof idOrName === "number") return idOrName;
  const trimmed = idOrName.trim();
  if (!trimmed) return "";
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  const slug = trimmed.toLowerCase().replace(/[\u2019']/g, "-").replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return slug || trimmed.toLowerCase();
}
var moveCache = /* @__PURE__ */ new Map();
async function getMove(idOrName) {
  const normalized = normalizeMoveIdentifier(idOrName);
  const key = typeof normalized === "number" ? String(normalized) : normalized;
  if (!key && key !== "0") {
    throw new Error(`Invalid move identifier: ${idOrName}`);
  }
  if (moveCache.has(key)) {
    return moveCache.get(key);
  }
  try {
    const move = await loadMoveFromPokeAPI(normalized);
    moveCache.set(key, move);
    return move;
  } catch (error) {
    console.error(`Failed to load move ${idOrName}:`, error);
    throw error;
  }
}

// ../src/lib/team-battle-hazards.ts
function getPokemonTypes(pokemon) {
  return pokemon.pokemon.types.map((entry) => typeof entry === "string" ? entry : entry.type?.name || "").filter((t) => Boolean(t));
}
function isGrounded(pokemon) {
  return !pokemon.pokemon.types.some((typeEntry) => {
    const type = typeof typeEntry === "string" ? typeEntry : typeEntry.type?.name || "";
    return type === "Flying";
  });
}

// ../src/lib/team-battle-field.ts
function decrementFieldTimers(field, screens) {
  if (field.weather && field.weather.turns > 0) {
    field.weather.turns -= 1;
    if (field.weather.turns <= 0) {
      delete field.weather;
    }
  }
  if (field.terrain && field.terrain.turns > 0) {
    field.terrain.turns -= 1;
    if (field.terrain.turns <= 0) {
      delete field.terrain;
    }
  }
  if (!field.rooms) field.rooms = {};
  if (field.rooms.trickRoom) {
    field.rooms.trickRoom.turns -= 1;
    if (field.rooms.trickRoom.turns <= 0) {
      delete field.rooms.trickRoom;
    }
  }
  const decrementScreens = (side) => {
    if (side.reflect) {
      side.reflect.turns -= 1;
      if (side.reflect.turns <= 0) delete side.reflect;
    }
    if (side.lightScreen) {
      side.lightScreen.turns -= 1;
      if (side.lightScreen.turns <= 0) delete side.lightScreen;
    }
    if (side.auroraVeil) {
      side.auroraVeil.turns -= 1;
      if (side.auroraVeil.turns <= 0) delete side.auroraVeil;
    }
    if (side.safeguard) {
      side.safeguard.turns -= 1;
      if (side.safeguard.turns <= 0) delete side.safeguard;
    }
    if (side.tailwind) {
      side.tailwind.turns -= 1;
      if (side.tailwind.turns <= 0) delete side.tailwind;
    }
  };
  decrementScreens(screens.player);
  decrementScreens(screens.opponent);
}
function applyWeatherResidual(state) {
  const weather = state.field.weather?.kind;
  if (weather === "sandstorm") {
    [state.player, state.opponent].forEach((team) => {
      const pokemon = getCurrentPokemon(team);
      if (pokemon.currentHp <= 0) return;
      const types = getPokemonTypes(pokemon);
      const immune = types.includes("Rock") || types.includes("Ground") || types.includes("Steel");
      if (!immune) {
        const damage = Math.floor(pokemon.maxHp / 16);
        if (damage > 0) {
          pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
          state.battleLog.push({
            type: "status_damage",
            message: `${pokemon.pokemon.name} is buffeted by the sandstorm!`,
            pokemon: pokemon.pokemon.name,
            damage: Math.round(damage / pokemon.maxHp * 100)
          });
        }
      }
    });
  }
}
function applyTerrainHealing(state) {
  const terrain = state.field.terrain?.kind;
  if (terrain === "grassy") {
    [state.player, state.opponent].forEach((team) => {
      const pokemon = getCurrentPokemon(team);
      if (pokemon.currentHp <= 0) return;
      const healed = Math.floor(pokemon.maxHp / 16);
      if (healed > 0 && pokemon.currentHp < pokemon.maxHp) {
        pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + healed);
        state.battleLog.push({
          type: "healing",
          message: `${pokemon.pokemon.name} recovered HP from Grassy Terrain!`,
          pokemon: pokemon.pokemon.name,
          healing: Math.round(healed / pokemon.maxHp * 100)
        });
      }
    });
  }
}
function applyLeechSeed(state) {
  const applySeed = (owner, target) => {
    const targetPokemon = getCurrentPokemon(target);
    if (targetPokemon.currentHp <= 0) return;
    const seedInfo = targetPokemon.volatile.leechSeedSource;
    if (!seedInfo) return;
    const ownerTeam = seedInfo.owner === "player" ? state.player : state.opponent;
    const seeder = ownerTeam.pokemon[seedInfo.index];
    if (!seeder || seeder.currentHp <= 0) {
      targetPokemon.volatile.leechSeedSource = void 0;
      return;
    }
    const damage = Math.floor(targetPokemon.maxHp / 8);
    if (damage <= 0) return;
    targetPokemon.currentHp = Math.max(0, targetPokemon.currentHp - damage);
    seeder.currentHp = Math.min(seeder.maxHp, seeder.currentHp + damage);
    state.battleLog.push({
      type: "status_damage",
      message: `${targetPokemon.pokemon.name} had its energy drained!`,
      pokemon: targetPokemon.pokemon.name,
      damage: Math.round(damage / targetPokemon.maxHp * 100)
    });
    state.battleLog.push({
      type: "healing",
      message: `${seeder.pokemon.name} absorbed nutrients with Leech Seed!`,
      pokemon: seeder.pokemon.name,
      healing: Math.round(damage / seeder.maxHp * 100)
    });
  };
  applySeed(state.player, state.opponent);
  applySeed(state.opponent, state.player);
}
function applyBindingDamage(state) {
  const processBinding = (team) => {
    const pokemon = getCurrentPokemon(team);
    const binding = pokemon.volatile.binding;
    if (!binding) return;
    const damage = Math.max(1, Math.floor(pokemon.maxHp * binding.fraction));
    pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
    binding.turnsLeft -= 1;
    state.battleLog.push({
      type: "status_damage",
      message: `${pokemon.pokemon.name} is hurt by ${binding.kind}!`,
      pokemon: pokemon.pokemon.name,
      damage: Math.round(damage / pokemon.maxHp * 100)
    });
    if (binding.turnsLeft <= 0) {
      pokemon.volatile.binding = void 0;
      state.battleLog.push({
        type: "status_effect",
        message: `${pokemon.pokemon.name} was freed from ${binding.kind}!`,
        pokemon: pokemon.pokemon.name
      });
    }
  };
  processBinding(state.player);
  processBinding(state.opponent);
}

// ../src/lib/team-battle-status.ts
function clearStatus(pokemon) {
  pokemon.status = void 0;
  pokemon.statusTurns = void 0;
  pokemon.volatile.toxicCounter = void 0;
}
function applyEndOfTurnStatus(state, pokemon) {
  if (pokemon.currentAbility?.toLowerCase() === "magic-guard") {
    return;
  }
  switch (pokemon.status) {
    case "poisoned":
    case "badly-poisoned": {
      pokemon.volatile.toxicCounter = pokemon.volatile.toxicCounter || (pokemon.status === "badly-poisoned" ? 1 : 0);
      if (pokemon.status === "badly-poisoned") {
        pokemon.volatile.toxicCounter += 1;
      }
      const fraction = pokemon.status === "badly-poisoned" ? Math.min(16, pokemon.volatile.toxicCounter ?? 1) / 16 : 1 / 8;
      const damage = Math.floor(pokemon.maxHp * fraction);
      if (damage > 0) {
        pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
        state.battleLog.push({
          type: "status_damage",
          message: `${pokemon.pokemon.name} was hurt by poison!`,
          pokemon: pokemon.pokemon.name,
          damage: Math.round(damage / pokemon.maxHp * 100)
        });
      }
      break;
    }
    case "burned": {
      const damage = Math.floor(pokemon.maxHp / 16);
      if (damage > 0) {
        pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
        state.battleLog.push({
          type: "status_damage",
          message: `${pokemon.pokemon.name} was hurt by its burn!`,
          pokemon: pokemon.pokemon.name,
          damage: Math.round(damage / pokemon.maxHp * 100)
        });
      }
      break;
    }
    default:
      break;
  }
}

// ../src/lib/team-battle-items.ts
function tryHarvestBerry(state, target) {
  if (target.heldItem) return;
  const lastBerry = target.volatile.lastConsumedBerry;
  if (!lastBerry) return;
  const ability = target.currentAbility?.toLowerCase();
  if (ability !== "harvest") return;
  const isSun = state.field.weather?.kind === "sun";
  const chance = isSun ? 1 : 0.5;
  if (rngRollChance(state.rng, chance)) {
    target.heldItem = lastBerry;
    target.volatile.lastConsumedBerry = void 0;
    state.battleLog.push({
      type: "status_effect",
      message: `${target.pokemon.name} harvested a ${formatBerryName(lastBerry)}!`,
      pokemon: target.pokemon.name
    });
  }
}
function formatBerryName(item) {
  return item.replace(/-/g, " ");
}

// ../src/lib/team-battle-engine-additional.ts
async function processStartOfTurn(state) {
  console.log("\u{1F304} Processing start-of-turn effects");
  if (state.field.weather) {
    const weatherMessages = {
      "rain": "Rain continues to fall.",
      "sun": "The sunlight is strong.",
      "sandstorm": "The sandstorm rages.",
      "snow": "Snow continues to fall."
    };
    const message = weatherMessages[state.field.weather.kind];
    if (message) {
      state.battleLog.push({
        type: "status_effect",
        message
      });
    }
  }
  if (state.field.terrain) {
    const terrainMessages = {
      "electric": "Electric current runs across the battlefield.",
      "grassy": "Grass is covering the battlefield.",
      "psychic": "The battlefield is weird.",
      "misty": "Mist swirls around the battlefield."
    };
    const message = terrainMessages[state.field.terrain.kind];
    if (message) {
      state.battleLog.push({
        type: "status_effect",
        message
      });
    }
  }
  const playerPokemon = getCurrentPokemon(state.player);
  const opponentPokemon = getCurrentPokemon(state.opponent);
  playerPokemon.volatile.flinched = false;
  playerPokemon.volatile.justSwitchedIn = false;
  opponentPokemon.volatile.flinched = false;
  opponentPokemon.volatile.justSwitchedIn = false;
  if (playerPokemon.volatile.yawn) {
    playerPokemon.volatile.yawn.turns--;
    if (playerPokemon.volatile.yawn.turns <= 0) {
      playerPokemon.status = "asleep";
      playerPokemon.statusTurns = 0;
      playerPokemon.volatile.yawn = void 0;
      state.battleLog.push({
        type: "status_applied",
        message: `${playerPokemon.pokemon.name} fell asleep!`,
        pokemon: playerPokemon.pokemon.name,
        status: "ASLEEP"
      });
    }
  }
  if (opponentPokemon.volatile.yawn) {
    opponentPokemon.volatile.yawn.turns--;
    if (opponentPokemon.volatile.yawn.turns <= 0) {
      opponentPokemon.status = "asleep";
      opponentPokemon.statusTurns = 0;
      opponentPokemon.volatile.yawn = void 0;
      state.battleLog.push({
        type: "status_applied",
        message: `${opponentPokemon.pokemon.name} fell asleep!`,
        pokemon: opponentPokemon.pokemon.name,
        status: "ASLEEP"
      });
    }
  }
}
async function processEndOfTurn(state) {
  console.log("\u{1F305} Processing end-of-turn effects");
  applyWeatherResidual(state);
  processResidualDamage(state);
  applyTerrainHealing(state);
  applyLeechSeed(state);
  applyBindingDamage(state);
  decrementFieldTimers(state.field, {
    player: state.player.sideConditions.screens,
    opponent: state.opponent.sideConditions.screens
  });
  applyEndOfTurnStatus(state, getCurrentPokemon(state.player));
  applyEndOfTurnStatus(state, getCurrentPokemon(state.opponent));
  processItemResiduals(state);
  processEndOfTurnAbilities(state);
  processVolatileDecrements(state);
  checkResidualFaints(state);
}
function processResidualDamage(state) {
  const playerPokemon = getCurrentPokemon(state.player);
  const opponentPokemon = getCurrentPokemon(state.opponent);
  if (playerPokemon.status === "poisoned" || playerPokemon.status === "badly-poisoned") {
    if (!playerPokemon.volatile.toxicCounter) {
      playerPokemon.volatile.toxicCounter = playerPokemon.status === "badly-poisoned" ? 1 : 0;
    }
    if (playerPokemon.status === "badly-poisoned") {
      playerPokemon.volatile.toxicCounter += 1;
    }
    const damageFraction = playerPokemon.status === "badly-poisoned" ? Math.min(16, playerPokemon.volatile.toxicCounter ?? 1) / 16 : 1 / 8;
    const damage = Math.floor(playerPokemon.maxHp * damageFraction);
    const oldHp = playerPokemon.currentHp;
    playerPokemon.currentHp = Math.max(0, playerPokemon.currentHp - damage);
    if (damage > 0) {
      state.battleLog.push({
        type: "status_damage",
        message: `${playerPokemon.pokemon.name} was hurt by poison!`,
        pokemon: playerPokemon.pokemon.name,
        damage: Math.round(damage / playerPokemon.maxHp * 100)
      });
    }
    if (oldHp > 0 && playerPokemon.currentHp <= 0) {
      state.player.faintedCount = state.player.pokemon.filter((p) => p.currentHp <= 0).length;
    }
  }
  if (opponentPokemon.status === "poisoned" || opponentPokemon.status === "badly-poisoned") {
    if (!opponentPokemon.volatile.toxicCounter) {
      opponentPokemon.volatile.toxicCounter = opponentPokemon.status === "badly-poisoned" ? 1 : 0;
    }
    if (opponentPokemon.status === "badly-poisoned") {
      opponentPokemon.volatile.toxicCounter += 1;
    }
    const damageFraction = opponentPokemon.status === "badly-poisoned" ? Math.min(16, opponentPokemon.volatile.toxicCounter ?? 1) / 16 : 1 / 8;
    const damage = Math.floor(opponentPokemon.maxHp * damageFraction);
    const oldHp = opponentPokemon.currentHp;
    opponentPokemon.currentHp = Math.max(0, opponentPokemon.currentHp - damage);
    if (damage > 0) {
      state.battleLog.push({
        type: "status_damage",
        message: `${opponentPokemon.pokemon.name} was hurt by poison!`,
        pokemon: opponentPokemon.pokemon.name,
        damage: Math.round(damage / opponentPokemon.maxHp * 100)
      });
    }
    if (oldHp > 0 && opponentPokemon.currentHp <= 0) {
      state.opponent.faintedCount = state.opponent.pokemon.filter((p) => p.currentHp <= 0).length;
    }
  }
  if (playerPokemon.status === "burned") {
    const damage = Math.floor(playerPokemon.maxHp / 16);
    const oldHp = playerPokemon.currentHp;
    playerPokemon.currentHp = Math.max(0, playerPokemon.currentHp - damage);
    if (damage > 0) {
      state.battleLog.push({
        type: "status_damage",
        message: `${playerPokemon.pokemon.name} was hurt by its burn!`,
        pokemon: playerPokemon.pokemon.name,
        damage: Math.round(damage / playerPokemon.maxHp * 100)
      });
    }
    if (oldHp > 0 && playerPokemon.currentHp <= 0) {
      state.player.faintedCount = state.player.pokemon.filter((p) => p.currentHp <= 0).length;
    }
  }
  if (opponentPokemon.status === "burned") {
    const damage = Math.floor(opponentPokemon.maxHp / 16);
    const oldHp = opponentPokemon.currentHp;
    opponentPokemon.currentHp = Math.max(0, opponentPokemon.currentHp - damage);
    if (damage > 0) {
      state.battleLog.push({
        type: "status_damage",
        message: `${opponentPokemon.pokemon.name} was hurt by its burn!`,
        pokemon: opponentPokemon.pokemon.name,
        damage: Math.round(damage / opponentPokemon.maxHp * 100)
      });
    }
    if (oldHp > 0 && opponentPokemon.currentHp <= 0) {
      state.opponent.faintedCount = state.opponent.pokemon.filter((p) => p.currentHp <= 0).length;
    }
  }
}
function processItemResiduals(state) {
  const processItem = (team) => {
    const pokemon = getCurrentPokemon(team);
    if (pokemon.currentHp <= 0) return;
    const item = pokemon.heldItem?.toLowerCase();
    if (!item) return;
    if (item === "shell-bell" && pokemon.volatile.damageDealtThisTurn) {
      const heal = Math.max(1, Math.floor(pokemon.volatile.damageDealtThisTurn / 8));
      if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
        pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
        state.battleLog.push({
          type: "healing",
          message: `${pokemon.pokemon.name} restored HP with Shell Bell!`,
          pokemon: pokemon.pokemon.name,
          healing: Math.round(heal / pokemon.maxHp * 100)
        });
      }
    }
    if (item === "leftovers" || item === "black-sludge" && pokemon.pokemon.types.some((t) => (typeof t === "string" ? t : t.type?.name || "") === "Poison")) {
      const heal = Math.floor(pokemon.maxHp / 16);
      if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
        pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
        state.battleLog.push({
          type: "healing",
          message: `${pokemon.pokemon.name} restored HP with ${item === "leftovers" ? "Leftovers" : "Black Sludge"}!`,
          pokemon: pokemon.pokemon.name,
          healing: Math.round(heal / pokemon.maxHp * 100)
        });
      }
    } else if (item === "black-sludge") {
      const damage = Math.floor(pokemon.maxHp / 8);
      if (damage > 0) {
        pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
        state.battleLog.push({
          type: "status_damage",
          message: `${pokemon.pokemon.name} was hurt by Black Sludge!`,
          pokemon: pokemon.pokemon.name,
          damage: Math.round(damage / pokemon.maxHp * 100)
        });
      }
    }
  };
  processItem(state.player);
  processItem(state.opponent);
  getCurrentPokemon(state.player).volatile.damageDealtThisTurn = 0;
  getCurrentPokemon(state.opponent).volatile.damageDealtThisTurn = 0;
}
function processEndOfTurnAbilities(state) {
  [state.player, state.opponent].forEach((team) => {
    const pokemon = getCurrentPokemon(team);
    if (pokemon.currentHp <= 0) return;
    const ability = pokemon.currentAbility?.toLowerCase();
    switch (ability) {
      case "speed-boost": {
        pokemon.statModifiers.speed = Math.min(6, pokemon.statModifiers.speed + 1);
        state.battleLog.push({
          type: "status_effect",
          message: `${pokemon.pokemon.name}'s Speed rose thanks to Speed Boost!`,
          pokemon: pokemon.pokemon.name
        });
        break;
      }
      case "shed-skin": {
        if (pokemon.status && rngRollChance(state.rng, 0.3)) {
          const oldStatus = pokemon.status;
          clearStatus(pokemon);
          state.battleLog.push({
            type: "status_effect",
            message: `${pokemon.pokemon.name} shed its ${oldStatus}!`,
            pokemon: pokemon.pokemon.name
          });
        }
        break;
      }
      case "hydration": {
        if (pokemon.status && state.field.weather?.kind === "rain") {
          const oldStatus = pokemon.status;
          clearStatus(pokemon);
          state.battleLog.push({
            type: "status_effect",
            message: `${pokemon.pokemon.name}'s Hydration cured its ${oldStatus}!`,
            pokemon: pokemon.pokemon.name
          });
        }
        break;
      }
      case "rain-dish": {
        if (state.field.weather?.kind === "rain") {
          const heal = Math.floor(pokemon.maxHp / 16);
          if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
            pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
            state.battleLog.push({
              type: "healing",
              message: `${pokemon.pokemon.name} restored HP with Rain Dish!`,
              pokemon: pokemon.pokemon.name,
              healing: Math.round(heal / pokemon.maxHp * 100)
            });
          }
        }
        break;
      }
      case "dry-skin": {
        if (state.field.weather?.kind === "rain") {
          const heal = Math.floor(pokemon.maxHp / 8);
          if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
            pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
            state.battleLog.push({
              type: "healing",
              message: `${pokemon.pokemon.name} restored HP with Dry Skin!`,
              pokemon: pokemon.pokemon.name,
              healing: Math.round(heal / pokemon.maxHp * 100)
            });
          }
        } else if (state.field.weather?.kind === "sun") {
          const damage = Math.floor(pokemon.maxHp / 8);
          if (damage > 0) {
            pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
            state.battleLog.push({
              type: "status_damage",
              message: `${pokemon.pokemon.name} was hurt by Dry Skin under the sun!`,
              pokemon: pokemon.pokemon.name,
              damage: Math.round(damage / pokemon.maxHp * 100)
            });
          }
        }
        break;
      }
      case "solar-power": {
        if (state.field.weather?.kind === "sun") {
          const damage = Math.max(1, Math.floor(pokemon.maxHp / 8));
          pokemon.currentHp = Math.max(0, pokemon.currentHp - damage);
          state.battleLog.push({
            type: "status_damage",
            message: `${pokemon.pokemon.name} is hurt by Solar Power!`,
            pokemon: pokemon.pokemon.name,
            damage: Math.round(damage / pokemon.maxHp * 100)
          });
        }
        break;
      }
      case "ice-body": {
        if (state.field.weather?.kind === "snow") {
          const heal = Math.floor(pokemon.maxHp / 16);
          if (heal > 0 && pokemon.currentHp < pokemon.maxHp) {
            pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + heal);
            state.battleLog.push({
              type: "healing",
              message: `${pokemon.pokemon.name} restored HP with Ice Body!`,
              pokemon: pokemon.pokemon.name,
              healing: Math.round(heal / pokemon.maxHp * 100)
            });
          }
        }
        break;
      }
      case "harvest": {
        tryHarvestBerry(state, pokemon);
        break;
      }
      default:
        break;
    }
  });
}
function processVolatileDecrements(state) {
  const playerPokemon = getCurrentPokemon(state.player);
  const opponentPokemon = getCurrentPokemon(state.opponent);
  if (playerPokemon.volatile.confusion) {
    playerPokemon.volatile.confusion.turns--;
    if (playerPokemon.volatile.confusion.turns <= 0) {
      playerPokemon.volatile.confusion = void 0;
      state.battleLog.push({
        type: "status_effect",
        message: `${playerPokemon.pokemon.name} snapped out of confusion!`,
        pokemon: playerPokemon.pokemon.name
      });
    }
  }
  if (opponentPokemon.volatile.confusion) {
    opponentPokemon.volatile.confusion.turns--;
    if (opponentPokemon.volatile.confusion.turns <= 0) {
      opponentPokemon.volatile.confusion = void 0;
      state.battleLog.push({
        type: "status_effect",
        message: `${opponentPokemon.pokemon.name} snapped out of confusion!`,
        pokemon: opponentPokemon.pokemon.name
      });
    }
  }
  if (playerPokemon.volatile.encore) {
    playerPokemon.volatile.encore.turns--;
    if (playerPokemon.volatile.encore.turns <= 0) {
      playerPokemon.volatile.encore = void 0;
    }
  }
  if (opponentPokemon.volatile.encore) {
    opponentPokemon.volatile.encore.turns--;
    if (opponentPokemon.volatile.encore.turns <= 0) {
      opponentPokemon.volatile.encore = void 0;
    }
  }
  if (playerPokemon.volatile.taunt) {
    playerPokemon.volatile.taunt.turns--;
    if (playerPokemon.volatile.taunt.turns <= 0) {
      playerPokemon.volatile.taunt = void 0;
    }
  }
  if (opponentPokemon.volatile.taunt) {
    opponentPokemon.volatile.taunt.turns--;
    if (opponentPokemon.volatile.taunt.turns <= 0) {
      opponentPokemon.volatile.taunt = void 0;
    }
  }
  if (playerPokemon.volatile.disable) {
    playerPokemon.volatile.disable.turns--;
    if (playerPokemon.volatile.disable.turns <= 0) {
      playerPokemon.volatile.disable = void 0;
    }
  }
  if (opponentPokemon.volatile.disable) {
    opponentPokemon.volatile.disable.turns--;
    if (opponentPokemon.volatile.disable.turns <= 0) {
      opponentPokemon.volatile.disable = void 0;
    }
  }
  if (playerPokemon.volatile.perishSong) {
    playerPokemon.volatile.perishSong.turns--;
    if (playerPokemon.volatile.perishSong.turns <= 0) {
      playerPokemon.currentHp = 0;
      state.battleLog.push({
        type: "pokemon_fainted",
        message: `${playerPokemon.pokemon.name} fainted due to Perish Song!`,
        pokemon: playerPokemon.pokemon.name
      });
      state.player.faintedCount = state.player.pokemon.filter((p) => p.currentHp <= 0).length;
    }
  }
  if (opponentPokemon.volatile.perishSong) {
    opponentPokemon.volatile.perishSong.turns--;
    if (opponentPokemon.volatile.perishSong.turns <= 0) {
      opponentPokemon.currentHp = 0;
      state.battleLog.push({
        type: "pokemon_fainted",
        message: `${opponentPokemon.pokemon.name} fainted due to Perish Song!`,
        pokemon: opponentPokemon.pokemon.name
      });
      state.opponent.faintedCount = state.opponent.pokemon.filter((p) => p.currentHp <= 0).length;
    }
  }
}
function checkResidualFaints(state) {
  const playerPokemon = getCurrentPokemon(state.player);
  const opponentPokemon = getCurrentPokemon(state.opponent);
  if (playerPokemon.currentHp <= 0) {
    state.battleLog.push({
      type: "pokemon_fainted",
      message: `${playerPokemon.pokemon.name} fainted!`,
      pokemon: playerPokemon.pokemon.name
    });
  }
  if (opponentPokemon.currentHp <= 0) {
    state.battleLog.push({
      type: "pokemon_fainted",
      message: `${opponentPokemon.pokemon.name} fainted!`,
      pokemon: opponentPokemon.pokemon.name
    });
  }
}

// ../src/lib/team-battle-engine.ts
function normalizeTypeName(raw) {
  const fallback = "Normal";
  if (!raw || typeof raw !== "string") return fallback;
  const normalized = raw.toLowerCase();
  const formatted = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return formatted;
}
function determineWeatherModifier(kind) {
  switch (kind) {
    case "rain":
      return "Rain";
    case "sun":
      return "Sun";
    case "sandstorm":
      return "Sandstorm";
    case "snow":
      return "Hail";
    default:
      return "None";
  }
}
function determineTerrainModifier(terrainKind, moveType, attackerGrounded) {
  if (!terrainKind || terrainKind === "none" || !attackerGrounded) {
    return "None";
  }
  const normalized = terrainKind.toLowerCase();
  switch (normalized) {
    case "electric":
      return moveType === "Electric" ? "Electric" : "None";
    case "grassy":
      return moveType === "Grass" ? "Grassy" : "None";
    case "psychic":
      return moveType === "Psychic" ? "Psychic" : "None";
    default:
      return "None";
  }
}
function getMovePriority(moveId) {
  const priorityMoves = {
    "quick-guard": 4,
    "wide-guard": 4,
    "protect": 4,
    "detect": 4,
    "king-s-shield": 4,
    "spiky-shield": 4,
    "baneful-bunker": 4,
    "quick-attack": 1,
    "extreme-speed": 2,
    "fake-out": 3,
    "sucker-punch": 1,
    "bullet-punch": 1,
    "ice-shard": 1,
    "shadow-sneak": 1,
    "mach-punch": 1,
    "vacuum-wave": 1,
    "trick-room": -6,
    "wonder-room": -6,
    "magic-room": -6
  };
  return priorityMoves[moveId] || 0;
}
function getEffectiveSpeed(pokemon) {
  const baseSpeed = pokemon.pokemon.stats?.find((stat) => stat.stat.name === "speed")?.base_stat || 50;
  let calculatedSpeed = calculateStat(baseSpeed, pokemon.level);
  try {
    if (pokemon.nature) {
      const { getNature: getNature2 } = (init_natures(), __toCommonJS(natures_exports));
      const n = getNature2(pokemon.nature);
      if (n.increasedStat === "speed") calculatedSpeed = Math.floor(calculatedSpeed * 1.1);
      if (n.decreasedStat === "speed") calculatedSpeed = Math.floor(calculatedSpeed * 0.9);
    }
  } catch {
  }
  return applyStatModifier(calculatedSpeed, pokemon.statModifiers?.speed || 0);
}
function buildActionQueue(state, playerAction, opponentAction) {
  const queue = [];
  if (playerAction.type === "switch" && opponentAction.type === "move" && opponentAction.moveId === "pursuit") {
    queue.push({
      type: "pursuit",
      user: "opponent",
      moveId: "pursuit",
      target: "player",
      priority: getMovePriority("pursuit"),
      speed: getEffectiveSpeed(getCurrentPokemon(state.opponent))
    });
  }
  if (opponentAction.type === "switch" && playerAction.type === "move" && playerAction.moveId === "pursuit") {
    queue.push({
      type: "pursuit",
      user: "player",
      moveId: "pursuit",
      target: "opponent",
      priority: getMovePriority("pursuit"),
      speed: getEffectiveSpeed(getCurrentPokemon(state.player))
    });
  }
  if (playerAction.type === "switch") {
    queue.push({
      type: "switch",
      user: "player",
      switchIndex: playerAction.switchIndex,
      priority: 6,
      // Switches have priority 6
      speed: 0
    });
  } else if (playerAction.type === "move") {
    queue.push({
      type: "move",
      user: "player",
      moveId: playerAction.moveId,
      target: playerAction.target,
      priority: getMovePriority(playerAction.moveId || ""),
      speed: getEffectiveSpeed(getCurrentPokemon(state.player))
    });
  }
  if (opponentAction.type === "switch") {
    queue.push({
      type: "switch",
      user: "opponent",
      switchIndex: opponentAction.switchIndex,
      priority: 6,
      // Switches have priority 6
      speed: 0
    });
  } else if (opponentAction.type === "move") {
    queue.push({
      type: "move",
      user: "opponent",
      moveId: opponentAction.moveId,
      target: opponentAction.target,
      priority: getMovePriority(opponentAction.moveId || ""),
      speed: getEffectiveSpeed(getCurrentPokemon(state.opponent))
    });
  }
  const isTrickRoomActive = state.field.rooms?.trickRoom && state.field.rooms.trickRoom.turns > 0;
  return queue.sort((a, b) => {
    const classOrder = { pursuit: 0, switch: 1, move: 2 };
    const aClass = classOrder[a.type];
    const bClass = classOrder[b.type];
    if (aClass !== bClass) {
      return aClass - bClass;
    }
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    if (isTrickRoomActive) {
      return a.speed - b.speed;
    } else {
      return b.speed - a.speed;
    }
  });
}
function calculateStat(baseStat, level) {
  return Math.floor((2 * baseStat + 31) * level / 100) + 5;
}
function applyStatModifier(baseStat, modifier) {
  const multiplier = modifier >= 0 ? (2 + modifier) / 2 : 2 / (2 - modifier);
  return Math.floor(baseStat * multiplier);
}
function getCurrentAbility(pokemon) {
  if (pokemon.currentAbility) {
    return pokemon.currentAbility;
  }
  const ability = pokemon.pokemon.abilities.find((a) => !a.is_hidden);
  return ability?.ability.name || "none";
}
async function calculateDamageDetailed(attacker, defender, move, state) {
  console.log("\u2694\uFE0F calculateDamageDetailed START");
  console.log("Attacker:", attacker.pokemon.name);
  console.log("Defender:", defender.pokemon.name);
  console.log("Move:", move.name || move.id);
  let compiledMove;
  try {
    if ("getPower" in move) {
      compiledMove = move;
    } else if (move.type && move.category) {
      compiledMove = {
        ...move,
        id: typeof move.id === "number" ? move.id : 0,
        // Ensure ID is number if expected, or handle string IDs
        name: move.name,
        type: normalizeTypeName(move.type),
        category: move.category,
        // Cast to match expected category type
        power: move.power || 0,
        accuracy: move.accuracy || 100,
        pp: move.pp || 0,
        priority: 0,
        // Default if missing
        critRateStage: 0,
        hits: null,
        makesContact: false,
        bypassAccuracyCheck: false,
        statChanges: void 0
      };
    } else {
      console.log("Fetching move data for:", move.name);
      compiledMove = await getMove(move.name);
      console.log("Move data fetched successfully");
    }
  } catch (e) {
    console.error("\u274C Error preparing move data:", e);
    throw e;
  }
  const rng = state.rng;
  const weatherContext = determineWeatherModifier(state.field.weather?.kind);
  const moveType = normalizeTypeName(compiledMove.type);
  const attackerGrounded = isGrounded(attacker);
  const terrainContext = determineTerrainModifier(state.field.terrain?.kind, moveType, attackerGrounded);
  const attackerItem = attacker.heldItem?.toLowerCase();
  const defenderItem = defender.heldItem?.toLowerCase();
  const level = attacker.level;
  const powerContext = {
    attacker: {
      level: attacker.level,
      weightKg: attacker.pokemon.weight / 10,
      // Convert from hectograms to kg
      speed: attacker.pokemon.stats?.find((s) => s.stat.name === "speed")?.base_stat,
      curHP: attacker.currentHp,
      maxHP: attacker.maxHp
    },
    defender: {
      weightKg: defender.pokemon.weight / 10,
      speed: defender.pokemon.stats?.find((s) => s.stat.name === "speed")?.base_stat,
      curHP: defender.currentHp,
      maxHP: defender.maxHp,
      types: defender.pokemon.types.map(
        (t) => typeof t === "string" ? t : t.type?.name || "normal"
      )
    }
  };
  let power = 0;
  try {
    power = compiledMove.getPower ? compiledMove.getPower(powerContext) : compiledMove.power || 0;
  } catch (e) {
    console.error("\u274C Error calculating move power:", e);
    power = 0;
  }
  console.log("Move Power:", power);
  const isPhysical = compiledMove.category === "Physical";
  const attackerAttackStat = attacker.pokemon.stats?.find((stat) => stat.stat.name === "attack")?.base_stat || 50;
  const attackerSpecialAttackStat = attacker.pokemon.stats?.find((stat) => stat.stat.name === "special-attack")?.base_stat || 50;
  const defenderDefenseStat = defender.pokemon.stats?.find((stat) => stat.stat.name === "defense")?.base_stat || 50;
  const defenderSpecialDefenseStat = defender.pokemon.stats?.find((stat) => stat.stat.name === "special-defense")?.base_stat || 50;
  const attackStat = isPhysical ? calculateStat(attackerAttackStat, level) : calculateStat(attackerSpecialAttackStat, level);
  const defenseStat = isPhysical ? calculateStat(defenderDefenseStat, level) : calculateStat(defenderSpecialDefenseStat, level);
  let attackWithNature = attackStat;
  let defenseWithNature = defenseStat;
  try {
    const natureModule = (init_natures(), __toCommonJS(natures_exports));
    const attackerNature = attacker.nature ? natureModule.getNature(attacker.nature) : null;
    const defenderNature = defender.nature ? natureModule.getNature(defender.nature) : null;
    if (attackerNature) {
      const inc = attackerNature.increasedStat;
      const dec = attackerNature.decreasedStat;
      if (isPhysical) {
        if (inc === "attack") attackWithNature = Math.floor(attackWithNature * 1.1);
        if (dec === "attack") attackWithNature = Math.floor(attackWithNature * 0.9);
      } else {
        if (inc === "special-attack") attackWithNature = Math.floor(attackWithNature * 1.1);
        if (dec === "special-attack") attackWithNature = Math.floor(attackWithNature * 0.9);
      }
    }
    if (defenderNature) {
      const inc = defenderNature.increasedStat;
      const dec = defenderNature.decreasedStat;
      if (isPhysical) {
        if (inc === "defense") defenseWithNature = Math.floor(defenseWithNature * 1.1);
        if (dec === "defense") defenseWithNature = Math.floor(defenseWithNature * 0.9);
      } else {
        if (inc === "special-defense") defenseWithNature = Math.floor(defenseWithNature * 1.1);
        if (dec === "special-defense") defenseWithNature = Math.floor(defenseWithNature * 0.9);
      }
    }
  } catch (e) {
    console.error("Error applying nature modifiers:", e);
  }
  const critStage = compiledMove.critRateStage || 0;
  const isCrit = rngRollChance(rng, critStage > 0 ? 0.125 : 0.0417);
  const attackerAbility = getCurrentAbility(attacker)?.toLowerCase();
  const defenderAbility = getCurrentAbility(defender)?.toLowerCase();
  const attackerTypes = attacker.pokemon.types.map(
    (t) => typeof t === "string" ? t : t.type?.name || "normal"
  );
  const defenderTypes = defender.pokemon.types.map(
    (t) => typeof t === "string" ? t : t.type?.name || "normal"
  );
  const hasGuts = attackerAbility === "guts" && attacker.status !== void 0;
  const hasAdaptability = attackerAbility === "adaptability";
  const hasTintedLens = attackerAbility === "tinted-lens";
  const defenderHasFilter = defenderAbility === "filter";
  const defenderHasSolidRock = defenderAbility === "solid-rock";
  const defenderHasMultiscale = defenderAbility === "multiscale";
  const hasHugePower = attackerAbility === "huge-power";
  const hasPurePower = attackerAbility === "pure-power";
  const hasSniper = attackerAbility === "sniper";
  const hasSuperLuck = attackerAbility === "super-luck";
  const isHighCritMove = (compiledMove.critRateStage || 0) > 0;
  const result = calculateComprehensiveDamage({
    level,
    movePower: power,
    moveType,
    attackerTypes,
    defenderTypes,
    attackStat: attackWithNature,
    defenseStat: defenseWithNature,
    attackStatStages: attacker.statModifiers.attack,
    defenseStatStages: defender.statModifiers.defense,
    isPhysical,
    weather: weatherContext,
    isBurned: attacker.status === "burned",
    hasGuts,
    hasAdaptability,
    hasLifeOrb: attackerItem === "life-orb",
    hasExpertBelt: attackerItem === "expert-belt",
    hasReflect: hasScreen(state, defender, "reflect") && isPhysical && !isCrit,
    hasLightScreen: hasScreen(state, defender, "lightScreen") && !isPhysical && !isCrit,
    hasAuroraVeil: hasScreen(state, defender, "auroraVeil") && !isCrit,
    isMultiTarget: false,
    terrain: terrainContext,
    hasTintedLens,
    hasFilter: defenderHasFilter,
    hasSolidRock: defenderHasSolidRock,
    hasMultiscale: defenderHasMultiscale,
    isFullHp: defender.currentHp === defender.maxHp,
    hasHugePower,
    hasPurePower,
    hasSniper,
    isHighCritMove,
    hasSuperLuck,
    rng
  });
  const statusEffect = compiledMove.ailment ? compiledMove.ailment.kind : void 0;
  const flinch = compiledMove.ailment?.kind === "flinch" && rngRollChance(state.rng, (compiledMove.ailment.chance ?? 0) / 100);
  return {
    damage: result.damage,
    effectiveness: result.effectiveness,
    critical: result.critical,
    statusEffect: statusEffect || void 0,
    flinch: flinch || void 0
  };
}
function getCurrentPokemon(team) {
  return team.pokemon[team.currentIndex];
}
function isTeamDefeated(team) {
  return team.faintedCount >= team.pokemon.length;
}
function getNextAvailablePokemon(team) {
  console.log("=== GET NEXT AVAILABLE POKEMON DEBUG ===");
  console.log("Team state:", {
    currentIndex: team.currentIndex,
    faintedCount: team.faintedCount,
    teamSize: team.pokemon.length,
    pokemon: team.pokemon.map((p, i) => ({
      index: i,
      name: p.pokemon.name,
      hp: p.currentHp,
      maxHp: p.maxHp,
      isCurrent: i === team.currentIndex,
      isFainted: p.currentHp <= 0
    }))
  });
  for (let i = 0; i < team.pokemon.length; i++) {
    const pokemon = team.pokemon[i];
    console.log(`Checking Pokemon ${i} (${pokemon.pokemon.name}): HP=${pokemon.currentHp}, Available=${pokemon.currentHp > 0}`);
    if (i === team.currentIndex && pokemon.currentHp <= 0) {
      console.log(`Skipping current Pokemon ${i} (${pokemon.pokemon.name}) - it's fainted`);
      continue;
    }
    if (pokemon.currentHp > 0) {
      console.log(`Found available Pokemon at index ${i}: ${pokemon.pokemon.name}`);
      return i;
    }
  }
  console.log("No available Pokemon found");
  return null;
}
function hasScreen(state, defender, screen) {
  const isPlayer = defender === getCurrentPokemon(state.player);
  const screens = isPlayer ? state.player.sideConditions.screens : state.opponent.sideConditions.screens;
  if (screen === "auroraVeil") {
    return Boolean(screens.auroraVeil);
  }
  return Boolean(screens[screen]);
}

// ../src/lib/battle-resolution.ts
async function hydrateTeam(team) {
  const hydratedTeam = await Promise.all(team.map(async (p) => {
    if (p.pokemon.stats?.length && p.pokemon.types?.length) {
      return p;
    }
    return p;
  }));
  return hydratedTeam;
}
async function fetchBattleState(battleId) {
  const db = (0, import_database.getDatabase)();
  const metaRef = db.ref(`battles/${battleId}/meta`);
  const metaSnap = await metaRef.once("value");
  const meta = metaSnap.val();
  if (!meta) return null;
  const p1PrivateRef = db.ref(`battles/${battleId}/private/${meta.players.p1.uid}`);
  const p2PrivateRef = db.ref(`battles/${battleId}/private/${meta.players.p2.uid}`);
  const publicRef = db.ref(`battles/${battleId}/public`);
  const [p1Snap, p2Snap, publicSnap] = await Promise.all([
    p1PrivateRef.once("value"),
    p2PrivateRef.once("value"),
    publicRef.once("value")
  ]);
  if (!p1Snap.exists() || !p2Snap.exists() || !publicSnap.exists()) {
    console.error("fetchBattleState: Missing data snapshots");
    console.error("P1 Private exists:", p1Snap.exists());
    console.error("P2 Private exists:", p2Snap.exists());
    console.error("Public exists:", publicSnap.exists());
    return null;
  }
  const p1Private = p1Snap.val();
  const p2Private = p2Snap.val();
  const publicState = publicSnap.val();
  const [p1HydratedTeam, p2HydratedTeam] = await Promise.all([
    hydrateTeam(p1Private.team),
    hydrateTeam(p2Private.team)
  ]);
  const p1Team = {
    pokemon: p1HydratedTeam,
    // Use hydrated team
    // Use saved currentIndex if available, otherwise default to 0
    currentIndex: p1Private.currentIndex ?? 0,
    faintedCount: p1Private.team.filter((p) => p.currentHp <= 0).length,
    sideConditions: {
      screens: publicState.field.screens.p1,
      hazards: publicState.field.hazards.p1
    }
  };
  const p2Team = {
    pokemon: p2HydratedTeam,
    // Use hydrated team
    currentIndex: p2Private.currentIndex ?? 0,
    faintedCount: p2Private.team.filter((p) => p.currentHp <= 0).length,
    sideConditions: {
      screens: publicState.field.screens.p2,
      hazards: publicState.field.hazards.p2
    }
  };
  return {
    player: p1Team,
    // p1 is "player" from perspective of engine for now, we'll handle perspective in execution
    opponent: p2Team,
    // p2 is "opponent"
    turn: meta.turn,
    rng: createBattleRng(Date.now()),
    // We should ideally store/retrieve RNG seed
    battleLog: [],
    isComplete: meta.phase === "ended",
    winner: meta.winnerUid === meta.players.p1.uid ? "player" : meta.winnerUid === meta.players.p2.uid ? "opponent" : void 0,
    phase: "selection",
    // We are resolving, so we start from selection state effectively
    actionQueue: [],
    field: {
      weather: void 0,
      // TODO: Map from publicState if needed
      terrain: void 0,
      rooms: {}
    }
  };
}
async function resolveTurn(battleId) {
  console.log("=== RESOLVE TURN CALLED ===", battleId);
  console.log("Getting database reference...");
  const db = (0, import_database.getDatabase)();
  const metaRef = db.ref(`battles/${battleId}/meta`);
  console.log("Database reference obtained");
  const metaSnap = await metaRef.once("value");
  if (!metaSnap.exists()) throw new Error("Battle not found");
  const meta = metaSnap.val();
  if (meta.phase !== "choosing") {
    console.warn("Battle not in choosing phase, skipping resolution");
    return;
  }
  const choicesRef = db.ref(`battles/${battleId}/turns/${meta.turn}/choices`);
  const choicesSnap = await choicesRef.once("value");
  const choices = choicesSnap.val();
  if (!choices || !choices[meta.players.p1.uid] || !choices[meta.players.p2.uid]) {
    console.log("Not all players have submitted choices yet.");
    console.log("P1 submitted:", !!(choices && choices[meta.players.p1.uid]));
    console.log("P2 submitted:", !!(choices && choices[meta.players.p2.uid]));
    return;
  }
  console.log("\u2705 Both players submitted choices. Starting resolution...");
  console.log("Current meta:", JSON.stringify(meta, null, 2));
  const { committed, snapshot } = await metaRef.transaction((currentMeta) => {
    console.log("\u{1F504} Transaction callback - currentMeta:", currentMeta);
    console.log("\u{1F504} Expected turn:", meta.turn);
    const metaToCheck = currentMeta || meta;
    if (metaToCheck.phase === "choosing" && metaToCheck.turn === meta.turn) {
      console.log("\u2705 Transaction conditions met - updating phase to resolving");
      return { ...metaToCheck, phase: "resolving" };
    }
    console.log("\u274C Transaction conditions NOT met:", {
      hasCurrentMeta: !!currentMeta,
      currentPhase: metaToCheck?.phase,
      currentTurn: metaToCheck?.turn,
      expectedTurn: meta.turn
    });
    return void 0;
  });
  if (!committed) {
    console.warn("\u274C Battle resolution aborted: Phase already changed or concurrent resolution.");
    console.warn("Committed:", committed);
    return;
  }
  console.log("\u2705 Transaction committed successfully");
  const lockedMeta = snapshot.val();
  console.log("Phase locked to resolving. Proceeding with calculation...");
  const battleState = await fetchBattleState(battleId);
  if (!battleState) {
    console.error("Failed to reconstruct battle state. One or more paths missing.");
    throw new Error("Failed to reconstruct battle state");
  }
  console.log("Battle state reconstructed successfully.");
  const p1Choice = choices[meta.players.p1.uid];
  const p2Choice = choices[meta.players.p2.uid];
  const p1Action = {
    type: p1Choice.action,
    moveId: p1Choice.payload.moveId,
    switchIndex: p1Choice.payload.switchToIndex,
    target: "opponent"
    // Default target (relative to p1)
  };
  const p2Action = {
    type: p2Choice.action,
    moveId: p2Choice.payload.moveId,
    switchIndex: p2Choice.payload.switchToIndex,
    target: "player"
    // Default target (relative to p2)
  };
  const queue = buildActionQueue(battleState, p1Action, p2Action);
  battleState.actionQueue = queue;
  let currentState = battleState;
  try {
    currentState.battleLog = [];
    await processStartOfTurn(currentState);
    for (const action of queue) {
      console.log("Processing action:", action);
      const userTeam = action.user === "player" ? currentState.player : currentState.opponent;
      const targetTeam = action.user === "player" ? currentState.opponent : currentState.player;
      const userPokemon = getCurrentPokemon(userTeam);
      const targetPokemon = getCurrentPokemon(targetTeam);
      if (action.type === "move" && action.moveId) {
        const move = userPokemon.moves.find((m) => m.id === action.moveId);
        if (move) {
          currentState.battleLog.push({
            type: "move_used",
            message: `${userPokemon.pokemon.name} used ${move.id}!`,
            // Use ID or name
            pokemon: userPokemon.pokemon.name,
            move: move.id
          });
          console.log("Calculating damage for:", move.id);
          const result = await calculateDamageDetailed(userPokemon, targetPokemon, { name: move.id }, currentState);
          console.log("Damage result:", result);
          targetPokemon.currentHp = Math.max(0, targetPokemon.currentHp - result.damage);
          currentState.battleLog.push({
            type: "damage_dealt",
            message: `It dealt ${result.damage} damage!`,
            damage: result.damage,
            effectiveness: result.effectiveness > 1 ? "super_effective" : result.effectiveness < 1 ? "not_very_effective" : "normal"
          });
          if (targetPokemon.currentHp <= 0) {
            currentState.battleLog.push({
              type: "pokemon_fainted",
              message: `${targetPokemon.pokemon.name} fainted!`,
              pokemon: targetPokemon.pokemon.name
            });
            targetTeam.faintedCount = targetTeam.pokemon.filter((p) => p.currentHp <= 0).length;
            console.log(`Pokemon fainted! Updated fainted count to ${targetTeam.faintedCount}`);
          }
        } else {
          console.warn("Move not found for action:", action);
        }
      } else if (action.type === "switch" && action.switchIndex !== void 0) {
        currentState.battleLog.push({
          type: "switch",
          message: `${userPokemon.pokemon.name} switched out!`,
          pokemon: userPokemon.pokemon.name
        });
        userTeam.currentIndex = action.switchIndex;
        const newPokemon = getCurrentPokemon(userTeam);
        currentState.battleLog.push({
          type: "switch",
          message: `Go! ${newPokemon.pokemon.name}!`,
          pokemon: newPokemon.pokemon.name
        });
      }
    }
    console.log("Processing end of turn effects...");
    await processEndOfTurn(currentState);
    const p1Active = getCurrentPokemon(currentState.player);
    const p2Active = getCurrentPokemon(currentState.opponent);
    if (p1Active.currentHp <= 0) {
      const nextIndex = getNextAvailablePokemon(currentState.player);
      if (nextIndex !== null && nextIndex !== currentState.player.currentIndex) {
        currentState.player.currentIndex = nextIndex;
        const newPokemon = getCurrentPokemon(currentState.player);
        currentState.battleLog.push({
          type: "pokemon_sent_out",
          message: `Go! ${newPokemon.pokemon.name}!`,
          pokemon: newPokemon.pokemon.name
        });
        console.log(`Auto-replaced P1's fainted Pokemon with ${newPokemon.pokemon.name} at index ${nextIndex}`);
      }
    }
    if (p2Active.currentHp <= 0) {
      const nextIndex = getNextAvailablePokemon(currentState.opponent);
      if (nextIndex !== null && nextIndex !== currentState.opponent.currentIndex) {
        currentState.opponent.currentIndex = nextIndex;
        const newPokemon = getCurrentPokemon(currentState.opponent);
        currentState.battleLog.push({
          type: "pokemon_sent_out",
          message: `Go! ${newPokemon.pokemon.name}!`,
          pokemon: newPokemon.pokemon.name
        });
        console.log(`Auto-replaced P2's fainted Pokemon with ${newPokemon.pokemon.name} at index ${nextIndex}`);
      }
    }
    if (isTeamDefeated(currentState.player)) {
      currentState.isComplete = true;
      currentState.winner = "opponent";
      currentState.battleLog.push({ type: "battle_end", message: `${meta.players.p2.name} won!` });
    } else if (isTeamDefeated(currentState.opponent)) {
      currentState.isComplete = true;
      currentState.winner = "player";
      currentState.battleLog.push({ type: "battle_end", message: `${meta.players.p1.name} won!` });
    }
    const metaUpdates = {
      turn: meta.turn + 1,
      phase: currentState.isComplete ? "ended" : "choosing",
      ...currentState.isComplete && currentState.winner && {
        winnerUid: currentState.winner === "player" ? meta.players.p1.uid : meta.players.p2.uid
      }
    };
    const p1Updates = {
      team: currentState.player.pokemon,
      currentIndex: currentState.player.currentIndex
    };
    const p2Updates = {
      team: currentState.opponent.pokemon,
      currentIndex: currentState.opponent.currentIndex
    };
    const publicUpdates = {
      battleLog: currentState.battleLog,
      field: {
        screens: {
          p1: currentState.player.sideConditions.screens,
          p2: currentState.opponent.sideConditions.screens
        },
        hazards: {
          p1: currentState.player.sideConditions.hazards,
          p2: currentState.opponent.sideConditions.hazards
        }
      }
    };
    console.log("Public updates:", publicUpdates);
    await Promise.all([
      metaRef.update(metaUpdates),
      db.ref(`battles/${battleId}/private/${meta.players.p1.uid}`).update(p1Updates),
      db.ref(`battles/${battleId}/private/${meta.players.p2.uid}`).update(p2Updates),
      db.ref(`battles/${battleId}/public`).update(publicUpdates),
      // Clear choices for next turn
      db.ref(`battles/${battleId}/turns/${meta.turn}/choices`).remove()
    ]);
    console.log("\u2705 RTDB updates completed successfully.");
  } catch (error) {
    console.error("\u274C Error during turn resolution:", error);
    try {
      await metaRef.update({
        phase: "ended",
        endedReason: `Server Error: ${error.message}`
      });
      console.log("\u26A0\uFE0F Battle terminated due to error.");
    } catch (cleanupError) {
      console.error("\u274C Failed to terminate battle:", cleanupError);
    }
    throw error;
  }
  console.log(`Turn ${meta.turn} resolved. New phase: ${currentState.isComplete ? "ended" : "choosing"}`);
}

// src/index.ts
var app = (0, import_express.default)();
app.use(import_express.default.json());
function ensureAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
}
app.get("/test-firebase", async (_req, res) => {
  try {
    ensureAdmin();
    const status = {
      initialized: admin.apps.length > 0,
      apps: admin.apps.map((appItem) => appItem.name)
    };
    return res.status(200).json({ status: "ok", firebase: status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});
app.post("/battles/:id/submit", async (req, res) => {
  try {
    ensureAdmin();
    const battleId = req.params.id;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split("Bearer ")[1];
    let uid;
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid Token";
      console.error("Token Verification Failed:", message);
      return res.status(401).json({ error: "Invalid Token" });
    }
    const body = req.body ?? {};
    const { action, moveId, target, switchToIndex, clientVersion } = body;
    if (!action || !["move", "switch", "forfeit"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }
    const db = admin.database();
    const metaRef = db.ref(`battles/${battleId}/meta`);
    const metaSnap = await metaRef.once("value");
    const meta = metaSnap.val();
    if (!meta) {
      return res.status(404).json({ error: "Battle not found" });
    }
    if (meta.phase !== "choosing") {
      return res.status(400).json({ error: `Not in choosing phase (current: ${meta.phase})` });
    }
    const choiceRef = db.ref(`battles/${battleId}/turns/${meta.turn}/choices/${uid}`);
    const existingSnap = await choiceRef.once("value");
    if (!existingSnap.exists()) {
      const payload = {};
      if (action === "move") {
        payload.moveId = moveId;
        if (target !== void 0) {
          payload.target = target;
        }
      } else if (action === "switch") {
        payload.switchToIndex = switchToIndex;
      }
      await choiceRef.set({
        action,
        payload,
        committedAt: { ".sv": "timestamp" },
        clientVersion
      });
    }
    const choicesRef = db.ref(`battles/${battleId}/turns/${meta.turn}/choices`);
    const choicesSnap = await choicesRef.once("value");
    const choices = choicesSnap.val() || {};
    const p1Submitted = choices[meta.players.p1.uid];
    const p2Submitted = choices[meta.players.p2.uid];
    if (p1Submitted && p2Submitted) {
      resolveTurn(battleId).catch((error) => {
        console.error("Error resolving turn:", error);
      });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in submit route:", message);
    return res.status(500).json({ error: message });
  }
});
var api = functions.https.onRequest(app);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  api
});
