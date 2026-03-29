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
    return (typeName.charAt(0).toUpperCase() + typeName.slice(1)) as TypeName;
  });
  
  const simpleMoves = moves.map(move => ({
    name: move.name,
    type: (move.type.charAt(0).toUpperCase() + move.type.slice(1)) as TypeName,
    power: move.power || 0,
    damageClass: move.damage_class as 'physical' | 'special' | 'status' | undefined
  }));

  const getStat = (name: string) => pokemon.stats.find(s => s.stat.name === name)?.base_stat || 50;

  const abilities = (pokemon.abilities || []).map(a => a.ability.name);

  return {
    id: pokemon.id,
    name: pokemon.name,
    types,
    hp: getStat('hp'),
    moves: simpleMoves,
    sprite: pokemon.sprites.front_default || undefined,
    abilities,
    stats: {
      attack: getStat('attack'),
      defense: getStat('defense'),
      specialAttack: getStat('special-attack'),
      specialDefense: getStat('special-defense'),
      speed: getStat('speed'),
    },
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
        return null;
      }
      
      return convertPokemonToSimple(pokemon, slot.moves);
    })
    .filter(Boolean) as SimplePokemon[];
}
