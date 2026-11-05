// Offline battle AI. Scores every usable move with real move data (power, type, category, accuracy,
// variable power, abilities, items, stat stages), skips moves that would fail, values Protect / setup /
// hazards / healing / status by the situation, respects trapping, and switches on bad matchups.
// All randomness comes from the battle RNG so offline battles stay reproducible.

import {
  type BattlePokemon,
  type BattleState,
  type BattleTeam,
  getCurrentPokemon,
} from './team-battle-engine';
import { calculateTypeEffectiveness, type TypeName } from './damage-calculator';
import { getForcedBattleMoveId } from './battle-multiturn';
import { getCachedMove, getMove } from './moveCache';
import type { CompiledMove } from './adapters/pokeapiMoveAdapter';
import { rngNextFloat } from './battle-rng';
import { isTrapped, SOUND_MOVES } from './team-battle-held-items';
import { effectiveItem } from './battle-item-access';
import { abilityOf, targetAbility } from './team-battle-ability-rules';
import { rawStat, stageMultiplier } from './battle-stats';
import {
  DEFENSE_TARGETING_MOVES,
  NON_CALLABLE_MOVES,
  PROTECT_MOVES,
  gen9BasePower,
  gen9MoveVariant,
  gen9TryFailure,
} from './team-battle-gen9-moves';
import { abilityDamageModifiers, abilityMoveTypeChange, ignoresGhostImmunity } from './team-battle-gen9-abilities';
import { applyEntryHazards, isGrounded } from './team-battle-hazards';

type AIAction =
  | { type: 'move'; moveId: string }
  | { type: 'switch'; switchIndex: number };

type Side = 'player' | 'opponent';

const label = (t: string) => (t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()) as TypeName;
const typesOf = (mon: BattlePokemon) =>
  (mon.pokemon.types ?? []).map((t: any) => String(typeof t === 'string' ? t : t?.type?.name ?? '').toLowerCase()).filter(Boolean);
const teamOf = (state: BattleState, side: Side) => (side === 'player' ? state.player : state.opponent);
const foeOf = (side: Side): Side => (side === 'player' ? 'opponent' : 'player');

const STATUS_AILMENTS: Record<string, NonNullable<BattlePokemon['status']>> = {
  paralysis: 'paralyzed', burn: 'burned', poison: 'poisoned', sleep: 'asleep', freeze: 'frozen',
};
const BADLY_POISONING = new Set(['toxic', 'toxic-thread']);
const HEALING_MOVES = new Set([
  'recover', 'soft-boiled', 'milk-drink', 'roost', 'synthesis', 'moonlight', 'morning-sun', 'shore-up', 'slack-off',
  'rest', 'wish', 'strength-sap', 'jungle-healing', 'lunar-blessing', 'life-dew', 'swallow', 'pain-split',
]);
const HAZARD_MOVES = new Set(['stealth-rock', 'spikes', 'toxic-spikes', 'sticky-web']);
const SCREEN_MOVES: Record<string, 'reflect' | 'lightScreen' | 'auroraVeil'> = {
  reflect: 'reflect', 'light-screen': 'lightScreen', 'aurora-veil': 'auroraVeil',
};
const WEATHER_MOVES: Record<string, string> = { 'sunny-day': 'sun', 'rain-dance': 'rain', sandstorm: 'sandstorm', snowscape: 'snow', 'chilly-reception': 'snow' };
const TERRAIN_MOVES: Record<string, string> = {
  'electric-terrain': 'electric', 'grassy-terrain': 'grassy', 'misty-terrain': 'misty', 'psychic-terrain': 'psychic',
};
const FIXED_DAMAGE: Record<string, (a: BattlePokemon, d: BattlePokemon) => number> = {
  'seismic-toss': (a) => a.level,
  'night-shade': (a) => a.level,
  'super-fang': (_a, d) => Math.floor(d.currentHp / 2),
  ruination: (_a, d) => Math.floor(d.currentHp / 2),
  'natures-madness': (_a, d) => Math.floor(d.currentHp / 2),
  'final-gambit': (a) => a.currentHp,
  endeavor: (a, d) => Math.max(0, d.currentHp - a.currentHp),
};
const ABSORB_ABILITIES: Record<string, string[]> = {
  'volt-absorb': ['electric'], 'lightning-rod': ['electric'], 'motor-drive': ['electric'],
  'water-absorb': ['water'], 'storm-drain': ['water'], 'dry-skin': ['water'],
  'flash-fire': ['fire'], 'well-baked-body': ['fire'], 'sap-sipper': ['grass'], 'earth-eater': ['ground'],
};

