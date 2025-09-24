// Pokémon name canonicalization and mapping
// Handles aliases, forms, and ID resolution for usage data

import { PokemonNameMapping } from '@/types/usage';
import top50Data from '@/data/top50.json';

// Extended mapping for competitive Pokémon names
const POKEMON_NAME_MAPPINGS: PokemonNameMapping[] = [
  // Top 50 Pokémon with their aliases and forms
  { canonical: 'Pikachu', aliases: ['Pika'], pokemonId: 25, generation: 1, forms: ['Pikachu-Alola', 'Pikachu-Hoenn', 'Pikachu-Kalos', 'Pikachu-Sinnoh', 'Pikachu-Unova'] },
  { canonical: 'Charizard', aliases: ['Char'], pokemonId: 6, generation: 1, forms: ['Charizard-Mega-X', 'Charizard-Mega-Y', 'Charizard-Gmax'] },
  { canonical: 'Greninja', aliases: [], pokemonId: 658, generation: 6, forms: ['Greninja-Ash'] },
  { canonical: 'Eevee', aliases: [], pokemonId: 133, generation: 1, forms: [] },
  { canonical: 'Lucario', aliases: [], pokemonId: 448, generation: 4, forms: ['Lucario-Mega'] },
  { canonical: 'Umbreon', aliases: [], pokemonId: 197, generation: 2, forms: [] },
  { canonical: 'Mimikyu', aliases: [], pokemonId: 778, generation: 7, forms: [] },
  { canonical: 'Gardevoir', aliases: [], pokemonId: 282, generation: 3, forms: ['Gardevoir-Mega'] },
  { canonical: 'Gengar', aliases: [], pokemonId: 94, generation: 1, forms: ['Gengar-Mega', 'Gengar-Gmax'] },
  { canonical: 'Sylveon', aliases: [], pokemonId: 700, generation: 6, forms: [] },
  { canonical: 'Rayquaza', aliases: [], pokemonId: 384, generation: 3, forms: ['Rayquaza-Mega'] },
  { canonical: 'Garchomp', aliases: ['Chomp'], pokemonId: 445, generation: 4, forms: ['Garchomp-Mega'] },
  { canonical: 'Dragonite', aliases: [], pokemonId: 149, generation: 1, forms: [] },
  { canonical: 'Bulbasaur', aliases: ['Bulba'], pokemonId: 1, generation: 1, forms: [] },
  { canonical: 'Squirtle', aliases: [], pokemonId: 7, generation: 1, forms: [] },
  { canonical: 'Blastoise', aliases: [], pokemonId: 9, generation: 1, forms: ['Blastoise-Mega', 'Blastoise-Gmax'] },
  { canonical: 'Snorlax', aliases: [], pokemonId: 143, generation: 1, forms: ['Snorlax-Gmax'] },
  { canonical: 'Tyranitar', aliases: ['Ttar'], pokemonId: 248, generation: 2, forms: ['Tyranitar-Mega'] },
  { canonical: 'Metagross', aliases: ['Meta'], pokemonId: 376, generation: 3, forms: ['Metagross-Mega'] },
  { canonical: 'Infernape', aliases: [], pokemonId: 392, generation: 4, forms: [] },
  { canonical: 'Rowlet', aliases: [], pokemonId: 722, generation: 7, forms: [] },
  { canonical: 'Decidueye', aliases: [], pokemonId: 724, generation: 7, forms: ['Decidueye-Hisui'] },
  { canonical: 'Cinderace', aliases: [], pokemonId: 815, generation: 8, forms: [] },
  { canonical: 'Dragapult', aliases: [], pokemonId: 887, generation: 8, forms: [] },
  { canonical: 'Luxray', aliases: [], pokemonId: 405, generation: 4, forms: [] },
  { canonical: 'Zoroark', aliases: [], pokemonId: 571, generation: 5, forms: ['Zoroark-Hisui'] },
  { canonical: 'Absol', aliases: [], pokemonId: 359, generation: 3, forms: ['Absol-Mega'] },
  { canonical: 'Scizor', aliases: [], pokemonId: 212, generation: 2, forms: ['Scizor-Mega'] },
  { canonical: 'Darkrai', aliases: [], pokemonId: 491, generation: 4, forms: [] },
  { canonical: 'Alolan Ninetales', aliases: ['A-Ninetales', 'A9T'], pokemonId: 10103, generation: 7, forms: [] },
  { canonical: 'Arcanine', aliases: ['Arcanine-Hisui'], pokemonId: 59, generation: 1, forms: ['Arcanine-Hisui'] },
  { canonical: 'Suicune', aliases: [], pokemonId: 245, generation: 2, forms: [] },
  { canonical: 'Chandelure', aliases: [], pokemonId: 609, generation: 5, forms: [] },
  { canonical: 'Sceptile', aliases: [], pokemonId: 254, generation: 3, forms: ['Sceptile-Mega'] },
  { canonical: 'Flygon', aliases: [], pokemonId: 330, generation: 3, forms: [] },
  { canonical: 'Lapras', aliases: [], pokemonId: 131, generation: 1, forms: ['Lapras-Gmax'] },
  { canonical: 'Ditto', aliases: [], pokemonId: 132, generation: 1, forms: [] },
  { canonical: 'Jigglypuff', aliases: [], pokemonId: 39, generation: 1, forms: [] },
  { canonical: 'Incineroar', aliases: [], pokemonId: 727, generation: 7, forms: [] },
  { canonical: 'Serperior', aliases: [], pokemonId: 497, generation: 5, forms: [] },
  { canonical: 'Alakazam', aliases: [], pokemonId: 65, generation: 1, forms: ['Alakazam-Mega'] },
  { canonical: 'Crobat', aliases: [], pokemonId: 169, generation: 2, forms: [] },
  { canonical: 'Mewtwo', aliases: [], pokemonId: 150, generation: 1, forms: ['Mewtwo-Mega-X', 'Mewtwo-Mega-Y'] },
  { canonical: 'Mew', aliases: [], pokemonId: 151, generation: 1, forms: [] },
  { canonical: 'Celebi', aliases: [], pokemonId: 251, generation: 2, forms: [] },
  { canonical: 'Toxtricity', aliases: [], pokemonId: 849, generation: 8, forms: ['Toxtricity-Low-Key'] },
  { canonical: 'Corviknight', aliases: [], pokemonId: 823, generation: 8, forms: [] },
  { canonical: 'Snom', aliases: [], pokemonId: 872, generation: 8, forms: [] },
  { canonical: 'Blaziken', aliases: [], pokemonId: 257, generation: 3, forms: ['Blaziken-Mega'] },

  // Common competitive aliases and forms
  { canonical: 'Landorus-Therian', aliases: ['Lando-T', 'Landorus-T'], pokemonId: 645, generation: 5, forms: [] },
  { canonical: 'Landorus-Incarnate', aliases: ['Lando-I', 'Landorus-I'], pokemonId: 645, generation: 5, forms: [] },
  { canonical: 'Thundurus-Therian', aliases: ['Thundy-T', 'Thundurus-T'], pokemonId: 642, generation: 5, forms: [] },
  { canonical: 'Thundurus-Incarnate', aliases: ['Thundy-I', 'Thundurus-I'], pokemonId: 642, generation: 5, forms: [] },
  { canonical: 'Tornadus-Therian', aliases: ['Torn-T', 'Tornadus-T'], pokemonId: 641, generation: 5, forms: [] },
  { canonical: 'Tornadus-Incarnate', aliases: ['Torn-I', 'Tornadus-I'], pokemonId: 641, generation: 5, forms: [] },
  { canonical: 'Urshifu-Rapid-Strike', aliases: ['Urshifu-RS', 'Rapid-Strike Urshifu'], pokemonId: 892, generation: 8, forms: [] },
  { canonical: 'Urshifu-Single-Strike', aliases: ['Urshifu-SS', 'Single-Strike Urshifu'], pokemonId: 892, generation: 8, forms: [] },
  { canonical: 'Ursaluna-Bloodmoon', aliases: ['Bloodmoon Ursaluna'], pokemonId: 901, generation: 9, forms: [] },
  { canonical: 'Ogerpon-Wellspring', aliases: ['Ogerpon-Water'], pokemonId: 1017, generation: 9, forms: [] },
  { canonical: 'Ogerpon-Hearthflame', aliases: ['Ogerpon-Fire'], pokemonId: 1017, generation: 9, forms: [] },
  { canonical: 'Ogerpon-Cornerstone', aliases: ['Ogerpon-Rock'], pokemonId: 1017, generation: 9, forms: [] },
  { canonical: 'Ogerpon-Teal', aliases: ['Ogerpon-Grass'], pokemonId: 1017, generation: 9, forms: [] },
  { canonical: 'Great Tusk', aliases: [], pokemonId: 984, generation: 9, forms: [] },
  { canonical: 'Iron Treads', aliases: [], pokemonId: 989, generation: 9, forms: [] },
  { canonical: 'Iron Hands', aliases: [], pokemonId: 992, generation: 9, forms: [] },
  { canonical: 'Iron Jugulis', aliases: [], pokemonId: 993, generation: 9, forms: [] },
  { canonical: 'Iron Moth', aliases: [], pokemonId: 994, generation: 9, forms: [] },
  { canonical: 'Iron Thorns', aliases: [], pokemonId: 995, generation: 9, forms: [] },
  { canonical: 'Iron Bundle', aliases: [], pokemonId: 991, generation: 9, forms: [] },
  { canonical: 'Iron Valiant', aliases: [], pokemonId: 1006, generation: 9, forms: [] },
  { canonical: 'Roaring Moon', aliases: [], pokemonId: 1005, generation: 9, forms: [] },
  { canonical: 'Sandy Shocks', aliases: [], pokemonId: 989, generation: 9, forms: [] },
  { canonical: 'Scream Tail', aliases: [], pokemonId: 985, generation: 9, forms: [] },
  { canonical: 'Flutter Mane', aliases: [], pokemonId: 987, generation: 9, forms: [] },
  { canonical: 'Slither Wing', aliases: [], pokemonId: 988, generation: 9, forms: [] },
  { canonical: 'Brute Bonnet', aliases: [], pokemonId: 986, generation: 9, forms: [] },
  { canonical: 'Walking Wake', aliases: [], pokemonId: 1007, generation: 9, forms: [] },
  { canonical: 'Iron Leaves', aliases: [], pokemonId: 1010, generation: 9, forms: [] },
];

