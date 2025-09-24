import { getEvolutionChain, getPokemonSpecies } from '@/lib/api';
import type { EvolutionChain, EvolutionChainLink } from '@/types/pokemon';
import type { Edge, EvoGraph, Family, Method, NormalizedEvoGraph, Species } from './types';
import { normalizeEvoGraph } from './normalize';

// Helper function to check if an evolution has any of the specified methods
function hasEvolutionMethod(evolution: any, methods: string[]): boolean {
  const methodSet = new Set(methods);
  
  // Check evolution details for method
  if (evolution.evolution_details && evolution.evolution_details.length > 0) {
    for (const detail of evolution.evolution_details) {
      const trigger = detail.trigger?.name;
      
      // Map frontend method names to PokeAPI trigger names and conditions
      if (methodSet.has('level') && trigger === 'level-up' && detail.min_level != null) {
        return true;
      }
      if (methodSet.has('stone') && trigger === 'use-item' && detail.item?.name) {
        return true;
      }
      if (methodSet.has('trade') && trigger === 'trade') {
        return true;
      }
      if (methodSet.has('friendship') && trigger === 'level-up' && detail.min_happiness != null) {
        return true;
      }
      if (methodSet.has('location') && trigger === 'level-up' && detail.location?.name) {
        return true;
      }
      if (methodSet.has('special') && trigger !== 'level-up' && trigger !== 'use-item' && trigger !== 'trade') {
        return true;
      }
    }
  }
  
  // Recursively check evolves_to
  if (evolution.evolves_to && evolution.evolves_to.length > 0) {
    for (const child of evolution.evolves_to) {
      if (hasEvolutionMethod(child, methods)) {
        return true;
      }
    }
  }
  
  return false;
}

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

// Batch fetch Pokemon data to reduce API calls
async function getBatchPokemonData(ids: number[], batchSize: number = 50): Promise<Map<number, { types: string[] }>> {
  const result = new Map<number, { types: string[] }>();
  
  // Process in smaller batches to avoid overwhelming the API
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    
    // Add delay between batches to respect rate limits
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const promises = batch.map(async (id) => {
      try {
        const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${id}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return {
          id,
          types: (data.types || []).map((t: any) => capitalize(t.type.name))
        };
      } catch (error) {
        console.warn(`Failed to fetch minimal data for Pokemon ${id}:`, error);
        return { id, types: [] };
      }
    });
    
    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ id, types }) => {
      result.set(id, { types });
    });
  }
  
  return result;
}

// Optimized function to fetch only the minimal data needed for evolutions
async function getMinimalPokemonData(id: number): Promise<{ types: string[] }> {
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${id}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      types: (data.types || []).map((t: any) => capitalize(t.type.name))
    };
  } catch (error) {
    console.warn(`Failed to fetch minimal data for Pokemon ${id}:`, error);
    return { types: [] };
  }
}

