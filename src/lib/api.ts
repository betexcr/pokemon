import { 
  Pokemon, 
  BasicPokemon,
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

// Development mode - more aggressive caching
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Cache configuration
const CACHE_TTL = {
  POKEMON_LIST: IS_DEVELOPMENT ? 1 * 60 * 1000 : 6 * 60 * 60 * 1000, // 1 min dev, 6 hours prod
  POKEMON_DETAIL: IS_DEVELOPMENT ? 2 * 60 * 1000 : 24 * 60 * 60 * 1000, // 2 min dev, 24 hours prod
  TYPES: IS_DEVELOPMENT ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000, // 5 min dev, 24 hours prod
  SPECIES: IS_DEVELOPMENT ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000, // 5 min dev, 24 hours prod
  EVOLUTION: IS_DEVELOPMENT ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000, // 5 min dev, 24 hours prod
  MOVES: IS_DEVELOPMENT ? 5 * 60 * 1000 : 12 * 60 * 60 * 1000, // 5 min dev, 12 hours prod
};

// Simple in-memory cache (in production, use Redis)
const cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
// In-flight requests de-duplication map to avoid duplicate fetches for the same URL
const inFlightRequests = new Map<string, Promise<unknown>>();

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

// Generic fetch function with error handling, retries, and in-flight de-duplication
async function fetchWithRetry<T>(
  url: string, 
  options: RequestInit = {}, 
  retries = 3
): Promise<T> {
  if (!checkRateLimit()) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // De-duplicate concurrent requests to the same URL
  const existingRequest = inFlightRequests.get(url);
  if (existingRequest) {
    return existingRequest as Promise<T>;
  }

  const requestPromise = (async () => {
    // Log API calls in development (only when making the actual request)
    if (IS_DEVELOPMENT) {
      console.log(`🌐 API Call: ${url}`);
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
        throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed (attempt ${i + 1}/${retries}):`, error);
      if (i === retries - 1) {
        // Provide more helpful error messages
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          throw new Error(`Network error: Unable to connect to ${url}. Please check your internet connection.`);
        }
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
    }
    throw new Error('Max retries exceeded');
  })() as Promise<T>;

  inFlightRequests.set(url, requestPromise);
  try {
    const result = await requestPromise;
    return result;
  } finally {
    inFlightRequests.delete(url);
  }
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

// Get total count of Pokémon resources
export async function getPokemonTotalCount(): Promise<number> {
  const cacheKey = getCacheKey('pokemon-count');
  const cached = getCache(cacheKey);
  if (cached) {
    console.log('Using cached total count:', cached);
    return cached as number;
  }

  try {
    // Fetch the Pokémon list endpoint directly to get the total count
    const response = await fetchWithRetry<NamedAPIResourceList>(
      `${POKEAPI_BASE_URL}/pokemon?limit=1&offset=0`
    );
    
    const count = response.count || 0;
    console.log('Total Pokémon count from API:', count);
    setCache(cacheKey, count, CACHE_TTL.POKEMON_LIST);
    return count;
  } catch (error) {
    console.error('Error fetching Pokémon total count:', error);
    // Fallback to a reasonable estimate if API fails
    return 1025; // Approximate count as of Gen 9
  }
}

// Get Pokémon with pagination for infinite scrolling
export async function getPokemonWithPagination(limit = 75, offset = 0): Promise<Pokemon[]> {
  const cacheKey = getCacheKey('pokemon-paginated', { limit, offset });
  const cached = getCache(cacheKey);
  if (cached) {
    return cached as Pokemon[];
  }

  try {
    const pokemonList = await getPokemonList(limit, offset);
    
    // Fetch full Pokémon data for each Pokémon with proper error handling
    const pokemonData = await Promise.allSettled(
      pokemonList.results.map(async (pokemonRef) => {
        const pokemonId = pokemonRef.url.split('/').slice(-2)[0];
        const id = parseInt(pokemonId);
        
        try {
          // Fetch the full Pokémon data with retry logic
          const fullPokemon = await getPokemon(id);
          return fullPokemon;
        } catch (error) {
          console.error(`Failed to fetch full data for Pokémon ${id}:`, error);
          // Return null for failed fetches instead of placeholder data
          return null;
        }
      })
    );
    
    // Filter out failed fetches and log the results
    const successfulPokemon = pokemonData
      .filter((result): result is PromiseFulfilledResult<Pokemon> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
    
    const failedCount = pokemonData.length - successfulPokemon.length;
    if (failedCount > 0) {
      console.warn(`Failed to fetch ${failedCount} out of ${pokemonData.length} Pokémon`);
    }
    
    
    // Log sample data to verify quality
    if (successfulPokemon.length > 0) {
      const sample = successfulPokemon[0];
      
      // Check if this is placeholder data
      if (sample.types?.[0]?.type.name === 'normal' && sample.height === 0 && sample.weight === 0) {
        console.warn('⚠️ WARNING: Placeholder data detected! This should not happen with the new implementation.');
      }
    }
    
    setCache(cacheKey, successfulPokemon, CACHE_TTL.POKEMON_LIST);
    return successfulPokemon;
  } catch (error) {
    console.error('Error fetching paginated Pokémon:', error);
    return [];
  }
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

// Get all Pokémon of a specific type - FIXED VERSION with full data
export async function getPokemonByType(type: string): Promise<Pokemon[]> {
  const cacheKey = getCacheKey(`type/${type}/pokemon-full`);
  const cached = getCache(cacheKey);
  if (cached) return cached as Pokemon[];

  try {
    // First get the type data
    const typeData = await getType(type);
    
    // Fetch full Pokémon data for each Pokémon to get all types
    const pokemonData = await Promise.allSettled(
      typeData.pokemon.map(async (pokemonRef) => {
        const pokemonId = pokemonRef.pokemon.url.split('/').slice(-2)[0];
        const id = parseInt(pokemonId);
        
        try {
          // Fetch the full Pokémon data to get all types
          const fullPokemon = await getPokemon(id);
          return fullPokemon;
        } catch (error) {
          console.error(`Failed to fetch full data for Pokémon ${id}:`, error);
          return null;
        }
      })
    );
    
    // Filter out failed fetches
    const successfulPokemon = pokemonData
      .filter((result): result is PromiseFulfilledResult<Pokemon> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
    
    const failedCount = pokemonData.length - successfulPokemon.length;
    if (failedCount > 0) {
      console.warn(`Failed to fetch ${failedCount} out of ${pokemonData.length} Pokémon for type ${type}`);
    }
    
    setCache(cacheKey, successfulPokemon, CACHE_TTL.POKEMON_LIST);
    return successfulPokemon;
  } catch (error) {
    console.error(`Error fetching Pokémon for type ${type}:`, error);
    return [];
  }
}

// Search Pokémon by name or number using API
export async function searchPokemonByName(searchTerm: string): Promise<Pokemon[]> {
  const cacheKey = getCacheKey(`search/${searchTerm}`);
  const cached = getCache(cacheKey);
  if (cached) return cached as Pokemon[];

  try {
    // Check if search term is a number (Pokémon ID)
    const isNumberSearch = /^\d+$/.test(searchTerm.trim());
    
    if (isNumberSearch) {
      // Direct number search - fetch the specific Pokémon
      const pokemonId = parseInt(searchTerm.trim());
      
      // Validate Pokémon ID range (1-1025 for current generations)
      if (pokemonId >= 1 && pokemonId <= 1025) {
        try {
          const pokemon = await getPokemon(pokemonId);
          setCache(cacheKey, [pokemon], CACHE_TTL.POKEMON_DETAIL);
          return [pokemon];
        } catch (error) {
          console.error(`Error fetching Pokémon with ID ${pokemonId}:`, error);
          return [];
        }
      } else {
        // Invalid Pokémon ID
        return [];
      }
    }

    // Name search - use cached basic Pokémon list if available
    const basicPokemonCache = getCache('all-pokemon');
    let allPokemon;
    
    if (basicPokemonCache) {
      // Use cached basic data instead of making new API calls
      allPokemon = { results: basicPokemonCache as Pokemon[] };
    } else {
      // Fallback: get basic list (only 1 API call instead of 1000+)
      allPokemon = await getPokemonList(151, 0);
    }
    
    // Filter by search term
    const matchingPokemon = allPokemon.results.filter(pokemon =>
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Limit results to first 20 to avoid too many API calls
    const limitedResults = matchingPokemon.slice(0, 20);

    // For search results, we can use basic data if available, or fetch minimal data
    const pokemonList = limitedResults.map((pokemonRef) => {
      if ('id' in pokemonRef) {
        // This is already a basic Pokémon object
        return pokemonRef as Pokemon;
      } else {
        // This is a reference, create basic object
        const pokemonId = pokemonRef.url.split('/').slice(-2)[0];
        return {
          id: parseInt(pokemonId),
          name: pokemonRef.name,
          base_experience: 0,
          height: 0,
          weight: 0,
          is_default: true,
          order: parseInt(pokemonId),
          abilities: [],
          forms: [],
          game_indices: [],
          held_items: [],
          location_area_encounters: '',
          moves: [],
          sprites: {
            // Use the smallest, most efficient sprites for main page
            front_default: getPokemonFallbackImage(parseInt(pokemonId)),
            front_shiny: null,
            front_female: null,
            front_shiny_female: null,
            back_default: null,
            back_shiny: null,
            back_female: null,
            back_shiny_female: null,
            other: {
              dream_world: { front_default: null, front_female: null },
              home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null },
              // Use home sprites instead of official artwork for main page (much smaller)
              'official-artwork': {
                front_default: getPokemonMainPageImage(parseInt(pokemonId)),
                front_shiny: null
              }
            }
          },
          stats: [],
          types: [],
          species: { name: '', url: '' },
          evolution_chain: { name: '', url: '' }
        } as Pokemon;
      }
    });
    
    setCache(cacheKey, pokemonList, CACHE_TTL.POKEMON_DETAIL);
    return pokemonList;
  } catch (error) {
    console.error(`Error searching Pokémon for term ${searchTerm}:`, error);
    return [];
  }
}

// Get all Pokémon (original 151 for initial load) - OPTIMIZED VERSION
export async function getAllPokemon(): Promise<Pokemon[]> {
  const cacheKey = getCacheKey('all-pokemon');
  const cached = getCache(cacheKey);
  if (cached) return cached as Pokemon[];

  try {
    // Load only the original 151 Pokémon initially
    const allPokemon = await getPokemonList(151, 0);
    
    // For initial page load, we only need basic info, not full data
    // This reduces API calls from 151 to just 1
    const basicPokemonList = allPokemon.results.map((pokemonRef, index) => {
      const pokemonId = pokemonRef.url.split('/').slice(-2)[0];
      return {
        id: parseInt(pokemonId),
        name: pokemonRef.name,
        base_experience: 0,
        height: 0,
        weight: 0,
        is_default: true,
        order: parseInt(pokemonId),
        abilities: [],
        forms: [],
        game_indices: [],
        held_items: [],
        location_area_encounters: '',
        moves: [],
        sprites: {
          // Use the smallest, most efficient sprites for main page
          front_default: getPokemonFallbackImage(parseInt(pokemonId)),
          front_shiny: null,
          front_female: null,
          front_shiny_female: null,
          back_default: null,
          back_shiny: null,
          back_female: null,
          back_shiny_female: null,
          other: {
            dream_world: { front_default: null, front_female: null },
            home: { front_default: null, front_female: null, front_shiny: null, front_shiny_female: null },
            // Use home sprites instead of official artwork for main page (much smaller)
            'official-artwork': {
              front_default: getPokemonMainPageImage(parseInt(pokemonId)),
              front_shiny: null
            }
          }
        },
        stats: [],
        types: [],
        species: { name: '', url: '' },
        evolution_chain: { name: '', url: '' }
      } as Pokemon;
    });
    
    setCache(cacheKey, basicPokemonList, CACHE_TTL.POKEMON_LIST);
    return basicPokemonList;
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



// Lazy load full Pokémon data when needed
export async function getPokemonFullData(id: number): Promise<Pokemon> {
  const cacheKey = getCacheKey(`pokemon-full-${id}`);
  const cached = getCache(cacheKey);
  if (cached) return cached as Pokemon;

  try {
    const fullPokemon = await getPokemon(id);
    setCache(cacheKey, fullPokemon, CACHE_TTL.POKEMON_DETAIL);
    return fullPokemon;
  } catch (error) {
    console.error(`Error fetching full data for Pokémon ${id}:`, error);
    throw error;
  }
}

// Optimized image functions for different contexts
export function getPokemonImageUrl(id: number, variant: 'default' | 'shiny' = 'default'): string {
  // For detail pages, use high-quality official artwork
  const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';
  return `${baseUrl}/${id}.png`;
}

export function getPokemonSpriteUrl(id: number, variant: 'default' | 'shiny' = 'default'): string {
  // For main page grid/list, use small sprites
  const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
  const suffix = variant === 'shiny' ? 'shiny' : '';
  return `${baseUrl}/${suffix}/${id}.png`;
}

// NEW: Get the most appropriate image for main page (smallest file size)
export function getPokemonMainPageImage(id: number): string {
  // Use home sprites for main page - they're much smaller than official artwork
  // but still look good in grid/list views
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png`;
}

// NEW: Get fallback image if home sprite doesn't exist
export function getPokemonFallbackImage(id: number): string {
  // Fallback to regular sprites if home sprites aren't available
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
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
