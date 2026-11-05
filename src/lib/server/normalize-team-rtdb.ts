/**
 * Server-safe team normalization for RTDB battle creation.
 * Always hydrates base stats from absolute PokeAPI — never trusts client stats/maxHp.
 */

import { sanitizeBattleItem } from '../battle-items-catalog';
import { maxHpFor, sanitizeEvs } from '../battle-evs';
import { resolveTeraType } from '../team-battle-tera';

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

      // EVs from the team builder (sanitized: 252 per stat, 510 total); IVs are 31
      const evs = sanitizeEvs(slot.evs);
      const maxHp = maxHpFor(stats as Parameters<typeof maxHpFor>[0], level, evs);
      const currentHp = maxHp;
      const gender = slot.gender === 'male' || slot.gender === 'female' || slot.gender === 'genderless' ? slot.gender : undefined;

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
        // Chosen in the team builder, else the species' primary type
        ...(resolveTeraType(slot.teraType, types) ? { teraType: resolveTeraType(slot.teraType, types) } : {}),
        // Only engine-supported items reach battle snapshots
        ...(sanitizeBattleItem(slot.item ?? slot.heldItem) ? { heldItem: sanitizeBattleItem(slot.item ?? slot.heldItem) } : {}),
        ...(evs ? { evs } : {}),
        ...(gender ? { gender } : {}),
        statModifiers: {},
        status: null,
        originalIndex: index,
      };
    })
  );
}

/** @internal exported for tests */
export const __test__ = { POKEAPI_ABSOLUTE, clampLevel, sanitizeNature, ALLOWED_NATURES };
