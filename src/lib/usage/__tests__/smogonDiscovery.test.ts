import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchSmogonIndexFilenames } from '../smogonDiscovery';

describe('fetchSmogonIndexFilenames', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('retries once when first response is not ok', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response('<a href="gen9uu-0.txt">x</a>', { status: 200 })) as typeof fetch;

    const names = await fetchSmogonIndexFilenames('2030-06');
    expect(names).toContain('gen9uu-0.txt');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
