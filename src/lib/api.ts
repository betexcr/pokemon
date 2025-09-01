import { 
  Pokemon, 
  NamedAPIResourceList, 
  Type, 
  PokemonSpecies, 
  EvolutionChain, 
  Move,
  Ability,
  Item,
  LocationArea,
  Generation
} from '@/types/pokemon';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

// Cache configuration
const CACHE_TTL = {
  POKEMON_LIST: 6 * 60 * 60 * 1000, // 6 hours
  POKEMON_DETAIL: 24 * 60 * 60 * 1000, // 24 hours
  TYPES: 24 * 60 * 60 * 1000, // 24 hours
  SPECIES: 24 * 60 * 60 * 1000, // 24 hours
  EVOLUTION: 24 * 60 * 60 * 1000, // 24 hours
  MOVES: 12 * 60 * 60 * 1000, // 12 hours
};

// Simple in-memory cache (in production, use Redis)
const cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

function getCacheKey(endpoint: string, params?: Record<string, unknown>): string {
  const paramString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
  return `${endpoint}${paramString}`;
}

function isCacheValid(key: string): boolean {
  const cached = cache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < cached.ttl;
}

function setCache(key: string, data: unknown, ttl: number): void {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

function getCache(key: string): unknown | null {
  if (isCacheValid(key)) {
    return cache.get(key)?.data;
  }
  cache.delete(key);
  return null;
}

// Rate limiting
let requestCount = 0;
const RATE_LIMIT = 100; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - requestCount > RATE_LIMIT_WINDOW) {
    requestCount = 1;
    return true;
  }
  requestCount++;
  return requestCount <= RATE_LIMIT;
}

// Generic fetch function with error handling and retries
async function fetchWithRetry<T>(
  url: string, 
  options: RequestInit = {}, 
  retries = 3
): Promise<T> {
  if (!checkRateLimit()) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}

// API functions
export async function getPokemonList(limit = 20, offset = 0): Promise<NamedAPIResourceList> {
  const cacheKey = getCacheKey('pokemon', { limit, offset });
  const cached = getCache(cacheKey);
  if (cached) return cached as NamedAPIResourceList;

  const data = await fetchWithRetry<NamedAPIResourceList>(
    `${POKEAPI_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`
  );
  
  setCache(cacheKey, data, CACHE_TTL.POKEMON_LIST);
  return data;
}

export async function getPokemon(nameOrId: string | number): Promise<Pokemon> {
  const cacheKey = getCacheKey(`pokemon/${nameOrId}`);
  const cached = getCache(cacheKey);
  if (cached) return cached as Pokemon;

  const data = await fetchWithRetry<Pokemon>(
    `${POKEAPI_BASE_URL}/pokemon/${nameOrId}`
  );
  
  setCache(cacheKey, data, CACHE_TTL.POKEMON_DETAIL);
  return data;
}

export async function getPokemonSpecies(nameOrId: string | number): Promise<PokemonSpecies> {
  const cacheKey = getCacheKey(`pokemon-species/${nameOrId}`);
  const cached = getCache(cacheKey);
  if (cached) return cached as PokemonSpecies;

  const data = await fetchWithRetry<PokemonSpecies>(
    `${POKEAPI_BASE_URL}/pokemon-species/${nameOrId}`
  );
  
  setCache(cacheKey, data, CACHE_TTL.SPECIES);
  return data;
}

export async function getType(nameOrId: string | number): Promise<Type> {
  const cacheKey = getCacheKey(`type/${nameOrId}`);
  const cached = getCache(cacheKey);
  if (cached) return cached as Type;

  const data = await fetchWithRetry<Type>(
    `${POKEAPI_BASE_URL}/type/${nameOrId}`
  );
  
  setCache(cacheKey, data, CACHE_TTL.TYPES);
  return data;
}

export async function getEvolutionChain(id: number): Promise<EvolutionChain> {
  const cacheKey = getCacheKey(`evolution-chain/${id}`);
  const cached = getCache(cacheKey);
  if (cached) return cached as EvolutionChain;

  const data = await fetchWithRetry<EvolutionChain>(
    `${POKEAPI_BASE_URL}/evolution-chain/${id}`
  );
  
  setCache(cacheKey, data, CACHE_TTL.EVOLUTION);
  return data;
}

export async function getMove(nameOrId: string | number): Promise<Move> {
  const cacheKey = getCacheKey(`move/${nameOrId}`);
  const cached = getCache(cacheKey);
  if (cached) return cached as Move;

  const data = await fetchWithRetry<Move>(
    `${POKEAPI_BASE_URL}/move/${nameOrId}`
  );
  
  setCache(cacheKey, data, CACHE_TTL.MOVES);
  return data;
}

