/**
 * PokemonDB Sprite URL Generator
 * 
 * This utility generates URLs for Pokemon sprites from PokemonDB.net
 * which provides high-quality sprites from all generations including the latest Gen 9.
 * 
 * URL Structure: https://img.pokemondb.net/sprites/{generation}/{pokemon-name}.png
 */

export type PokemonDBGeneration = 
  | 'red-blue' | 'yellow' | 'gold' | 'silver' | 'crystal'
  | 'ruby-sapphire' | 'emerald' | 'firered-leafgreen'
  | 'diamond-pearl' | 'platinum' | 'heartgold-soulsilver'
  | 'black-white' | 'black-2-white-2' | 'x-y' | 'omega-ruby-alpha-sapphire'
  | 'sun-moon' | 'ultra-sun-ultra-moon' | 'lets-go-pikachu-eevee'
  | 'sword-shield' | 'brilliant-diamond-shining-pearl' | 'legends-arceus'
  | 'scarlet-violet' | 'home' | 'go';

export interface PokemonDBSpriteOptions {
  generation: PokemonDBGeneration;
  pokemonName: string;
  isShiny?: boolean;
  isBack?: boolean;
}

/**
 * Maps our internal generation names to PokemonDB generation folder names
 */
const generationMap: Record<string, PokemonDBGeneration> = {
  'gen1': 'red-blue',
  'gen1rb': 'red-blue',
  'gen1rg': 'red-blue',
  'gen1frlg': 'firered-leafgreen',
  'gen2': 'gold',
  'gen2g': 'gold',
  'gen2s': 'silver',
  'gen3': 'ruby-sapphire',
  'gen3rs': 'ruby-sapphire',
  'gen3frlg': 'firered-leafgreen',
  'gen4': 'diamond-pearl',
  'gen4dp': 'diamond-pearl',
  'gen5': 'black-white',
  'gen5ani': 'black-white',
  'gen6': 'go', // Gen 6 uses GO sprites for newer Pokemon
  'gen6ani': 'x-y', // Gen 6 animated still uses X/Y
  'gen7': 'sun-moon',
  'gen8': 'home', // Gen 8 uses HOME sprites for newer Pokemon
  'gen9': 'scarlet-violet',
  'home': 'home',
  'go': 'go'
};

/**
 * Maps Pokemon names to their PokemonDB sprite names
 * Handles special cases like gender differences, forms, and naming conventions
 */
function mapPokemonNameToSpriteName(pokemonName: string): string {
  const name = pokemonName.toLowerCase().trim();
  
  // Special mappings for PokemonDB sprite naming conventions
  const specialMappings: Record<string, string> = {
    'nidoran-f': 'nidoran-f',
    'nidoran-m': 'nidoran-m',
    'farfetchd': 'farfetchd',
    'mr-mime': 'mr-mime',
    'mr-rime': 'mr-rime',
    'mime-jr': 'mime-jr',
    'ho-oh': 'ho-oh',
    'porygon-z': 'porygon-z',
    'type-null': 'type-null',
    'tapu-koko': 'tapu-koko',
    'tapu-lele': 'tapu-lele',
    'tapu-bulu': 'tapu-bulu',
    'tapu-fini': 'tapu-fini',
    'jangmo-o': 'jangmo-o',
    'hakamo-o': 'hakamo-o',
    'kommo-o': 'kommo-o',
    'sirfetchd': 'sirfetchd',
    'zacian': 'zacian',
    'zamazenta': 'zamazenta',
    'eternatus': 'eternatus',
    'kubfu': 'kubfu',
    'urshifu': 'urshifu',
    'zarude': 'zarude',
    'regieleki': 'regieleki',
    'regidrago': 'regidrago',
    'glastrier': 'glastrier',
    'spectrier': 'spectrier',
    'calyrex': 'calyrex',
    'wyrdeer': 'wyrdeer',
    'kleavor': 'kleavor',
    'ursaluna': 'ursaluna',
    'basculegion': 'basculegion',
    'sneasler': 'sneasler',
    'overqwil': 'overqwil',
    'enamorus': 'enamorus'
  };

  return specialMappings[name] || name;
}

/**
 * Generates a PokemonDB sprite URL
 */
export function getPokemonDBSpriteURL(options: PokemonDBSpriteOptions): string {
  const { generation, pokemonName, isShiny = false, isBack = false } = options;
  
  const spriteName = mapPokemonNameToSpriteName(pokemonName);
  const baseUrl = 'https://img.pokemondb.net/sprites';
  
  // PokemonDB structure: /sprites/{generation}/{shiny/normal}/{pokemon-name}.png
  const variantPath = isShiny ? 'shiny' : 'normal';
  
  // Note: PokemonDB doesn't seem to have back sprites in newer generations
  // For now, we'll only use front sprites
  const url = `${baseUrl}/${generation}/${variantPath}/${spriteName}.png`;
  
  return url;
}