// Create lookup maps for performance
const CANONICAL_MAP = new Map<string, PokemonNameMapping>();
const ALIAS_MAP = new Map<string, PokemonNameMapping>();
const ID_MAP = new Map<number, PokemonNameMapping>();

// Initialize lookup maps
POKEMON_NAME_MAPPINGS.forEach(mapping => {
  // Map canonical name
  CANONICAL_MAP.set(mapping.canonical.toLowerCase(), mapping);
  
  // Map aliases
  mapping.aliases.forEach(alias => {
    ALIAS_MAP.set(alias.toLowerCase(), mapping);
  });
  
  // Map forms
  mapping.forms?.forEach(form => {
    CANONICAL_MAP.set(form.toLowerCase(), mapping);
  });
  
  // Map ID
  ID_MAP.set(mapping.pokemonId, mapping);
});

/**
 * Get the Top 50 Pokémon IDs for filtering
 */
export function getTop50PokemonIds(): number[] {
  return top50Data.map(pokemon => pokemon.national_number);
}

/**
 * Get the Top 50 Pokémon names for filtering
 */
export function getTop50PokemonNames(): string[] {
  return top50Data.map(pokemon => pokemon.name);
}

/**
 * Canonicalize a Pokémon name
 * Handles aliases, forms, and common variations
 */
