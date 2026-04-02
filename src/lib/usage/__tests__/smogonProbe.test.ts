import { describe, it, expect, vi, afterEach } from 'vitest';
import { probeSmogonUsageFileExists } from '../smogonProbe';

describe('probeSmogonUsageFileExists', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns true on HEAD 200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 })) as typeof fetch;
    await expect(probeSmogonUsageFileExists('https://www.smogon.com/stats/2025-01/gen9ou-0.txt')).resolves.toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://www.smogon.com/stats/2025-01/gen9ou-0.txt',
      expect.objectContaining({ method: 'HEAD' })
    );
  });

  it('falls back to Range GET when HEAD is not ok', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 405 }))
      .mockResolvedValueOnce(new Response('x', { status: 206 })) as typeof fetch;
    await expect(probeSmogonUsageFileExists('https://example.com/f.txt')).resolves.toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns false on HEAD 404 without Range fallback', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 })) as typeof fetch;
    await expect(probeSmogonUsageFileExists('https://example.com/missing.txt')).resolves.toBe(false);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