/** Moves the Pokémon may pick this turn (PP, Disable, Encore, Choice lock, Taunt, Torment, Imprison, Throat Chop, Gravity). */
export function selectableMoves(state: BattleState, mon: BattlePokemon): string[] {
  const v = mon.volatile ?? {};
  let ids = mon.moves.filter((m) => m.pp > 0 && !m.disabled).map((m) => m.id);
  if (v.encore) ids = ids.filter((id) => id === v.encore!.move);
  if (v.choiceLock) ids = ids.filter((id) => id === v.choiceLock);
  return ids.filter((id) => {
    const idLower = id.toLowerCase();
    const move = getCachedMove(id);
    if (v.disable && v.disable.move === id) return false;
    if (v.taunt && move?.category === 'Status') return false;
    if (v.torment && v.lastMoveUsed === id) return false;
    if (v.imprisonedMoves?.includes(id)) return false;
    if (v.throatChop && SOUND_MOVES.has(idLower)) return false;
    if (state.field.rooms?.gravity && ['fly', 'bounce', 'high-jump-kick', 'jump-kick', 'magnet-rise', 'telekinesis', 'sky-drop', 'splash', 'flying-press'].includes(idLower)) return false;
    return true;
  });
}

function effectiveType(state: BattleState, attacker: BattlePokemon, defender: BattlePokemon, move: CompiledMove, moveLower: string) {
  const variant = gen9MoveVariant(state, attacker, defender, move as any, moveLower) as unknown as CompiledMove;
  const ate = abilityMoveTypeChange(attacker, String(variant.type), moveLower, variant.category);
  return { move: variant, type: (ate?.type ?? String(variant.type)).toLowerCase(), ateBoost: ate?.boost ?? 1 };
}

/** Type effectiveness including ability / item immunities. 0 means the move does nothing. */
function effectiveness(attacker: BattlePokemon, defender: BattlePokemon, type: string, moveLower: string): number {
  const defAb = targetAbility(attacker, defender);
  if (defAb && ABSORB_ABILITIES[defAb]?.includes(type)) return 0;
  if (type === 'ground' && !isGrounded(defender) && moveLower !== 'thousand-arrows') return 0;
  if (defAb === 'bulletproof' && ['shadow-ball', 'sludge-bomb', 'focus-blast', 'energy-ball', 'electro-ball', 'aura-sphere', 'pyro-ball', 'weather-ball'].includes(moveLower)) return 0;
  if (defAb === 'soundproof' && SOUND_MOVES.has(moveLower)) return 0;
  let defTypes = typesOf(defender);
  if (ignoresGhostImmunity(attacker, type)) defTypes = defTypes.filter((t) => t !== 'ghost');
  if (type === 'ground' && isGrounded(defender)) defTypes = defTypes.filter((t) => t !== 'flying');
  let eff = calculateTypeEffectiveness(label(type), defTypes.map(label));
  if (moveLower === 'freeze-dry' && defTypes.includes('water')) eff *= 4;
  if (defAb === 'wonder-guard' && eff <= 1) return 0;
  return eff;
}

