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

const POKEAPI_FETCH_OPTIONS: RequestInit = {
  headers: { 'Content-Type': 'application/json' },
  next: { revalidate: 86_400 },
} as RequestInit;

async function getBatchPokemonData(ids: number[], batchSize: number = 50): Promise<Map<number, { types: string[] }>> {
  const result = new Map<number, { types: string[] }>();

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (id) => {
        try {
          const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${id}`, POKEAPI_FETCH_OPTIONS);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          return { id, types: (data.types || []).map((t: any) => capitalize(t.type.name)) };
        } catch (error) {
          console.warn(`Failed to fetch Pokemon ${id}:`, error);
          return { id, types: [] as string[] };
        }
      })
    );
    batchResults.forEach(({ id, types }) => result.set(id, { types }));
  }

  return result;
}

async function getBatchSpeciesData(ids: number[], batchSize: number = 50): Promise<Map<number, { name: string; generation: string | null }>> {
  const result = new Map<number, { name: string; generation: string | null }>();

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (id) => {
        try {
          const response = await fetch(`${POKEAPI_BASE_URL}/pokemon-species/${id}`, POKEAPI_FETCH_OPTIONS);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          return { id, name: data.name || '', generation: data.generation?.name || null };
        } catch (error) {
          console.warn(`Failed to fetch species ${id}:`, error);
          return { id, name: '', generation: null };
        }
      })
    );
    batchResults.forEach(({ id, name, generation }) => result.set(id, { name, generation }));
  }

  return result;
}

type BuildOptions = {
  gens?: number[]; // If provided, only include families that contain species from these gens
  methods?: string[]; // If provided, only include families that contain evolutions using these methods
  offset?: number; // Offset for progressive paging
  limit?: number; // Page size for progressive paging
};

const CHAIN_FETCH_CONCURRENCY = 20;

export async function buildEvoGraph(options: BuildOptions = {}): Promise<NormalizedEvoGraph> {
  const { gens, methods, offset, limit } = options;

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

  const allPokemonIds = new Set<number>();
  const filteredChains: EvolutionChain[] = [];

  for (let i = 0; i < chainIds.length; i += CHAIN_FETCH_CONCURRENCY) {
    const batch = chainIds.slice(i, i + CHAIN_FETCH_CONCURRENCY);
    const settled = await Promise.allSettled(batch.map((id) => getEvolutionChain(id)));

    for (const result of settled) {
      if (result.status !== 'fulfilled') continue;
      const chain = result.value;

      if (methods && methods.length > 0) {
        const hasMatch = hasEvolutionMethod(chain.chain, methods) ||
          chain.chain.evolves_to.some((evo: any) => hasEvolutionMethod(evo, methods));
        if (!hasMatch) continue;
      }

      filteredChains.push(chain);
      for (const id of extractAllPokemonIds(chain)) allPokemonIds.add(id);
    }
  }

  const pokemonIds = Array.from(allPokemonIds);
  const [speciesCache, pokemonCache] = await Promise.all([
    getBatchSpeciesData(pokemonIds),
    getBatchPokemonData(pokemonIds),
  ]);

  const families: Family[] = [];
  for (const chain of filteredChains) {
    const { species: familySpecies, edges } = buildFamilyFromChainSync(chain, speciesCache, pokemonCache);

    if (gens && gens.length) {
      if (!familySpecies.some((s) => gens.includes(s.gen))) continue;
    }

    families.push({ familyId: String(chain.id), species: familySpecies, edges });
  }

  let finalFamilies = families;
  if (methods && methods.length > 0) {
    const methodSet = new Set(methods);
    finalFamilies = families.filter((f) => f.edges.some((e) => methodSet.has(e.method.kind)));
  }

  return normalizeEvoGraph({ families: finalFamilies } as EvoGraph);
}

async function listAllEvolutionChainIds(): Promise<number[]> {
  const url = `${POKEAPI_BASE_URL}/evolution-chain?limit=5000`;
  const res = await fetch(url, POKEAPI_FETCH_OPTIONS);
  if (!res.ok) throw new Error(`Failed to list evolution chains: ${res.status}`);
  const json = await res.json();
  const ids: number[] = (json.results as Array<{ url: string }>)
    .map((r) => extractId(r.url))
    .filter((n: number | null): n is number => Number.isFinite(n));
  return Array.from(new Set(ids)).sort((a, b) => a - b);
}

async function listSpeciesByGenerations(gens: number[]) {
  const allSpeciesIds: number[] = [];

  const genResults = await Promise.all(
    gens.map(async (g) => {
      const url = `${POKEAPI_BASE_URL}/generation/${g}`;
      const res = await fetch(url, POKEAPI_FETCH_OPTIONS);
      if (!res.ok) return [];
      const json = await res.json();
      return ((json.pokemon_species || []) as Array<{ name: string; url: string }>)
        .map((ref) => extractId(ref.url))
        .filter((id): id is number => id !== null);
    })
  );
  for (const ids of genResults) allSpeciesIds.push(...ids);

  const species: Awaited<ReturnType<typeof getPokemonSpecies>>[] = [];
  const batchSize = 25;
  for (let i = 0; i < allSpeciesIds.length; i += batchSize) {
    const batch = allSpeciesIds.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map((id) => getPokemonSpecies(id)));
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value) species.push(r.value);
    }
  }

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

function buildFamilyFromChainSync(
  chain: EvolutionChain,
  speciesCache: Map<number, { name: string; generation: string | null }>,
  pokemonCache: Map<number, { types: string[] }>
) {
  const speciesMap = new Map<number, Species>();
  const edges: Edge[] = [];

  function visit(node: EvolutionChainLink) {
    const id = node.species.url ? extractId(node.species.url) : null;
    if (!id) return;
    if (!speciesMap.has(id)) {
      speciesMap.set(id, getSpeciesSummarySync(id, speciesCache, pokemonCache));
    }
    for (const next of node.evolves_to) {
      const toId = next.species.url ? extractId(next.species.url) : null;
      if (!toId) continue;
      if (!speciesMap.has(toId)) {
        speciesMap.set(toId, getSpeciesSummarySync(toId, speciesCache, pokemonCache));
      }
      edges.push({ from: id, to: toId, method: mapMethod(next.evolution_details?.[0]) });
      visit(next);
    }
  }

  visit(chain.chain);
  return { species: Array.from(speciesMap.values()), edges };
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

  return {
    id,
    name,
    gen,
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
