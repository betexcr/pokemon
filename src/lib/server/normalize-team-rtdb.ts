/**
 * Server-safe team normalization for RTDB battle creation.
 * Always hydrates base stats from absolute PokeAPI — never trusts client stats/maxHp.
 */

const POKEAPI_ABSOLUTE = 'https://pokeapi.co/api/v2/pokemon';

const ALLOWED_NATURES = new Set([
  'hardy', 'lonely', 'brave', 'adamant', 'naughty', 'bold', 'docile', 'relaxed', 'impish', 'lax',
  'timid', 'hasty', 'serious', 'jolly', 'naive', 'modest', 'mild', 'quiet', 'bashful', 'rash',
  'calm', 'gentle', 'sassy', 'careful', 'quirky',
]);

const MOVE_ID_RE = /^[a-z0-9-]{1,64}$/;

function clampLevel(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : 50;
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(100, Math.floor(n)));
}

function sanitizeNature(raw: unknown): string {
  if (typeof raw === 'string' && ALLOWED_NATURES.has(raw.toLowerCase())) {
    return raw.toLowerCase();
  }
  return 'hardy';
}

function sanitizeMoveId(raw: unknown): string | null {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const id = String(raw).toLowerCase().trim().replace(/\s+/g, '-');
  if (!MOVE_ID_RE.test(id)) return null;
  return id;
}

async function fetchPokemon(idOrName: number | string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${POKEAPI_ABSOLUTE}/${idOrName}`);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export class TeamHydrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TeamHydrationError';
  }
}

export async function normalizeTeamForRTDB(
  teamData: unknown,
  options: { failOnMissingStats?: boolean } = { failOnMissingStats: true }
): Promise<Array<Record<string, unknown>>> {
  if (!teamData) return [];
  const slots = Array.isArray(teamData)
    ? teamData
    : typeof teamData === 'object' && teamData !== null && Array.isArray((teamData as { slots?: unknown }).slots)
      ? (teamData as { slots: unknown[] }).slots
      : typeof teamData === 'object' && teamData !== null && Array.isArray((teamData as { pokemon?: unknown }).pokemon)
        ? (teamData as { pokemon: unknown[] }).pokemon
        : [];

  if (!Array.isArray(slots) || slots.length === 0) {
    throw new TeamHydrationError('Team is empty or invalid');
  }

  const validSlots = slots.filter(
    (slot: unknown) =>
      slot &&
      typeof slot === 'object' &&
      ((slot as { id?: unknown }).id != null ||
        (slot as { species?: unknown }).species ||
        (slot as { name?: unknown }).name)
  );

  if (validSlots.length === 0) {
    throw new TeamHydrationError('No valid Pokémon slots in team');
  }

  return Promise.all(
    validSlots.map(async (slot: any, index: number) => {
      const id =
        typeof slot.id === 'number' ? slot.id : parseInt(String(slot.id ?? 0), 10) || index + 1;
      const species =
        typeof slot.species === 'string' ? slot.species : slot.name || `pokemon-${id}`;
      const level = clampLevel(slot.level);
      const nature = sanitizeNature(slot.nature);

      const moves = Array.isArray(slot.moves)
        ? slot.moves
            .map((move: any) => {
              if (typeof move === 'string') {
                const moveId = sanitizeMoveId(move);
                if (!moveId) return null;
                return { id: moveId, name: moveId, pp: 20, maxPp: 20 };
              }
              if (move && typeof move === 'object') {
                const moveId = sanitizeMoveId(move.name || move.id);
                if (!moveId) return null;
                return {
                  id: moveId,
                  name: moveId,
                  pp: typeof move.pp === 'number' && move.pp > 0 ? Math.min(move.pp, 64) : 20,
                  maxPp: typeof move.pp === 'number' && move.pp > 0 ? Math.min(move.pp, 64) : 20,
                };
              }
              return null;
            })
            .filter((m: any) => m && m.id)
            .slice(0, 4)
        : [];

      if (moves.length === 0) {
        throw new TeamHydrationError(`Pokémon ${species} has no valid moves`);
      }

      let stats: unknown[] = [];
      let rawTypes: unknown[] = [];
      let weight: number | null = null;
      let abilities: unknown[] = [];
      let resolvedName = species;

      if (id > 0) {
        const apiData = await fetchPokemon(id);
        if (apiData) {
          stats = (apiData.stats as unknown[]) || [];
          rawTypes = (apiData.types as unknown[]) || [];
          weight = typeof apiData.weight === 'number' ? apiData.weight : 500;
          abilities = (apiData.abilities as unknown[]) || [];
          resolvedName = (apiData.name as string) || species;
        }
      }

      if (stats.length === 0 && options.failOnMissingStats !== false) {
        throw new TeamHydrationError(`Failed to hydrate stats for ${species} (id=${id})`);
      }

      const types = rawTypes
        .map((t: any) => (typeof t === 'string' ? t : t?.type?.name || t?.name))
        .filter(Boolean);

      let maxHp: number;
      if (stats.length > 0) {
        const hpStat = stats.find((s: any) => s.stat?.name === 'hp' || s.name === 'hp') as
          | { base_stat?: number }
          | undefined;
        const baseHp = typeof hpStat?.base_stat === 'number' ? hpStat.base_stat : 50;
        maxHp = Math.floor(((2 * baseHp + 31) * level) / 100) + level + 10;
      } else {
        maxHp = Math.floor(((2 * 50 + 31) * level) / 100) + level + 10;
      }
      const currentHp = maxHp;

      return {
        pokemon: {
          id,
          name: resolvedName,
          types,
          stats,
          weight: weight ?? 500,
          abilities,
        },
        level,
        moves,
        currentHp,
        maxHp,
        nature,
        statModifiers: {},
        status: null,
        originalIndex: index,
      };
    })
  );
}

/** @internal exported for tests */
export const __test__ = { POKEAPI_ABSOLUTE, clampLevel, sanitizeNature, ALLOWED_NATURES };
