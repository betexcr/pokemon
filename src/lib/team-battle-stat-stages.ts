// Single entry point for stat stage changes, so ability and item reactions apply everywhere:
// Contrary / Simple, Clear Body-style blockers, Defiant / Competitive, White Herb.

import type { BattlePokemon, BattleState } from './team-battle-engine';
import { effectiveItem } from './battle-item-access';
import { abilityOf, targetAbility } from './team-battle-ability-rules';

export type StatKey = keyof BattlePokemon['statModifiers'];

export const STAT_DISPLAY: Record<StatKey, string> = {
  attack: 'Attack',
  defense: 'Defense',
  specialAttack: 'Sp. Atk',
  specialDefense: 'Sp. Def',
  speed: 'Speed',
  accuracy: 'accuracy',
  evasion: 'evasiveness',
};

export const STAT_ABBR_TO_KEY: Record<string, StatKey> = {
  atk: 'attack',
  def: 'defense',
  spa: 'specialAttack',
  spd: 'specialDefense',
  spe: 'speed',
  acc: 'accuracy',
  eva: 'evasion',
};

/** Abilities that block every stat drop caused by another Pokémon. */
const ALL_DROP_BLOCKERS: Record<string, string> = {
  'clear-body': 'Clear Body',
  'white-smoke': 'White Smoke',
  'full-metal-body': 'Full Metal Body',
};

/** Abilities that block drops of one stat caused by another Pokémon. */
const SINGLE_DROP_BLOCKERS: Record<string, { stat: StatKey; label: string }> = {
  'hyper-cutter': { stat: 'attack', label: 'Hyper Cutter' },
  'big-pecks': { stat: 'defense', label: 'Big Pecks' },
  'keen-eye': { stat: 'accuracy', label: 'Keen Eye' },
  'mind-eye': { stat: 'accuracy', label: "Mind's Eye" },
};

function describeChange(delta: number): string {
  const size = Math.abs(delta);
  if (delta > 0) return size >= 3 ? 'rose drastically' : size === 2 ? 'rose sharply' : 'rose';
  return size >= 3 ? 'severely fell' : size === 2 ? 'harshly fell' : 'fell';
}

export type StatChangeOptions = {
  /** Pokémon causing the change. Another Pokémon's drops trigger blockers and Defiant / Competitive. */
  source?: BattlePokemon;
  /** Suffix for the log line, e.g. "due to Intimidate". */
  reason?: string;
  /** Suppress the "won't go any higher/lower" and blocker lines (secondary effects that silently fail). */
  quietFailure?: boolean;
};

/**
 * Apply `stages` to `target`'s `stat`. Returns the stage delta actually applied
 * (after Contrary / Simple, blockers and the ±6 clamp).
 */
export function changeStatStage(
  state: Pick<BattleState, 'battleLog'>,
  target: BattlePokemon,
  stat: StatKey,
  stages: number,
  options: StatChangeOptions = {},
): number {
  if (!stages || target.currentHp <= 0) return 0;
  const { source, reason, quietFailure } = options;
  const fromFoe = !!source && source !== target;
  // Contrary / Simple are breakable: a Mold Breaker attacker's drops are applied as-is.
  const ability = fromFoe ? targetAbility(source, target) : abilityOf(target);
  const name = target.pokemon.name;

  let amount = stages;
  if (ability === 'contrary') amount = -amount;
  if (ability === 'simple') amount *= 2;

  if (amount < 0 && fromFoe && ability) {
    const all = ALL_DROP_BLOCKERS[ability];
    const single = SINGLE_DROP_BLOCKERS[ability];
    if (all || (single && single.stat === stat)) {
      if (!quietFailure) {
        state.battleLog.push({
          type: 'status_effect',
          message: `${name}'s ${all ?? single!.label} prevents its ${STAT_DISPLAY[stat]} from being lowered!`,
          pokemon: name,
        });
      }
      return 0;
    }
  }

  const before = target.statModifiers[stat] ?? 0;
  const after = Math.max(-6, Math.min(6, before + amount));
  const delta = after - before;
  if (delta === 0) {
    if (!quietFailure) {
      state.battleLog.push({
        type: 'status_effect',
        message: `${name}'s ${STAT_DISPLAY[stat]} won't go any ${amount > 0 ? 'higher' : 'lower'}!`,
        pokemon: name,
      });
    }
    return 0;
  }
  target.statModifiers[stat] = after;
  state.battleLog.push({
    type: 'status_effect',
    message: `${name}'s ${STAT_DISPLAY[stat]} ${describeChange(delta)}${reason ? ` ${reason}` : ''}!`,
    pokemon: name,
  });

  if (delta < 0 && fromFoe) {
    const own = abilityOf(target);
    if (own === 'defiant') changeStatStage(state, target, 'attack', 2, { reason: 'thanks to Defiant' });
    if (own === 'competitive') changeStatStage(state, target, 'specialAttack', 2, { reason: 'thanks to Competitive' });
  }
  return delta;
}

function consumeHeldItem(pokemon: BattlePokemon): void {
  pokemon.heldItem = undefined;
  if (abilityOf(pokemon) === 'unburden') pokemon.volatile.unburdenActive = true;
}

/** White Herb: once lowered stats settle (after a move or entry effects), restore them and consume the herb. */
export function checkWhiteHerb(state: BattleState, pokemon: BattlePokemon): boolean {
  if (pokemon.currentHp <= 0 || effectiveItem(pokemon) !== 'white-herb') return false;
  const lowered = (Object.keys(pokemon.statModifiers) as StatKey[]).filter((k) => pokemon.statModifiers[k] < 0);
  if (lowered.length === 0) return false;
  for (const k of lowered) pokemon.statModifiers[k] = 0;
  consumeHeldItem(pokemon);
  state.battleLog.push({
    type: 'status_effect',
    message: `${pokemon.pokemon.name} returned its stats to normal using its White Herb!`,
    pokemon: pokemon.pokemon.name,
  });
  return true;
}

/** Weakness Policy: a super-effective hit that reached HP sharply raises Attack and Sp. Atk. */
export function triggerWeaknessPolicy(state: BattleState, pokemon: BattlePokemon): boolean {
  if (pokemon.currentHp <= 0 || effectiveItem(pokemon) !== 'weakness-policy') return false;
  consumeHeldItem(pokemon);
  state.battleLog.push({
    type: 'status_effect',
    message: `${pokemon.pokemon.name} used its Weakness Policy!`,
    pokemon: pokemon.pokemon.name,
  });
  changeStatStage(state, pokemon, 'attack', 2);
  changeStatStage(state, pokemon, 'specialAttack', 2);
  return true;
}