/**
 * Gets the best available PokemonDB sprite URL based on generation and preferences
 * Returns the primary URL - fallback handling is done by the image component
 */
export function getBestPokemonDBSprite(
  pokemonName: string,
  internalGeneration: string,
  isShiny: boolean = false,
  isBack: boolean = false
): string {
  const pokemonDbGeneration = generationMap[internalGeneration] || 'scarlet-violet';
  
  return getPokemonDBSpriteURL({
    generation: pokemonDbGeneration,
    pokemonName,
    isShiny,
    isBack
  });
}

/**
 * Gets fallback URLs for PokemonDB sprites (for when primary URL fails)
 */
export function getPokemonDBSpriteFallbacks(
  pokemonName: string,
  internalGeneration: string,
  isShiny: boolean = false,
  isBack: boolean = false
): string[] {
  const pokemonDbGeneration = generationMap[internalGeneration] || 'scarlet-violet';
  const fallbacks: string[] = [];
  
  // If shiny was requested, add normal as fallback
  if (isShiny) {
    fallbacks.push(getPokemonDBSpriteURL({
      generation: pokemonDbGeneration,
      pokemonName,
      isShiny: false,
      isBack
    }));
  }
  
  // Add other generation fallbacks
  const altGenerations: PokemonDBGeneration[] = ['home', 'sword-shield', 'sun-moon', 'x-y', 'black-white'];
  for (const altGen of altGenerations) {
    if (altGen !== pokemonDbGeneration) {
      fallbacks.push(getPokemonDBSpriteURL({
        generation: altGen,
        pokemonName,
        isShiny: false,
        isBack
      }));
    }
  }
  
  return fallbacks;
}

/**
 * Get fallback URLs for when primary sprite fails to load
 */
export function getPokemonDBFallbackURLs(pokemonName: string): string[] {
  const spriteName = mapPokemonNameToSpriteName(pokemonName);
  const baseUrl = 'https://img.pokemondb.net/sprites';
  
  // Try different generations as fallbacks
  const fallbackGenerations: PokemonDBGeneration[] = [
    'scarlet-violet', // Latest generation
    'sword-shield',   // Gen 8
    'sun-moon',       // Gen 7
    'x-y',           // Gen 6
    'black-white',   // Gen 5
    'diamond-pearl', // Gen 4
    'ruby-sapphire', // Gen 3
    'gold',          // Gen 2
    'red-blue'       // Gen 1
  ];
  
  return fallbackGenerations.map(gen => 
    `${baseUrl}/${gen}/${spriteName}.png`
  );
}

/**
 * Check if a PokemonDB sprite exists by attempting to load it
 */
export async function checkPokemonDBSpriteExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get Pokemon availability for different generations
 * This is a simplified version - in a real app you might want to cache this data
 */
export function getPokemonGenerationAvailability(pokemonName: string): Record<string, boolean> {
  // This is a simplified mapping - in reality you'd want to check actual availability
  // For now, we'll assume most Pokemon are available in multiple generations
  // through different games (HOME, GO, etc.)
  
  const availability: Record<string, boolean> = {};
  
  // Map our internal generation keys to PokemonDB generations
  const generations = ['gen7', 'gen8', 'gen9'];
  
  generations.forEach(gen => {
    // For now, assume all Pokemon are available in all newer generations
    // This is because PokemonDB often has Pokemon across multiple generations
    // through different games like HOME, GO, etc.
    availability[gen] = true;
  });
  
  return availability;
}

/**
 * Check if a Pokemon has shiny sprites available in a specific generation
 * This is based on known availability patterns - in a real app you might want to cache this data
 */
export function hasPokemonDBShinySprite(pokemonName: string, internalGeneration: string): boolean {
  // Known cases where shiny sprites are not available
  const noShinyCases: Record<string, string[]> = {
    'scarlet-violet': ['sprigatito', 'floragato', 'meowscarada', 'fuecoco', 'crocalor', 'skeledirge', 'quaxly', 'quaxwell', 'quaquaval']
    // Add more cases as needed
  };
  
  const pokemonDbGeneration = generationMap[internalGeneration] || 'scarlet-violet';
  
  // Check if this Pokemon is in the no-shiny list for this generation
  if (noShinyCases[pokemonDbGeneration]?.includes(pokemonName.toLowerCase())) {
    return false;
  }
  
  // For other cases, assume shiny is available
  return true;
}
