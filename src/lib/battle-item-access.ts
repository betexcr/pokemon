import type { BattlePokemon } from './team-battle-engine';

/**
 * Held item whose effect currently applies (lowercase id): undefined while Magic Room
 * suppresses items (`volatile.itemSuppressed`, synced from the field each turn).
 * Use the raw `heldItem` only for item *presence* (Knock Off, Trick, Frisk, Acrobatics).
 */
export function effectiveItem(pokemon: BattlePokemon | undefined): string | undefined {
  if (!pokemon || pokemon.volatile?.itemSuppressed) return undefined;
  return pokemon.heldItem?.toLowerCase();
}