/** Expected damage as a percentage of the defender's current HP (can exceed 100). */
export function estimateDamagePercent(
  state: BattleState,
  attacker: BattlePokemon,
  defender: BattlePokemon,
  moveId: string,
): number {
  const raw = getCachedMove(moveId);
  if (!raw || raw.category === 'Status' || defender.currentHp <= 0) return 0;
  const moveLower = moveId.toLowerCase();
  if (gen9TryFailure({ state, attacker, defender, moveLower })) return 0;
  const { move, type, ateBoost } = effectiveType(state, attacker, defender, raw, moveLower);
  const eff = effectiveness(attacker, defender, type, moveLower);
  if (eff === 0) return 0;

  const fixed = FIXED_DAMAGE[moveLower];
  if (fixed) return (fixed(attacker, defender) / defender.currentHp) * 100;
  if (['fissure', 'guillotine', 'horn-drill', 'sheer-cold'].includes(moveLower)) {
    return defender.level > attacker.level || abilityOf(defender) === 'sturdy' ? 0 : 100;
  }

  const physical = move.category === 'Physical';
  const power = gen9BasePower({
    state, attacker, defender, moveLower, moveType: type, basePower: typeof move.power === 'number' ? move.power : 0, targetMovedFirst: false,
  });
  if (!power) return 0;
  const atkMon = moveLower === 'foul-play' ? defender : attacker;
  const atkStatName = moveLower === 'body-press' ? 'defense' : physical ? 'attack' : 'special-attack';
  const atkStage = moveLower === 'body-press' ? attacker.statModifiers.defense
    : physical ? atkMon.statModifiers.attack : atkMon.statModifiers.specialAttack;
  const hitsDef = physical || DEFENSE_TARGETING_MOVES.has(moveLower);
  const defStage = hitsDef ? defender.statModifiers.defense : defender.statModifiers.specialDefense;
  const atk = rawStat(atkMon, atkStatName) * stageMultiplier(atkStage);
  const def = rawStat(defender, hitsDef ? 'defense' : 'special-defense') * stageMultiplier(defStage);

  const contact = !!move.makesContact && abilityOf(attacker) !== 'long-reach';
  const mods = abilityDamageModifiers({
    state, attacker, defender, moveLower, moveType: type, isPhysical: physical, contact, hasRecoil: !!move.recoil, movesLast: false,
  });
  let dmg = ((((2 * attacker.level) / 5 + 2) * power * (atk * mods.attack) / (def * mods.defense)) / 50 + 2);
  dmg *= mods.power * ateBoost;
  const userTypes = attacker.terastallized && attacker.originalTypes
    ? [...typesOf(attacker), ...(attacker.originalTypes as any[]).map((t: any) => String(t?.type?.name ?? t).toLowerCase())]
    : typesOf(attacker);
  if (userTypes.includes(type)) dmg *= abilityOf(attacker) === 'adaptability' ? 2 : 1.5;
  dmg *= eff;
  const weather = state.field.weather?.kind;
  if (weather === 'sun' && type === 'fire') dmg *= 1.5;
  if (weather === 'sun' && type === 'water' && moveLower !== 'hydro-steam') dmg *= 0.5;
  if (weather === 'rain' && type === 'water') dmg *= 1.5;
  if (weather === 'rain' && type === 'fire') dmg *= 0.5;
  if (physical && attacker.status === 'burned' && abilityOf(attacker) !== 'guts' && moveLower !== 'facade') dmg *= 0.5;
  const item = effectiveItem(attacker);
  if ((item === 'choice-band' && physical) || (item === 'choice-specs' && !physical)) dmg *= 1.5;
  if (item === 'life-orb') dmg *= 1.3;
  if (item === 'expert-belt' && eff > 1) dmg *= 1.2;
  const screens = teamOf(state, state.player.pokemon.includes(defender) ? 'player' : 'opponent').sideConditions.screens;
  if ((physical && screens.reflect) || (!physical && screens.lightScreen) || screens.auroraVeil) dmg *= 0.5;
  if (move.hits && typeof move.hits === 'object') {
    const { min, max } = move.hits as { min: number; max: number };
    dmg *= abilityOf(attacker) === 'skill-link' ? max : (min + max) / 2 === 3.5 ? 3.1 : (min + max) / 2;
  }
  dmg *= 0.925; // average damage roll
  return (dmg / defender.currentHp) * 100;
}

