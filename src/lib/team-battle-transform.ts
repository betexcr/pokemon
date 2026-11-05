// Transform / Imposter: copy the target's species data (types, stats except HP, weight), moves
// (5 PP each), ability and stat stages. Reverted when the user leaves the field.

import type { BattlePokemon } from './team-battle-engine';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/** Why Transform cannot copy `target`, or null when it can. */
export function transformBlocked(user: BattlePokemon, target: BattlePokemon): string | null {
  if (target.currentHp <= 0) return 'no_target';
  if (user.volatile.transform || target.volatile.transform) return 'already_transformed';
  if (target.volatile.substitute) return 'substitute';
  if (target.volatile.illusion) return 'illusion';
  return null;
}

export function transformInto(user: BattlePokemon, target: BattlePokemon): boolean {
  if (transformBlocked(user, target)) return false;
  user.volatile.transform = {
    pokemon: clone(user.pokemon),
    moves: clone(user.moves),
    ability: user.currentAbility,
    into: target.pokemon.name,
  };
  const ownHp = user.pokemon.stats?.find((s: any) => (s.stat?.name || s.name) === 'hp');
  const stats = clone(target.pokemon.stats ?? []).map((s: any) =>
    (s.stat?.name || s.name) === 'hp' && ownHp ? clone(ownHp) : s,
  );
  user.pokemon = {
    ...user.pokemon,
    types: clone(target.pokemon.types),
    stats,
    weight: target.pokemon.weight,
  };
  user.moves = target.moves.map((m) => ({ id: m.id, pp: 5, maxPp: 5 }));
  user.currentAbility = target.currentAbility;
  user.statModifiers = { ...target.statModifiers };
  return true;
}

/** Undo Transform (called on switch-out). Keeps PP spent on the user's real moves. */
export function revertTransform(pokemon: BattlePokemon): void {
  const t = pokemon.volatile?.transform;
  if (!t) return;
  pokemon.pokemon = t.pokemon as BattlePokemon['pokemon'];
  pokemon.moves = t.moves as BattlePokemon['moves'];
  pokemon.currentAbility = t.ability;
  delete pokemon.volatile.transform;
}