export async function getAllTypes(): Promise<NamedAPIResourceList> {
  const cacheKey = getCacheKey('type');
  const cached = getCache(cacheKey);
  if (cached) return cached as NamedAPIResourceList;

  const data = await fetchWithRetry<NamedAPIResourceList>(
    `${POKEAPI_BASE_URL}/type`
  );
  
  setCache(cacheKey, data, CACHE_TTL.TYPES);
  return data;
}

// Additional API functions for enhanced data
export async function getAbility(nameOrId: string | number): Promise<Ability> {
  const cacheKey = getCacheKey(`ability/${nameOrId}`);
  const cached = getCache(cacheKey);
  if (cached) return cached as Ability;

  const data = await fetchWithRetry<Ability>(
    `${POKEAPI_BASE_URL}/ability/${nameOrId}`
  );
  
  setCache(cacheKey, data, CACHE_TTL.MOVES);
  return data;
}

export async function getItem(nameOrId: string | number): Promise<Item> {
  const cacheKey = getCacheKey(`item/${nameOrId}`);
  const cached = getCache(cacheKey);
  if (cached) return cached as Item;

  const data = await fetchWithRetry<Item>(
    `${POKEAPI_BASE_URL}/item/${nameOrId}`
  );
  
  setCache(cacheKey, data, CACHE_TTL.MOVES);
  return data;
}

export async function getLocationArea(nameOrId: string | number): Promise<LocationArea> {
  const cacheKey = getCacheKey(`location-area/${nameOrId}`);
  const cached = getCache(cacheKey);
  if (cached) return cached as LocationArea;

  const data = await fetchWithRetry<LocationArea>(
    `${POKEAPI_BASE_URL}/location-area/${nameOrId}`
  );
  
  setCache(cacheKey, data, CACHE_TTL.MOVES);
  return data;
}

export async function getGeneration(nameOrId: string | number): Promise<Generation> {
  const cacheKey = getCacheKey(`generation/${nameOrId}`);
  const cached = getCache(cacheKey);
  if (cached) return cached as Generation;

  const data = await fetchWithRetry<Generation>(
    `${POKEAPI_BASE_URL}/generation/${nameOrId}`
  );
  
  setCache(cacheKey, data, CACHE_TTL.MOVES);
  return data;
}

// Get all Pokémon of a specific type
export async function getPokemonByType(type: string): Promise<Pokemon[]> {
  const cacheKey = getCacheKey(`type/${type}/pokemon`);
  const cached = getCache(cacheKey);
  if (cached) return cached as Pokemon[];

  try {
    // First get the type data
    const typeData = await getType(type);
    
    // Extract Pokémon from the type data
    const pokemonPromises = typeData.pokemon.map(async (pokemonRef) => {
      const pokemonId = pokemonRef.pokemon.url.split('/').slice(-2)[0];
      return await getPokemon(parseInt(pokemonId));
    });

    const pokemonList = await Promise.all(pokemonPromises);
    
    setCache(cacheKey, pokemonList, CACHE_TTL.POKEMON_DETAIL);
    return pokemonList;
  } catch (error) {
    console.error(`Error fetching Pokémon for type ${type}:`, error);
    return [];
  }
}