function accuracyFactor(move: CompiledMove | undefined): number {
  if (!move || move.accuracy == null || move.bypassAccuracyCheck) return 1;
  return Math.min(1, move.accuracy / 100);
}

function statusImmune(target: BattlePokemon, status: NonNullable<BattlePokemon['status']>, moveLower: string, state: BattleState): boolean {
  if (target.status) return true;
  const types = typesOf(target);
  const ab = abilityOf(target);
  if (ab === 'comatose' || ab === 'purifying-salt' || ab === 'good-as-gold' || ab === 'magic-bounce') return true;
  if (status === 'paralyzed' && (types.includes('electric') || ab === 'limber' || (moveLower === 'thunder-wave' && types.includes('ground')))) return true;
  if (status === 'burned' && (types.includes('fire') || ab === 'water-veil' || ab === 'water-bubble')) return true;
  if ((status === 'poisoned' || status === 'badly-poisoned') && (types.includes('poison') || types.includes('steel') || ab === 'immunity')) return true;
  if (status === 'asleep' && (ab === 'insomnia' || ab === 'vital-spirit' || ab === 'sweet-veil' || (state.field.terrain?.kind === 'electric' && isGrounded(target)))) return true;
  if (['spore', 'sleep-powder', 'stun-spore', 'poison-powder'].includes(moveLower) && (types.includes('grass') || ab === 'overcoat')) return true;
  if (state.field.terrain?.kind === 'misty' && isGrounded(target)) return true;
  return false;
}

