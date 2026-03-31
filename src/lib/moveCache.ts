import { CompiledMove } from './adapters/pokeapiMoveAdapter';
import { loadMoveFromPokeAPI } from './adapters/pokeapiMoveAdapter';

function normalizeMoveIdentifier(idOrName: number | string): number | string {
  if (typeof idOrName === 'number') return idOrName;

  const trimmed = idOrName.trim();
  if (!trimmed) return '';

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const slug = trimmed
    .toLowerCase()
    .replace(/[\u2019']/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || trimmed.toLowerCase();
}

const MOVE_CACHE_MAX = 500;
const moveCache = new Map<string, CompiledMove>();

export async function getMove(idOrName: number | string): Promise<CompiledMove> {
  const normalized = normalizeMoveIdentifier(idOrName);
  const key = typeof normalized === 'number' ? String(normalized) : normalized;

  if (!key && key !== '0') {
    throw new Error(`Invalid move identifier: ${idOrName}`);
  }

  if (moveCache.has(key)) {
    return moveCache.get(key)!;
  }

  try {
    const move = await loadMoveFromPokeAPI(normalized);
    if (moveCache.size >= MOVE_CACHE_MAX) {
      const oldest = moveCache.keys().next().value;
      if (oldest !== undefined) moveCache.delete(oldest);
    }
    moveCache.set(key, move);
    return move;
  } catch (error) {
    console.error(`Failed to load move ${idOrName}:`, error);
    throw error;
  }
}

export function getCachedMove(idOrName: number | string): CompiledMove | undefined {
  const normalized = normalizeMoveIdentifier(idOrName);
  const key = typeof normalized === 'number' ? String(normalized) : normalized;
  return moveCache.get(key);
}