export function canonicalizePokemonName(inputName: string): string {
  if (!inputName || typeof inputName !== 'string') {
    return '';
  }
  
  const normalized = inputName.trim().toLowerCase();
  
  // Check canonical names first
  if (CANONICAL_MAP.has(normalized)) {
    return CANONICAL_MAP.get(normalized)!.canonical;
  }
  
  // Check aliases
  if (ALIAS_MAP.has(normalized)) {
    return ALIAS_MAP.get(normalized)!.canonical;
  }
  
  // Handle common variations and edge cases
  const variations: Record<string, string> = {
    'lando-t': 'Landorus-Therian',
    'lando-i': 'Landorus-Incarnate',
    'thundy-t': 'Thundurus-Therian',
    'thundy-i': 'Thundurus-Incarnate',
    'torn-t': 'Tornadus-Therian',
    'torn-i': 'Tornadus-Incarnate',
    'a-ninetales': 'Alolan Ninetales',
    'a9t': 'Alolan Ninetales',
    'ttar': 'Tyranitar',
    'meta': 'Metagross',
    'chomp': 'Garchomp',
    'pika': 'Pikachu',
    'bulba': 'Bulbasaur',
    'char': 'Charizard',
    'urshifu-rs': 'Urshifu-Rapid-Strike',
    'urshifu-ss': 'Urshifu-Single-Strike',
    'rapid-strike urshifu': 'Urshifu-Rapid-Strike',
    'single-strike urshifu': 'Urshifu-Single-Strike',
    'bloodmoon ursaluna': 'Ursaluna-Bloodmoon',
    'ogerpon-water': 'Ogerpon-Wellspring',
    'ogerpon-fire': 'Ogerpon-Hearthflame',
    'ogerpon-rock': 'Ogerpon-Cornerstone',
    'ogerpon-grass': 'Ogerpon-Teal',
    'toxtricity-low-key': 'Toxtricity-Low-Key',
    'toxtricity-amped': 'Toxtricity',
  };
  
  if (variations[normalized]) {
    return variations[normalized];
  }
  
  // If no mapping found, return the original name (capitalized)
  return inputName.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

/**
 * Get Pokémon ID from name
 */
export function getPokemonIdFromName(name: string): number | null {
  const canonical = canonicalizePokemonName(name);
  const mapping = CANONICAL_MAP.get(canonical.toLowerCase());
  return mapping ? mapping.pokemonId : null;
}

/**
 * Get Pokémon name from ID
 */
export function getPokemonNameFromId(id: number): string | null {
  const mapping = ID_MAP.get(id);
  return mapping ? mapping.canonical : null;
}

/**
 * Check if a Pokémon name is in our Top 50 set
 */
export function isTop50Pokemon(name: string): boolean {
  const canonical = canonicalizePokemonName(name);
  const top50Names = getTop50PokemonNames();
  return top50Names.includes(canonical);
}

/**
 * Check if a Pokémon ID is in our Top 50 set
 */
export function isTop50PokemonId(id: number): boolean {
  const top50Ids = getTop50PokemonIds();
  return top50Ids.includes(id);
}

/**
 * Get all available forms for a Pokémon
 */
export function getPokemonForms(name: string): string[] {
  const canonical = canonicalizePokemonName(name);
  const mapping = CANONICAL_MAP.get(canonical.toLowerCase());
  return mapping ? mapping.forms || [] : [];
}

/**
 * Validate and normalize Pokémon data for usage ingestion
 */
export function validatePokemonData(name: string, id?: number): {
  valid: boolean;
  canonicalName: string;
  pokemonId: number | null;
  isTop50: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const canonicalName = canonicalizePokemonName(name);
  const pokemonId = id || getPokemonIdFromName(name);
  const isTop50 = pokemonId ? isTop50PokemonId(pokemonId) : false;
  
  if (!canonicalName) {
    errors.push(`Invalid Pokémon name: ${name}`);
  }
  
  if (!pokemonId) {
    errors.push(`Could not resolve Pokémon ID for: ${name}`);
  }
  
  if (!isTop50) {
    errors.push(`Pokémon ${canonicalName} is not in Top 50 set`);
  }
  
  return {
    valid: errors.length === 0,
    canonicalName,
    pokemonId,
    isTop50,
    errors
  };
}

/**
 * Get generation from Pokémon ID
 */
export function getGenerationFromId(id: number): number {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  if (id <= 905) return 8;
  if (id <= 1010) return 9;
  return 9; // Default to latest generation
}
