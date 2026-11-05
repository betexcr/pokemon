// Protosynthesis / Quark Drive (+ Booster Energy): boost the holder's highest stat
// by 30% (Speed by 50%) while sun / Electric Terrain is up, or until switch-out when Booster Energy is used.

import type { BattlePokemon, BattleState } from './team-battle-engine';
import { effectiveItem } from './battle-item-access';
import { abilityOf } from './team-battle-ability-rules';
import { rawStat, type RawStatName } from './battle-stats';

export type ParadoxStat = 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed';

const STAT_ORDER: Array<{ key: ParadoxStat; api: string; label: string }> = [
  { key: 'attack', api: 'attack', label: 'Attack' },
  { key: 'defense', api: 'defense', label: 'Defense' },
  { key: 'specialAttack', api: 'special-attack', label: 'Sp. Atk' },
  { key: 'specialDefense', api: 'special-defense', label: 'Sp. Def' },
  { key: 'speed', api: 'speed', label: 'Speed' },
];

const PARADOX = {
  protosynthesis: { label: 'Protosynthesis', field: 'harsh sunlight' },
  'quark-drive': { label: 'Quark Drive', field: 'Electric Terrain' },
} as const;

type ParadoxAbility = keyof typeof PARADOX;

function stageMultiplier(stage: number): number {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}

/** Highest stat including stat stages (ties resolve in Atk, Def, SpA, SpD, Spe order). */
export function bestParadoxStat(pokemon: BattlePokemon): ParadoxStat {
  let best: ParadoxStat = 'attack';
  let bestValue = -1;
  for (const { key, api } of STAT_ORDER) {
    const raw = rawStat(pokemon, api as RawStatName);
    const value = raw * stageMultiplier(pokemon.statModifiers[key] ?? 0);
    if (value > bestValue) {
      best = key;
      bestValue = value;
    }
  }
  return best;
}

/** Damage / speed multiplier for `stat` from an active paradox boost. */
export function paradoxMultiplier(pokemon: BattlePokemon | undefined, stat: ParadoxStat): number {
  const boost = pokemon?.volatile?.paradoxBoost;
  if (!boost || boost.stat !== stat) return 1;
  return stat === 'speed' ? 1.5 : 1.3;
}

function fieldActive(state: BattleState, ability: ParadoxAbility): boolean {
  return ability === 'protosynthesis'
    ? state.field.weather?.kind === 'sun'
    : state.field.terrain?.kind === 'electric';
}

function activate(state: BattleState, pokemon: BattlePokemon, source: 'field' | 'booster', ability: ParadoxAbility) {
  const stat = bestParadoxStat(pokemon);
  pokemon.volatile.paradoxBoost = { stat, source };
  const label = STAT_ORDER.find((s) => s.key === stat)!.label;
  const { label: abilityLabel, field } = PARADOX[ability];
  state.battleLog.push({
    type: 'status_effect',
    message:
      source === 'booster'
        ? `${pokemon.pokemon.name} used its Booster Energy to activate ${abilityLabel}!`
        : `The ${field} activated ${pokemon.pokemon.name}'s ${abilityLabel}!`,
    pokemon: pokemon.pokemon.name,
  });
  state.battleLog.push({
    type: 'status_effect',
    message: `${pokemon.pokemon.name}'s ${label} was heightened!`,
    pokemon: pokemon.pokemon.name,
  });
}

/** Re-evaluate one Pokémon's paradox boost after the field or its item may have changed. */
export function updateParadoxBoost(state: BattleState, pokemon: BattlePokemon): void {
  const ability = abilityOf(pokemon) as ParadoxAbility | undefined;
  if (!ability || !(ability in PARADOX)) {
    if (pokemon.volatile?.paradoxBoost) delete pokemon.volatile.paradoxBoost;
    return;
  }
  if (pokemon.currentHp <= 0) return;
  const current = pokemon.volatile.paradoxBoost;
  if (current?.source === 'booster') return; // lasts until the Pokémon leaves the field

  if (fieldActive(state, ability)) {
    if (!current) activate(state, pokemon, 'field', ability);
    return;
  }

  if (current?.source === 'field') {
    delete pokemon.volatile.paradoxBoost;
    state.battleLog.push({
      type: 'status_effect',
      message: `The effects of ${pokemon.pokemon.name}'s ${PARADOX[ability].label} wore off!`,
      pokemon: pokemon.pokemon.name,
    });
  }

  if (effectiveItem(pokemon) === 'booster-energy') {
    pokemon.heldItem = undefined;
    if (abilityOf(pokemon) === 'unburden') pokemon.volatile.unburdenActive = true;
    activate(state, pokemon, 'booster', ability);
  }
}

/** Both active Pokémon. */
export function updateParadoxBoosts(state: BattleState): void {
  for (const team of [state.player, state.opponent]) {
    const active = team.pokemon[team.currentIndex];
    if (active) updateParadoxBoost(state, active);
  }
}