// Batch fetch species data to reduce API calls
async function getBatchSpeciesData(ids: number[], batchSize: number = 50): Promise<Map<number, { name: string; generation: string | null }>> {
  const result = new Map<number, { name: string; generation: string | null }>();
  
  // Process in smaller batches to avoid overwhelming the API
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    
    // Add delay between batches to respect rate limits
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const promises = batch.map(async (id) => {
      try {
        const response = await fetch(`${POKEAPI_BASE_URL}/pokemon-species/${id}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return {
          id,
          name: data.name || '',
          generation: data.generation?.name || null
        };
      } catch (error) {
        console.warn(`Failed to fetch minimal species data for Pokemon ${id}:`, error);
        return { id, name: '', generation: null };
      }
    });
    
    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ id, name, generation }) => {
      result.set(id, { name, generation });
    });
  }
  
  return result;
}

// Optimized function to fetch only the minimal species data needed for evolutions
async function getMinimalSpeciesData(id: number): Promise<{ name: string; generation: string | null }> {
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}/pokemon-species/${id}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      name: data.name || '',
      generation: data.generation?.name || null
    };
  } catch (error) {
    console.warn(`Failed to fetch minimal species data for Pokemon ${id}:`, error);
    return { name: '', generation: null };
  }
}

type BuildOptions = {
  gens?: number[]; // If provided, only include families that contain species from these gens
  methods?: string[]; // If provided, only include families that contain evolutions using these methods
  offset?: number; // Offset for progressive paging
  limit?: number; // Page size for progressive paging
};

export async function buildEvoGraph(options: BuildOptions = {}): Promise<NormalizedEvoGraph> {
  const { gens, methods, offset, limit } = options;

  // If gen filter is provided, first collect all species for those generations
  let chainIds: number[];
  if (gens && gens.length) {
    const speciesForGens = await listSpeciesByGenerations(gens);
    const evoChainIds = new Set<number>();
    for (const s of speciesForGens) {
      const url = s.evolution_chain?.url || '';
      if (!url) continue;
      const id = extractId(url);
      if (id) evoChainIds.add(id);
    }
    chainIds = Array.from(evoChainIds).sort((a, b) => a - b);
  } else {
    chainIds = await listAllEvolutionChainIds();
  }

  const start = typeof offset === 'number' && offset > 0 ? offset : 0;
  const end = typeof limit === 'number' && limit > 0 ? start + limit : undefined;
  chainIds = chainIds.slice(start, end);

  const families: Family[] = [];

  // Collect all unique Pokemon IDs first for batch fetching
  const allPokemonIds = new Set<number>();
  const evolutionChains: EvolutionChain[] = [];

  // First pass: collect chains and Pokemon IDs, with early filtering for methods
  const filteredChains: EvolutionChain[] = [];
  
  for (const chainId of chainIds) {
    let chain: EvolutionChain;
    try {
      chain = await getEvolutionChain(chainId);
      
      // Early method filtering: if methods filter is specified, check if this chain has any matching methods
      if (methods && methods.length > 0) {
        const hasMatchingMethod = chain.chain.evolves_to.some(evolution => 
          hasEvolutionMethod(evolution, methods)
        ) || hasEvolutionMethod(chain.chain, methods);
        
        if (!hasMatchingMethod) {
          continue; // Skip this chain if it doesn't have any matching methods
        }
      }
      
      filteredChains.push(chain);
      
      // Collect all Pokemon IDs from this chain
      const chainIds = extractAllPokemonIds(chain);
      chainIds.forEach(id => allPokemonIds.add(id));
    } catch {
      continue;
    }
  }
  
  // Use filtered chains instead of all chains
  evolutionChains.push(...filteredChains);

  // Batch fetch all Pokemon and species data
  console.log(`Batch fetching data for ${allPokemonIds.size} Pokemon from ${evolutionChains.length} chains...`);
  const pokemonIds = Array.from(allPokemonIds);
  
  // Use smaller batch sizes when filters are applied to improve performance
  const hasFilters = (gens && gens.length > 0) || (methods && methods.length > 0);
  const batchSize = hasFilters ? 25 : 50; // Smaller batches for filtered data
  
  const [speciesCache, pokemonCache] = await Promise.all([
    getBatchSpeciesData(pokemonIds, batchSize),
    getBatchPokemonData(pokemonIds, batchSize)
  ]);

  console.log(`Batch fetch complete. Processing ${evolutionChains.length} evolution chains...`);

  // Second pass: build families using cached data
  for (const chain of evolutionChains) {
    const { species: familySpecies, edges } = await buildFamilyFromChain(chain, speciesCache, pokemonCache);

    // If a gen filter is present, keep only families that have any species matching those gens
    if (gens && gens.length) {
      const anyMatch = familySpecies.some((s) => gens.includes(s.gen));
      if (!anyMatch) continue;
    }

    const family: Family = {
      familyId: String(chain.id),
      species: familySpecies,
      edges,
    };
    families.push(family);
  }

  // Apply method filtering if specified
  let filteredFamilies = families;
  if (methods && methods.length > 0) {
    const methodSet = new Set(methods);
    filteredFamilies = families.filter(family => {
      // Check if any edge in this family uses one of the specified methods
      return family.edges.some(edge => methodSet.has(edge.method.kind));
    });
  }

  // Normalize for maps/bases/branched flags
  return normalizeEvoGraph({ families: filteredFamilies } as EvoGraph);
}

async function listAllEvolutionChainIds(): Promise<number[]> {
  // Fetch all evolution-chain references (large list, but single request with big limit)
  const url = `${POKEAPI_BASE_URL}/evolution-chain?limit=5000`;
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`Failed to list evolution chains: ${res.status}`);
  const json = await res.json();
  const ids: number[] = (json.results as Array<{ url: string }>).
    map((r) => extractId(r.url)).
    filter((n: number | null): n is number => Number.isFinite(n));
  return Array.from(new Set(ids)).sort((a, b) => a - b);
}

async function listSpeciesByGenerations(gens: number[]) {
  // Fetch species list (we need evolution_chain URLs and generation classification)
  // PokeAPI doesn't provide species list by generation in a single call, but
  // the generation endpoint lists species for that generation. Use it.
  const species: Awaited<ReturnType<typeof getPokemonSpecies>>[] = [];
  
  // Collect all species IDs first
  const allSpeciesIds: number[] = [];
  for (const g of gens) {
    console.log(`Debug: Fetching generation ${g} species...`);
    const url = `${POKEAPI_BASE_URL}/generation/${g}`;
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) {
      console.warn(`Failed to fetch generation ${g}: ${res.status}`);
      continue;
    }
    const json = await res.json();
    const speciesRefs = (json.pokemon_species || []) as Array<{ name: string; url: string }>;
    console.log(`Debug: Found ${speciesRefs.length} species for generation ${g}`);
    for (const ref of speciesRefs) {
      const id = extractId(ref.url);
      if (id) allSpeciesIds.push(id);
    }
  }
  
  console.log(`Debug: Total species IDs to fetch: ${allSpeciesIds.length}`);
  
  // Batch fetch all species data with rate limiting
  const batchSize = 5;
  for (let i = 0; i < allSpeciesIds.length; i += batchSize) {
    const batch = allSpeciesIds.slice(i, i + batchSize);
    
    // Add delay between batches to respect rate limits
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const promises = batch.map(async (id) => {
      try {
        return await getPokemonSpecies(id);
      } catch (error) {
        console.warn(`Failed to fetch species ${id}:`, error);
        return null;
      }
    });
    
    const batchResults = await Promise.all(promises);
    batchResults.forEach((sp) => {
      if (sp) species.push(sp);
    });
  }
  
  console.log(`Debug: Successfully fetched ${species.length} species data`);
  return species;
}

function extractId(url: string): number | null {
  const parts = url.split('/').filter(Boolean);
  const last = parts[parts.length - 1];
  const n = Number(last);
  return Number.isFinite(n) ? n : null;
}

function extractAllPokemonIds(chain: EvolutionChain): number[] {
  const ids: number[] = [];
  
  function traverse(node: EvolutionChainLink) {
    const id = node.species.url ? extractId(node.species.url) : null;
    if (id) ids.push(id);
    node.evolves_to.forEach(traverse);
  }
  
  traverse(chain.chain);
  return ids;
}

async function buildFamilyFromChain(
  chain: EvolutionChain,
  speciesCache: Map<number, { name: string; generation: string | null }>,
  pokemonCache: Map<number, { types: string[] }>
) {
  const speciesMap = new Map<number, Species>();
  const edges: Edge[] = [];

  // Traverse the chain recursively
  function visit(node: EvolutionChainLink) {
    const id = node.species.url ? extractId(node.species.url) : null;
    if (!id) return;
    if (!speciesMap.has(id)) {
      const s = getSpeciesSummarySync(id, speciesCache, pokemonCache);
      speciesMap.set(id, s);
    }
    for (const next of node.evolves_to) {
      const toId = next.species.url ? extractId(next.species.url) : null;
      if (!toId) continue;
      if (!speciesMap.has(toId)) {
        const s2 = getSpeciesSummarySync(toId, speciesCache, pokemonCache);
        speciesMap.set(toId, s2);
      }
      const method = mapMethod(next.evolution_details?.[0]);
      edges.push({ from: id, to: toId, method });
      visit(next);
    }
  }

  visit(chain.chain);
  const species = Array.from(speciesMap.values());
  return { species, edges };
}

function getSpeciesSummarySync(
  id: number,
  speciesCache: Map<number, { name: string; generation: string | null }>,
  pokemonCache: Map<number, { types: string[] }>
): Species {
  const sp = speciesCache.get(id);
  if (!sp) {
    console.warn(`Missing species data for Pokemon ${id}`);
    return {
      id,
      name: `Pokemon ${id}`,
      gen: 0,
      types: [],
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    };
  }
  
  const pokemonData = pokemonCache.get(id);
  const types = pokemonData?.types || [];

  const name = sp.name.replace(/-/g, ' ');
  const baseGen = generationNumber(sp.generation);
  const gen = getEnhancedGeneration(sp.name, baseGen ?? 0);
  
  // Debug logging for generation 7
  if (sp.generation === 'generation-vii' && (sp.name.includes('rowlet') || sp.name.includes('litten') || sp.name.includes('popplio'))) {
    console.log(`Debug: ${sp.name} - baseGen: ${baseGen}, enhancedGen: ${gen}, generation: ${sp.generation}`);
  }
  
  return {
    id,
    name,
    gen,
    types,
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
  };
}

async function getSpeciesSummary(
  id: number,
  speciesCache: Map<number, { name: string; generation: string | null }>,
  pokemonCache: Map<number, { types: string[] }>
): Promise<Species> {
  let sp = speciesCache.get(id);
  if (!sp) {
    sp = await getMinimalSpeciesData(id);
    speciesCache.set(id, sp);
  }
  
  // Only fetch minimal Pokemon data for types - avoid full Pokemon fetch
  let types: string[] = [];
  if (!pokemonCache.has(id)) {
    const minimalData = await getMinimalPokemonData(id);
    types = minimalData.types;
    pokemonCache.set(id, minimalData);
  } else {
    const cached = pokemonCache.get(id);
    types = cached?.types || [];
  }

  const name = sp.name.replace(/-/g, ' ');
  const gen = generationNumber(sp.generation);
  return {
    id,
    name,
    gen: gen ?? 0,
    types,
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
  };
}

function generationNumber(name?: string | null): number | null {
  if (!name) return null;
  // Match the full generation string and prefer longer numerals first to avoid partial matches (e.g., 'v' in 'vii')
  const m = name.match(/^generation-(ix|viii|vii|vi|iv|iii|ii|i)$/);
  if (!m) return null;
  const roman = m[1];
  const map: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9 };
  return map[roman] ?? null;
}

// Enhanced generation mapping for Pokemon with regional forms or cross-generational evolution
const ENHANCED_GENERATION_MAP: Record<string, number> = {
  // Gen 8 Pokemon (Galar region)
  'perrserker': 8,
  'kleavor': 8,
  'sneasler': 8,
  'overqwil': 8,
  'ursaluna': 8,
  'basculegion': 8,
  'enamorus': 8,
  'wyrdeer': 8,
  'hisuian-growlithe': 8,
  'hisuian-arcanine': 8,
  'hisuian-voltorb': 8,
  'hisuian-electrode': 8,
  'hisuian-typhlosion': 8,
  'hisuian-qwilfish': 8,
  'hisuian-sneasel': 8,
  'hisuian-samurott': 8,
  'hisuian-lilligant': 8,
  'hisuian-basculin': 8,
  'hisuian-zorua': 8,
  'hisuian-zoroark': 8,
  'hisuian-braviary': 8,
  'hisuian-sliggoo': 8,
  'hisuian-goodra': 8,
  'hisuian-avalugg': 8,
  'hisuian-decidueye': 8,
  'galarian-meowth': 8,
  'galarian-ponyta': 8,
  'galarian-rapidash': 8,
  'galarian-slowpoke': 8,
  'galarian-slowbro': 8,
  'galarian-farfetchd': 8,
  'galarian-weezing': 8,
  'galarian-mr-mime': 8,
  'galarian-articuno': 8,
  'galarian-zapdos': 8,
  'galarian-moltres': 8,
  'galarian-slowking': 8,
  'galarian-corsola': 8,
  'galarian-zigzagoon': 8,
  'galarian-linoone': 8,
  'galarian-darumaka': 8,
  'galarian-darmanitan': 8,
  'galarian-yamask': 8,
  'galarian-stunfisk': 8,
  
  // Gen 9 Pokemon (Paldea region)
  'sprigatito': 9,
  'floragato': 9,
  'meowscarada': 9,
  'fuecoco': 9,
  'crocalor': 9,
  'skeledirge': 9,
  'quaxly': 9,
  'quaxwell': 9,
  'quaquaval': 9,
  'lechonk': 9,
  'oinkologne': 9,
  'tarountula': 9,
  'spidops': 9,
  'nymble': 9,
  'lokix': 9,
  'pawmi': 9,
  'pawmo': 9,
  'pawmot': 9,
  'tandemaus': 9,
  'maushold': 9,
  'fidough': 9,
  'dachsbun': 9,
  'smoliv': 9,
  'dolliv': 9,
  'arboliva': 9,
  'squawkabilly': 9,
  'nacli': 9,
  'naclstack': 9,
  'garganacl': 9,
  'charcadet': 9,
  'armarouge': 9,
  'ceruledge': 9,
  'tadbulb': 9,
  'bellibolt': 9,
  'wattrel': 9,
  'kilowattrel': 9,
  'maschiff': 9,
  'mabosstiff': 9,
  'shroodle': 9,
  'grafaiai': 9,
  'bramblin': 9,
  'brambleghast': 9,
  'toedscool': 9,
  'toedscruel': 9,
  'klawf': 9,
  'capsakid': 9,
  'scovillain': 9,
  'rellor': 9,
  'rabsca': 9,
  'flittle': 9,
  'espathra': 9,
  'tinkatink': 9,
  'tinkatuff': 9,
  'tinkaton': 9,
  'wiglett': 9,
  'wugtrio': 9,
  'bombirdier': 9,
  'finizen': 9,
  'palafin': 9,
  'varoom': 9,
  'revavroom': 9,
  'cyclizar': 9,
  'orthworm': 9,
  'glimmet': 9,
  'glimmora': 9,
  'greavard': 9,
  'houndstone': 9,
  'flamigo': 9,
  'cetoddle': 9,
  'cetitan': 9,
  'veluza': 9,
  'dondozo': 9,
  'tatsugiri': 9,
  'annihilape': 9,
  'clodsire': 9,
  'farigiraf': 9,
  'dudunsparce': 9,
  'kingambit': 9,
  'great-tusk': 9,
  'scream-tail': 9,
  'brute-bonnet': 9,
  'flutter-mane': 9,
  'slither-wing': 9,
  'sandy-shocks': 9,
  'iron-treads': 9,
  'iron-bundle': 9,
  'iron-hands': 9,
  'iron-jugulis': 9,
  'iron-moth': 9,
  'iron-thorns': 9,
  'frigibax': 9,
  'arctibax': 9,
  'baxcalibur': 9,
  'gimmighoul': 9,
  'gholdengo': 9,
  'wo-chien': 9,
  'chien-pao': 9,
  'ting-lu': 9,
  'chi-yu': 9,
  'roaring-moon': 9,
  'iron-valiant': 9,
  'koraidon': 9,
  'miraidon': 9,
  'walking-wake': 9,
  'iron-leaves': 9,
  'dipplin': 9,
  'poltchageist': 9,
  'sinistcha': 9,
  'okidogi': 9,
  'munkidori': 9,
  'fezandipiti': 9,
  'ogerpon': 9,
  'archaludon': 9,
  'hydrapple': 9,
  'gouging-fire': 9,
  'raging-bolt': 9,
  'iron-boulder': 9,
  'iron-crown': 9,
  'terapagos': 9,
  'pecharunt': 9,
};

function getEnhancedGeneration(pokemonName: string, baseGeneration: number): number {
  const normalizedName = pokemonName.toLowerCase().replace(/\s+/g, '-');
  return ENHANCED_GENERATION_MAP[normalizedName] || baseGeneration;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mapMethod(detail?: EvolutionChain['chain']['evolves_to'][number]['evolution_details'][number]): Method {
  if (!detail) return { kind: 'special', hint: 'Special' };
  const trigger = detail.trigger?.name;

  // Collect possible conditions for a rich description
  const parts: string[] = [];
  if (detail.min_level != null) parts.push(`Level ${detail.min_level}`);
  if (detail.item?.name) parts.push(`${formatName(detail.item.name)}`);
  if (trigger === 'trade') parts.push('Trade');
  if (detail.held_item?.name) parts.push(`Hold ${formatName(detail.held_item.name)}`);
  if (detail.min_happiness != null) parts.push('High Friendship');
  if (detail.min_affection != null) parts.push('High Affection');
  if (detail.min_beauty != null) parts.push('High Beauty');
  if (detail.location?.name) parts.push(`At ${formatName(detail.location.name)}`);
  if (detail.known_move?.name) parts.push(`Know ${formatName(detail.known_move.name)}`);
  if (detail.known_move_type?.name) parts.push(`Know ${formatName(detail.known_move_type.name)}-type Move`);
  if (detail.party_species?.name) parts.push(`With ${formatName(detail.party_species.name)} in party`);
  if (detail.party_type?.name) parts.push(`With ${formatName(detail.party_type.name)}-type in party`);
  if (detail.time_of_day) parts.push(detail.time_of_day === 'day' ? 'Daytime' : 'Nighttime');
  if (detail.gender != null) parts.push(detail.gender === 1 ? 'Female' : detail.gender === 2 ? 'Male' : 'Gendered');
  if (detail.needs_overworld_rain) parts.push('While Raining');
  if (detail.trade_species?.name) parts.push(`Trade for ${formatName(detail.trade_species.name)}`);
  if (detail.turn_upside_down) parts.push('Hold device upside down');
  if (detail.relative_physical_stats != null) {
    parts.push(
      detail.relative_physical_stats > 0
        ? 'Atk > Def'
        : detail.relative_physical_stats < 0
        ? 'Atk < Def'
        : 'Atk = Def'
    );
  }

  // Prefer specific kinds when singular/simple; otherwise return a composed special hint.
  if (detail.min_level != null && parts.length === 1) return { kind: 'level', level: detail.min_level };
  if (detail.item?.name && parts.length === (trigger === 'trade' ? 2 : 1)) return { kind: 'stone', item: formatName(detail.item.name) };
  if (trigger === 'trade' && !detail.trade_species?.name && parts.length <= 2) {
    return detail.held_item?.name ? { kind: 'trade', item: formatName(detail.held_item.name) } : { kind: 'trade' };
  }
  if (detail.min_happiness != null && parts.length <= 2) {
    return detail.time_of_day ? { kind: 'friendship', time: detail.time_of_day as any } : { kind: 'friendship' };
  }
  if (detail.location?.name && parts.length === 1) return { kind: 'location', place: formatName(detail.location.name) };
  if (detail.held_item?.name && parts.length === 1) return { kind: 'heldItem', item: formatName(detail.held_item.name) };
  if (detail.known_move?.name && parts.length === 1) return { kind: 'move', move: formatName(detail.known_move.name) };
  if (detail.time_of_day && parts.length === 1) return { kind: 'time', time: detail.time_of_day as any };

  // Complex or multi-condition — return a composed special description
  const hint = parts.join(' + ').replace(/\s+/g, ' ').trim() || formatName(trigger || 'special');
  return { kind: 'special', hint };
}

function formatName(s?: string | null) {
  if (!s) return '';
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
