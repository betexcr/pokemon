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

// Simple in-memory cache for moves
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
    moveCache.set(key, move);
    return move;
  } catch (error) {
    console.error(`Failed to load move ${idOrName}:`, error);
    throw error;
  }
}

export function clearMoveCache(): void {
  moveCache.clear();
}

export function getCachedMoveCount(): number {
  return moveCache.size;
}

// Preload common moves for better performance
export async function preloadCommonMoves(): Promise<void> {
  const commonMoves = [
    'tackle', 'scratch', 'growl', 'leer', 'smokescreen', 'thunderbolt', 'flamethrower',
    'ice-beam', 'surf', 'earthquake', 'psychic', 'shadow-ball', 'dragon-pulse',
    'dark-pulse', 'flash-cannon', 'dazzling-gleam', 'close-combat', 'stone-edge',
    'iron-head', 'play-rough', 'sludge-bomb', 'energy-ball', 'thunder', 'fire-blast',
    'blizzard', 'hydro-pump', 'solar-beam', 'hyper-beam', 'giga-impact'
  ];
  
  console.log('Preloading common moves...');
  const promises = commonMoves.map(move => 
    getMove(move).catch(err => {
      console.warn(`Failed to preload move ${move}:`, err);
    })
  );
  
  await Promise.allSettled(promises);
  console.log(`Preloaded ${getCachedMoveCount()} moves`);
}