/** Score for a status move given the situation (0 = pointless). */
function scoreStatusMove(state: BattleState, side: Side, attacker: BattlePokemon, defender: BattlePokemon, moveId: string, move: CompiledMove): number {
  const moveLower = moveId.toLowerCase();
  const ownTeam = teamOf(state, side);
  const foeTeam = teamOf(state, foeOf(side));
  const hpPct = attacker.currentHp / attacker.maxHp;
  const foeAlive = foeTeam.pokemon.filter((p) => p.currentHp > 0).length;

  if (PROTECT_MOVES.has(moveLower)) {
    if ((attacker.volatile.protect?.counter ?? 0) > 0) return 0;
    const foeChipping = !!defender.status && ['poisoned', 'badly-poisoned', 'burned'].includes(defender.status) || defender.volatile.leechSeed || defender.volatile.perishSong;
    const selfGains = abilityOf(attacker) === 'speed-boost' || effectiveItem(attacker) === 'leftovers' || attacker.volatile.wish;
    return foeChipping || selfGains ? 35 : 12;
  }
  if (HEALING_MOVES.has(moveLower)) {
    if (moveLower === 'rest' && attacker.status) return hpPct < 0.6 ? 60 : 20;
    return hpPct < 0.35 ? 75 : hpPct < 0.6 ? 50 : hpPct < 0.8 ? 15 : 0;
  }
  if (HAZARD_MOVES.has(moveLower)) {
    const hz = foeTeam.sideConditions.hazards;
    const set = moveLower === 'stealth-rock' ? hz.stealthRock
      : moveLower === 'spikes' ? (hz.spikes ?? 0) >= 3
        : moveLower === 'toxic-spikes' ? (hz.toxicSpikes ?? 0) >= 2 : hz.stickyWeb;
    if (set || foeAlive <= 1) return 0;
    return 15 + 8 * foeAlive;
  }
  if (SCREEN_MOVES[moveLower]) {
    if (moveLower === 'aurora-veil' && state.field.weather?.kind !== 'snow') return 0;
    return ownTeam.sideConditions.screens[SCREEN_MOVES[moveLower]] ? 0 : 30;
  }
  if (WEATHER_MOVES[moveLower]) return state.field.weather?.kind === WEATHER_MOVES[moveLower] ? 0 : 22;
  if (TERRAIN_MOVES[moveLower]) return state.field.terrain?.kind === TERRAIN_MOVES[moveLower] ? 0 : 22;
  if (moveLower === 'substitute') return attacker.volatile.substitute || hpPct <= 0.3 ? 0 : 25;
  if (moveLower === 'leech-seed') return defender.volatile.leechSeed || typesOf(defender).includes('grass') ? 0 : 35;
  if (moveLower === 'taunt') return defender.volatile.taunt ? 0 : 18;
  if (moveLower === 'destiny-bond') return hpPct < 0.25 ? 45 : 0;
  if (moveLower === 'perish-song') return defender.volatile.perishSong ? 0 : 15;
  if (moveLower === 'haze' || moveLower === 'clear-smog') {
    const foeBoosts = Object.values(defender.statModifiers).reduce((s, v) => s + Math.max(0, v), 0);
    return foeBoosts >= 2 ? 30 + 10 * foeBoosts : 0;
  }
  if (moveLower === 'trick-room') return state.field.rooms?.trickRoom ? 0 : 15;
  if (moveLower === 'defog' || moveLower === 'rapid-spin' || moveLower === 'mortal-spin') {
    const hz = ownTeam.sideConditions.hazards;
    return hz.stealthRock || hz.spikes || hz.toxicSpikes || hz.stickyWeb ? 35 : 0;
  }

  // Status ailments
  const ailment = move.ailment?.kind;
  const status = BADLY_POISONING.has(moveLower) ? 'badly-poisoned' : ailment ? STATUS_AILMENTS[ailment] : undefined;
  if (status) {
    if (statusImmune(defender, status, moveLower, state) || foeTeam.sideConditions.screens.safeguard) return 0;
    const base = status === 'asleep' ? 60 : status === 'badly-poisoned' ? 45 : status === 'burned' && defender.statModifiers.attack >= 0 ? 45 : 40;
    return base * accuracyFactor(move);
  }
  if (ailment === 'confusion') return defender.volatile.confusion ? 0 : 20 * accuracyFactor(move);

  // Stat changes
  const changes = move.statChanges ?? [];
  if (changes.length) {
    const key = { atk: 'attack', def: 'defense', spa: 'specialAttack', spd: 'specialDefense', spe: 'speed', acc: 'accuracy', eva: 'evasion' } as const;
    const selfBoost = changes.every((c) => c.stages > 0) && (move.target === 'user' || !move.target || move.target === 'users-field');
    if (selfBoost) {
      const room = changes.some((c) => attacker.statModifiers[key[c.stat]] < 4);
      if (!room || hpPct < 0.5) return 0;
      // Worth more when the foe cannot hurt us much
      return 30 + 10 * changes.reduce((s, c) => s + c.stages, 0);
    }
    if (changes.every((c) => c.stages < 0)) {
      const blocked = ['clear-body', 'white-smoke', 'full-metal-body'].includes(targetAbility(attacker, defender) ?? '');
      return blocked ? 0 : 18 * accuracyFactor(move);
    }
    return 18;
  }
  return 10;
}

export type ScoredMove = { moveId: string; score: number; damage: number };

