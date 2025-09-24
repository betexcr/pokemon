import type { Pokemon } from '@/types/pokemon';
import type { SimplePokemon } from '@/lib/battle/sampleData';
import type { TeamSlot, MoveData } from '@/lib/userTeams';
import type { TypeName } from '@/lib/type/data';

/**
 * Converts a Pokemon from the API format to SimplePokemon format for team analysis
 */
export function convertPokemonToSimple(pokemon: Pokemon, moves: MoveData[] = []): SimplePokemon {
  const types: TypeName[] = pokemon.types.map(t => {
    const typeName = t.type.name;
    // Capitalize first letter to match TypeName format
    return (typeName.charAt(0).toUpperCase() + typeName.slice(1)) as TypeName;
  });
  
  // Convert moves to the SimplePokemon format
  const simpleMoves = moves.map(move => ({
    name: move.name,
    type: (move.type.charAt(0).toUpperCase() + move.type.slice(1)) as TypeName,
    power: move.power || 0
  }));

  const hp = pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 100;

  return {
    id: pokemon.id,
    name: pokemon.name,
    types,
    hp,
    moves: simpleMoves,
    sprite: pokemon.sprites.front_default || undefined
  };
}

/**
 * Converts team slots to SimplePokemon array for analysis
 */
export function convertTeamSlotsToSimple(
  teamSlots: TeamSlot[], 
  allPokemon: Pokemon[], 
  displayPokemonById: Record<number, Pokemon>
): SimplePokemon[] {
  return teamSlots
    .filter(slot => slot.id !== null)
    .map(slot => {
      // Prioritize displayPokemonById which has full data, fallback to allPokemon
      const pokemon = displayPokemonById[slot.id!] || allPokemon.find(p => p.id === slot.id);
      if (!pokemon) {
        console.log(`Pokemon not found for slot ${slot.id}`, { allPokemon: allPokemon.length, displayPokemonById: Object.keys(displayPokemonById) });
        return null;
      }
      
      console.log(`Converting slot ${slot.id} with Pokemon:`, pokemon.name, 'types:', pokemon.types);
      return convertPokemonToSimple(pokemon, slot.moves);
    })
    .filter(Boolean) as SimplePokemon[];
}
