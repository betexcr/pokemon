// Utility functions for Pokemon generations

interface GenerationRange {
  min: number
  max: number
  roman: string
  label: string
  color: string
}

export const GENERATIONS: GenerationRange[] = [
  { min: 1, max: 151, roman: 'I', label: 'Gen I', color: 'from-red-500 to-red-600' },
  { min: 152, max: 251, roman: 'II', label: 'Gen II', color: 'from-yellow-500 to-yellow-600' },
  { min: 252, max: 386, roman: 'III', label: 'Gen III', color: 'from-green-500 to-green-600' },
  { min: 387, max: 493, roman: 'IV', label: 'Gen IV', color: 'from-blue-500 to-blue-600' },
  { min: 494, max: 649, roman: 'V', label: 'Gen V', color: 'from-indigo-500 to-indigo-600' },
  { min: 650, max: 721, roman: 'VI', label: 'Gen VI', color: 'from-purple-500 to-purple-600' },
  { min: 722, max: 809, roman: 'VII', label: 'Gen VII', color: 'from-pink-500 to-pink-600' },
  { min: 810, max: 905, roman: 'VIII', label: 'Gen VIII', color: 'from-cyan-500 to-cyan-600' },
  { min: 906, max: 1025, roman: 'IX', label: 'Gen IX', color: 'from-orange-500 to-orange-600' },
]

/**
 * Get the generation information for a Pokemon by its ID
 */
export function getPokemonGeneration(pokemonId: number): GenerationRange | null {
  // Handle special forms (IDs >= 10001) by using the base ID
  const baseId = pokemonId >= 10001 ? (pokemonId % 10000) : pokemonId
  
  const generation = GENERATIONS.find(gen => baseId >= gen.min && baseId <= gen.max)
  return generation || null
}

/**
 * Get the generation number (1-9) for a Pokemon
 */
export function getGenerationNumber(pokemonId: number): number {
  const gen = getPokemonGeneration(pokemonId)
  if (!gen) return 0
  
  return GENERATIONS.indexOf(gen) + 1
}

/**
 * Get the generation roman numeral for a Pokemon
 */
export function getGenerationRoman(pokemonId: number): string {
  const gen = getPokemonGeneration(pokemonId)
  return gen?.roman || '?'
}

/**
 * Get the generation label for a Pokemon
 */
export function getGenerationLabel(pokemonId: number): string {
  const gen = getPokemonGeneration(pokemonId)
  return gen?.label || 'Unknown'
}

/**
 * Get the generation color classes for a Pokemon
 */
export function getGenerationColor(pokemonId: number): string {
  const gen = getPokemonGeneration(pokemonId)
  return gen?.color || 'from-gray-500 to-gray-600'
}
