// Illusion (Zoroark line): the user enters disguised as the last healthy party member other than itself.
// While the disguise holds, battle-log lines and the public view show the disguise's name; a damaging
// hit that reaches HP breaks it.

import type { BattlePokemon, BattleState } from './team-battle-engine';
import { abilityOf } from './team-battle-ability-rules';

/** Log index up to which illusion names are already applied, per battle-log array (each turn gets a new array). */
const maskedUpTo = new WeakMap<object, number>();

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function activeIllusions(state: BattleState): BattlePokemon[] {
  return [state.player, state.opponent]
    .map((t) => t.pokemon[t.currentIndex])
    .filter((m): m is BattlePokemon => !!m?.volatile?.illusion);
}

/** Rewrite log lines written since the last call so active illusions show their disguise. */
export function maskIllusions(state: BattleState): void {
  const log = state.battleLog;
  const from = maskedUpTo.get(log) ?? 0;
  for (const mon of activeIllusions(state)) {
    const real = mon.pokemon.name;
    const fake = mon.volatile.illusion!.species;
    const re = new RegExp(`\\b${escape(real)}\\b`, 'g');
    for (let i = from; i < log.length; i++) {
      const entry = log[i];
      entry.message = entry.message.replace(re, fake);
      if (entry.pokemon === real) entry.pokemon = fake;
    }
  }
  maskedUpTo.set(log, log.length);
}

/** On entry: disguise as the last healthy party member that is not this Pokémon. */
export function startIllusion(state: BattleState, side: 'player' | 'opponent', mon: BattlePokemon): void {
  if (abilityOf(mon) !== 'illusion' || mon.currentHp <= 0) return;
  const team = side === 'player' ? state.player : state.opponent;
  const disguise = [...team.pokemon].reverse().find((p) => p !== mon && p.currentHp > 0);
  if (!disguise) return;
  mon.volatile.illusion = {
    species: disguise.pokemon.name,
    dexId: typeof disguise.pokemon.id === 'number' ? disguise.pokemon.id : null,
    types: (disguise.pokemon.types ?? []).map((t: any) => String(typeof t === 'string' ? t : t?.type?.name ?? 'normal')),
  };
  // The "Go! X!" line that announced this Pokémon was written just before its entry sequence
  const log = state.battleLog;
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].type === 'pokemon_sent_out' && log[i].pokemon === mon.pokemon.name) {
      maskedUpTo.set(log, Math.min(maskedUpTo.get(log) ?? 0, i));
      break;
    }
  }
}

/** A damaging hit reached HP: drop the disguise (lines so far keep it, later ones use the real name). */
export function breakIllusion(state: BattleState, mon: BattlePokemon): void {
  if (!mon.volatile.illusion) return;
  maskIllusions(state);
  delete mon.volatile.illusion;
  state.battleLog.push({ type: 'status_effect', message: `${mon.pokemon.name}'s illusion wore off!`, pokemon: mon.pokemon.name });
  maskedUpTo.set(state.battleLog, state.battleLog.length);
}

/** Name the foe sees for this Pokémon. */
export function displaySpecies(mon: BattlePokemon): string {
  return mon.volatile?.illusion?.species ?? mon.pokemon.name;
}

/** Types the foe sees for this Pokémon (the disguise's while Illusion holds). */
export function displayTypes(mon: BattlePokemon): string[] {
  if (mon.volatile?.illusion?.types?.length) return mon.volatile.illusion.types;
  return (mon.pokemon.types || []).map((t: any) => (typeof t === 'string' ? t : t.type?.name || t.name || 'normal'));
}

/**
 * Public bench (non-active) entries. While the active Pokémon is disguised, the bench slot of the
 * Pokémon it imitates shows the real user instead, so the foe sees each species once.
 */
export function publicBenchEntries(team: BattleState['player']): Array<{ species: string; fainted: boolean; revealedMoves: string[] }> {
  const active = team.pokemon[team.currentIndex];
  const disguise = active?.volatile?.illusion?.species;
  const entry = (mon: BattlePokemon) => ({
    species: mon.pokemon.name,
    fainted: mon.currentHp <= 0,
    revealedMoves: mon.moves.map((m) => m.id).slice(0, 4),
  });
  let swapped = false;
  return team.pokemon
    .filter((_, i) => i !== team.currentIndex)
    .map((mon) => {
      if (disguise && !swapped && active && mon.pokemon.name === disguise) {
        swapped = true;
        return entry(active);
      }
      return entry(mon);
    });
}