/** Score every move the Pokémon can pick against the foe's active. */
export function scoreMoves(state: BattleState, side: Side): ScoredMove[] {
  const attacker = getCurrentPokemon(teamOf(state, side));
  const defender = getCurrentPokemon(teamOf(state, foeOf(side)));
  const ids = selectableMoves(state, attacker);
  const attackerFaster = speedOf(attacker, state, side) >= speedOf(defender, state, foeOf(side));
  const foeThreat = bestDamage(state, defender, attacker);
  return ids.map((moveId) => {
    const move = getCachedMove(moveId);
    const moveLower = moveId.toLowerCase();
    if (!move) return { moveId, score: 1, damage: 0 };
    if ((moveLower === 'fake-out' || moveLower === 'first-impression') && (attacker.volatile.moveActionsSinceEntry ?? 0) > 0) {
      return { moveId, score: -1000, damage: 0 };
    }
    if (gen9TryFailure({ state, attacker, defender, moveLower })) return { moveId, score: -1000, damage: 0 };
    if (NON_CALLABLE_MOVES.has(moveLower) && moveLower === 'sleep-talk' && attacker.status !== 'asleep') return { moveId, score: -1000, damage: 0 };
    if (move.category === 'Status') {
      const reflectable = move.target !== 'user' && move.target !== 'users-field' && move.target !== 'entire-field';
      if (reflectable && targetAbility(attacker, defender) === 'magic-bounce') return { moveId, score: -50, damage: 0 };
      if (reflectable && abilityOf(attacker) === 'prankster' && typesOf(defender).includes('dark')) return { moveId, score: -50, damage: 0 };
      let score = scoreStatusMove(state, side, attacker, defender, moveId, move);
      // Setting up or poisoning is pointless when the foe is about to knock us out
      if (foeThreat >= 100 && !attackerFaster && !PROTECT_MOVES.has(moveLower)) score *= 0.3;
      return { moveId, score, damage: 0 };
    }
    const damage = estimateDamagePercent(state, attacker, defender, moveId);
    if (damage <= 0) return { moveId, score: -100, damage: 0 };
    const acc = accuracyFactor(move);
    let score = Math.min(damage, 100) * acc;
    const priority = typeof move.priority === 'number' ? move.priority : 0;
    if (damage >= 100) {
      // A KO: prefer the surest one, and priority when the foe would move first
      score += 60 * acc;
      if (priority > 0 && !attackerFaster) score += 40;
    }
    if (move.recoil && attacker.currentHp / attacker.maxHp < 0.3) score *= 0.8;
    if (move.drain && attacker.currentHp < attacker.maxHp) score *= 1.1;
    return { moveId, score, damage };
  });
}

function speedOf(mon: BattlePokemon, state: BattleState, side: Side): number {
  // Avoid importing getEffectiveSpeed's tailwind plumbing: raw Speed x stages is enough for ordering guesses
  const tailwind = teamOf(state, side).sideConditions.screens.tailwind ? 2 : 1;
  const para = mon.status === 'paralyzed' && abilityOf(mon) !== 'quick-feet' ? 0.5 : 1;
  const scarf = effectiveItem(mon) === 'choice-scarf' ? 1.5 : 1;
  const sp = rawStat(mon, 'speed') * stageMultiplier(mon.statModifiers.speed) * tailwind * para * scarf;
  return state.field.rooms?.trickRoom ? -sp : sp;
}

/** Best damage % the attacker can do to the defender with its current moves. */
function bestDamage(state: BattleState, attacker: BattlePokemon, defender: BattlePokemon): number {
  let best = 0;
  for (const m of attacker.moves) {
    if (m.pp <= 0) continue;
    best = Math.max(best, estimateDamagePercent(state, attacker, defender, m.id) * accuracyFactor(getCachedMove(m.id)));
  }
  return best;
}

/**
 * Matchup value of `mon` against the foe's active, in turns: how many more hits the foe needs to KO it
 * than it needs to KO the foe (positive = winning). A Pokémon switching in first takes a free hit and
 * entry hazards.
 */
function matchupValue(state: BattleState, side: Side, mon: BattlePokemon, entering: boolean): number {
  const foe = getCurrentPokemon(teamOf(state, foeOf(side)));
  if (foe.currentHp <= 0) return 0;
  const dealt = Math.max(1, bestDamage(state, mon, foe));
  const taken = Math.max(1, bestDamage(state, foe, mon));
  let hpLeft = 100;
  if (entering) {
    const hazards = applyEntryHazards(mon, teamOf(state, side).sideConditions.hazards);
    hpLeft -= (hazards.damage / Math.max(1, mon.currentHp)) * 100 + taken;
  }
  if (hpLeft <= 0) return -20;
  const hitsToKoFoe = Math.min(20, Math.ceil(100 / dealt));
  const hitsToKoUs = Math.min(20, Math.ceil(hpLeft / taken));
  const faster = speedOf(mon, state, side) >= speedOf(foe, state, foeOf(side));
  return hitsToKoUs - hitsToKoFoe + (faster ? 0.5 : 0);
}

