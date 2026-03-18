/**
 * Optional GraphQL client for PokeAPI v2 GraphQL beta endpoint.
 *
 * Falls back to the REST API when GraphQL is unavailable or disabled.
 * Enable by setting NEXT_PUBLIC_USE_GRAPHQL=true in environment.
 */

const GRAPHQL_ENDPOINT = 'https://beta.pokeapi.co/graphql/v1beta';

export const graphqlEnabled =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_USE_GRAPHQL === 'true';

type GqlResult<T> = { data: T } | { errors: { message: string }[] };

export async function gqlQuery<T = any>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status}`);
  }

  const json: GqlResult<T> = await res.json();
  if ('errors' in json) {
    throw new Error(json.errors.map(e => e.message).join(', '));
  }
  return json.data;
}

// Pre-built queries for common use cases

export const POKEMON_WITH_EVOLUTION_QUERY = `
  query PokemonWithEvolution($id: Int!) {
    pokemon_v2_pokemon(where: {id: {_eq: $id}}) {
      id
      name
      height
      weight
      pokemon_v2_pokemontypes {
        pokemon_v2_type { name }
      }
      pokemon_v2_pokemonstats {
        base_stat
        pokemon_v2_stat { name }
      }
      pokemon_v2_pokemonabilities {
        is_hidden
        pokemon_v2_ability { name }
      }
      pokemon_v2_pokemonspecy {
        pokemon_v2_evolutionchain {
          pokemon_v2_pokemonspecies(order_by: {order: asc}) {
            id
            name
            order
            evolves_from_species_id
          }
        }
      }
    }
  }
`;

export const POKEMON_MOVES_QUERY = `
  query PokemonMoves($id: Int!, $versionGroupId: Int!) {
    pokemon_v2_pokemonmove(
      where: {
        pokemon_id: {_eq: $id},
        version_group_id: {_eq: $versionGroupId}
      }
    ) {
      level
      pokemon_v2_movelearnmethod { name }
      pokemon_v2_move {
        name
        power
        accuracy
        pp
        pokemon_v2_type { name }
        pokemon_v2_movedamageclass { name }
      }
    }
  }
`;

export const SPECIES_SEARCH_QUERY = `
  query SpeciesSearch($term: String!) {
    pokemon_v2_pokemonspecies(
      where: {name: {_ilike: $term}},
      limit: 20,
      order_by: {id: asc}
    ) {
      id
      name
      pokemon_v2_pokemons(limit: 1) {
        pokemon_v2_pokemontypes {
          pokemon_v2_type { name }
        }
      }
    }
  }
`;

/**
 * Fetch a Pokemon with its full evolution chain in a single GraphQL request.
 * Falls back to null if GraphQL is disabled or fails.
 */
export async function fetchPokemonWithEvolution(id: number) {
  if (!graphqlEnabled) return null;

  try {
    const data = await gqlQuery<{
      pokemon_v2_pokemon: Array<{
        id: number;
        name: string;
        height: number;
        weight: number;
        pokemon_v2_pokemontypes: Array<{ pokemon_v2_type: { name: string } }>;
        pokemon_v2_pokemonstats: Array<{ base_stat: number; pokemon_v2_stat: { name: string } }>;
        pokemon_v2_pokemonabilities: Array<{ is_hidden: boolean; pokemon_v2_ability: { name: string } }>;
        pokemon_v2_pokemonspecy: {
          pokemon_v2_evolutionchain: {
            pokemon_v2_pokemonspecies: Array<{
              id: number;
              name: string;
              order: number;
              evolves_from_species_id: number | null;
            }>;
          };
        };
      }>;
    }>(POKEMON_WITH_EVOLUTION_QUERY, { id });

    return data.pokemon_v2_pokemon[0] ?? null;
  } catch (err) {
    console.warn('GraphQL fetch failed, falling back to REST:', err);
    return null;
  }
}
