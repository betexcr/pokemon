import { describe, it, expect, vi, beforeEach } from 'vitest';

// getPokemon is mocked; isPokemonNotFoundError is the real classifier
const getPokemon = vi.fn();
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, getPokemon: (...args: unknown[]) => getPokemon(...args) };
});

import { cacheUtils, sharedPokemonCache } from '../sharedPokemonCache';
import { isPokemonNotFoundError } from '../api';

const ivysaur = { id: 2, name: 'ivysaur', types: [] } as never;

describe('isPokemonNotFoundError', () => {
  it('treats PokeAPI 404 / 400 and out-of-range IDs as not found', () => {
    expect(isPokemonNotFoundError(new Error('Not Found (404): Pokemon with ID does not exist. URL: x'))).toBe(true);
    expect(isPokemonNotFoundError(new Error('Bad Request (400): Invalid Pokemon ID'))).toBe(true);
    expect(isPokemonNotFoundError(new Error('Pokemon with ID 99999 does not exist'))).toBe(true);
  });

  it('treats rate limits, server errors and timeouts as transient', () => {
    expect(isPokemonNotFoundError(new Error('HTTP error! status: 429'))).toBe(false);
    expect(isPokemonNotFoundError(new Error('API request failed: 503 - The Pokémon database is temporarily unavailable.'))).toBe(false);
    expect(isPokemonNotFoundError(new Error('The operation was aborted'))).toBe(false);
  });
});

describe('detail page cache (Ivysaur "Not Found" regression)', () => {
  beforeEach(() => {
    sharedPokemonCache.clear();
    getPokemon.mockReset();
  });

  it('a rate-limited preload does not make the Pokémon "not found" afterwards', async () => {
    // Opening Bulbasaur preloads its neighbours; #2 hits a rate limit
    getPokemon.mockRejectedValueOnce(new Error('HTTP error! status: 429'));
    await sharedPokemonCache.preloadPokemon([2]);
    expect(sharedPokemonCache.hasFailed(2)).toBe(false);

    // Visiting Ivysaur afterwards fetches again and succeeds
    getPokemon.mockResolvedValueOnce(ivysaur);
    await expect(cacheUtils.getOrFetchPokemon(2)).resolves.toBe(ivysaur);
  });

  it('a transient failure while rendering the page throws instead of returning "not found"', async () => {
    getPokemon.mockRejectedValueOnce(new Error('HTTP error! status: 429'));
    await expect(cacheUtils.getOrFetchPokemon(2)).rejects.toThrow('429');
    expect(sharedPokemonCache.hasFailed(2)).toBe(false);
  });

  it('a real 404 returns null (page shows Not Found) and is remembered', async () => {
    getPokemon.mockRejectedValueOnce(new Error('Not Found (404): Pokemon with ID does not exist. URL: x'));
    await expect(cacheUtils.getOrFetchPokemon(99999)).resolves.toBeNull();
    expect(sharedPokemonCache.hasFailed(99999)).toBe(true);
    // No refetch while remembered
    await expect(cacheUtils.getOrFetchPokemon(99999)).resolves.toBeNull();
    expect(getPokemon).toHaveBeenCalledTimes(1);
  });
});