/** The bench Pokémon with the best matchup (faint replacements, pivots, Eject Button). */
export function chooseAIReplacement(state: BattleState, side: Side, candidates: number[]): number {
  const team = teamOf(state, side);
  let best = candidates[0];
  let bestValue = -Infinity;
  for (const i of candidates) {
    const value = matchupValue(state, side, team.pokemon[i], true);
    if (value > bestValue) {
      bestValue = value;
      best = i;
    }
  }
  return best;
}

/** Load move data for both teams so the sync scorers can use the move cache. */
async function warmMoveCache(state: BattleState): Promise<void> {
  const ids = new Set<string>();
  for (const team of [state.player, state.opponent]) {
    for (const mon of team.pokemon) for (const m of mon.moves) ids.add(m.id);
  }
  await Promise.all([...ids].map((id) => getMove(id).catch(() => null)));
}

/** Pick the AI side's action for this turn. */
export async function chooseAIAction(state: BattleState, side: Side = 'opponent'): Promise<AIAction> {
  const aiTeam: BattleTeam = teamOf(state, side);
  const aiActive = getCurrentPokemon(aiTeam);
  const foeActive = getCurrentPokemon(teamOf(state, foeOf(side)));

  if (aiActive.currentHp <= 0) {
    const candidates = aiTeam.pokemon.map((p, i) => ({ p, i })).filter(({ p, i }) => i !== aiTeam.currentIndex && p.currentHp > 0).map(({ i }) => i);
    if (candidates.length) return { type: 'switch', switchIndex: chooseAIReplacement(state, side, candidates) };
    return { type: 'move', moveId: aiActive.moves[0]?.id || 'struggle' };
  }

  const forced = getForcedBattleMoveId(aiActive);
  if (forced) return { type: 'move', moveId: forced };

  await warmMoveCache(state);
  const scored = scoreMoves(state, side).sort((a, b) => b.score - a.score);
  if (scored.length === 0) return { type: 'move', moveId: 'struggle' };
  const best = scored[0];

  // Switching: never while trapped; only when the matchup is clearly bad and we can't KO
  const canSwitch = !isTrapped(aiActive, foeActive);
  const boosted = Object.values(aiActive.statModifiers).reduce((s, v) => s + Math.max(0, v), 0) >= 2;
  if (canSwitch && best.damage < 100 && !boosted) {
    const candidates = aiTeam.pokemon.map((p, i) => ({ p, i })).filter(({ p, i }) => i !== aiTeam.currentIndex && p.currentHp > 0).map(({ i }) => i);
    if (candidates.length) {
      const current = matchupValue(state, side, aiActive, false);
      const pick = chooseAIReplacement(state, side, candidates);
      // The newcomer's value already includes the free hit it takes on the way in
      const incoming = matchupValue(state, side, aiTeam.pokemon[pick], true);
      if (current <= -2 && incoming >= current + 3) return { type: 'switch', switchIndex: pick };
    }
  }

  // Mostly the best move; sometimes a close second for variety (battle RNG keeps it reproducible)
  const second = scored[1];
  if (second && second.score > 0 && second.score >= best.score * 0.85 && rngNextFloat(state.rng) < 0.25) {
    return { type: 'move', moveId: second.moveId };
  }
  if (best.score <= -100) {
    // Nothing useful: any move that at least does something
    const fallback = scored.find((m) => m.score > -100);
    return { type: 'move', moveId: (fallback ?? best).moveId };
  }
  return { type: 'move', moveId: best.moveId };
}