// Search Pokémon by name using API
export async function searchPokemonByName(searchTerm: string): Promise<Pokemon[]> {
  const cacheKey = getCacheKey(`search/${searchTerm}`);
  const cached = getCache(cacheKey);
  if (cached) return cached as Pokemon[];

  try {
    // Get more Pokémon to search through (up to 1000 to include Lugia and others)
    const allPokemon = await getPokemonList(1000, 0);
    
    // Filter by search term
    const matchingPokemon = allPokemon.results.filter(pokemon =>
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Limit results to first 20 to avoid too many API calls
    const limitedResults = matchingPokemon.slice(0, 20);

    // Fetch full data for matching Pokémon (individual Pokémon are cached in getPokemon)
    const pokemonPromises = limitedResults.map(async (pokemonRef) => {
      const pokemonId = pokemonRef.url.split('/').slice(-2)[0];
      return await getPokemon(parseInt(pokemonId));
    });

    const pokemonList = await Promise.all(pokemonPromises);
    
    setCache(cacheKey, pokemonList, CACHE_TTL.POKEMON_DETAIL);
    return pokemonList;
  } catch (error) {
    console.error(`Error searching Pokémon for term ${searchTerm}:`, error);
    return [];
  }
}

// Get all Pokémon (for virtualized lists)
export async function getAllPokemon(): Promise<Pokemon[]> {
  const cacheKey = getCacheKey('all-pokemon');
  const cached = getCache(cacheKey);
  if (cached) return cached as Pokemon[];

  try {
    // Get only the first 151 Pokémon initially
    const allPokemon = await getPokemonList(151, 0);
    
    // Fetch full data for all Pokémon
    const pokemonPromises = allPokemon.results.map(async (pokemonRef) => {
      const pokemonId = pokemonRef.url.split('/').slice(-2)[0];
      return await getPokemon(parseInt(pokemonId));
    });

    const pokemonList = await Promise.all(pokemonPromises);
    
    setCache(cacheKey, pokemonList, CACHE_TTL.POKEMON_DETAIL);
    return pokemonList;
  } catch (error) {
    console.error('Error fetching all Pokémon:', error);
    return [];
  }
}

// Get Pokémon by generation
export async function getPokemonByGeneration(generation: string): Promise<Pokemon[]> {
  const cacheKey = getCacheKey(`generation-${generation}`);
  const cached = getCache(cacheKey);
  if (cached) return cached as Pokemon[];

  try {
    // Generation ranges (simplified - in a real app you'd fetch from the API)
    const generationRanges: Record<string, { start: number; end: number }> = {
      '1': { start: 1, end: 151 },
      '2': { start: 152, end: 251 },
      '3': { start: 252, end: 386 },
      '4': { start: 387, end: 493 },
      '5': { start: 494, end: 649 },
      '6': { start: 650, end: 721 },
      '7': { start: 722, end: 809 },
      '8': { start: 810, end: 905 },
      '9': { start: 906, end: 1025 }
    };

    const range = generationRanges[generation];
    if (!range) {
      console.warn(`Unknown generation: ${generation}`);
      return [];
    }

    // Fetch Pokémon for the generation range
    const pokemonPromises = [];
    for (let id = range.start; id <= range.end; id++) {
      pokemonPromises.push(getPokemon(id));
    }

    const pokemonList = await Promise.all(pokemonPromises);
    
    setCache(cacheKey, pokemonList, CACHE_TTL.POKEMON_DETAIL);
    return pokemonList;
  } catch (error) {
    console.error(`Error fetching Pokémon for generation ${generation}:`, error);
    return [];
  }
}



// Utility functions
export function getPokemonImageUrl(id: number, variant: 'default' | 'shiny' = 'default'): string {
  const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';
  return `${baseUrl}/${id}.png`;
}

export function getPokemonSpriteUrl(id: number, variant: 'default' | 'shiny' = 'default'): string {
  const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
  const suffix = variant === 'shiny' ? 'shiny' : '';
  return `${baseUrl}/${suffix}/${id}.png`;
}

// Type effectiveness calculation
export function calculateTypeEffectiveness(
  attackingType: string,
  defendingTypes: string[]
): number {
  // This is a simplified version - in a real app, you'd want to fetch the actual type data
  const effectivenessChart: Record<string, Record<string, number>> = {
    fire: { grass: 2, water: 0.5, fire: 0.5 },
    water: { fire: 2, grass: 0.5, water: 0.5 },
    grass: { water: 2, fire: 0.5, grass: 0.5 },
    electric: { water: 2, grass: 0.5, electric: 0.5 },
    ice: { grass: 2, fire: 0.5, ice: 0.5 },
    fighting: { normal: 2, ice: 2, flying: 0.5, psychic: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5 },
    ground: { fire: 2, electric: 2, grass: 0.5, flying: 0 },
    flying: { grass: 2, fighting: 2, electric: 0.5, rock: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5 },
    bug: { grass: 2, psychic: 2, fire: 0.5, flying: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5 },
    ghost: { psychic: 2, ghost: 2, normal: 0 },
    dragon: { dragon: 2 },
    dark: { psychic: 2, ghost: 2, fighting: 0.5 },
    steel: { ice: 2, rock: 2, steel: 0.5, fire: 0.5 },
    fairy: { fighting: 2, dragon: 2, poison: 0.5, steel: 0.5 },
  };

  let totalEffectiveness = 1;
  
  for (const defendingType of defendingTypes) {
    const effectiveness = effectivenessChart[attackingType]?.[defendingType] || 1;
    totalEffectiveness *= effectiveness;
  }

  return totalEffectiveness;
}

// Search and filter utilities
export function searchPokemon(pokemonList: NamedAPIResourceList, searchTerm: string): NamedAPIResourceList {
  if (!searchTerm.trim()) return pokemonList;

  const filtered = pokemonList.results.filter(pokemon =>
    pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    ...pokemonList,
    results: filtered,
    count: filtered.length,
  };
}

// Clear cache (useful for development or when data becomes stale)
export function clearCache(): void {
  cache.clear();
}

export function clearCacheByPattern(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}
