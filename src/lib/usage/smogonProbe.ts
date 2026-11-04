import { smogonFetch } from './smogonDiscovery';

/**
 * Cheap existence checks for Smogon combined usage files without downloading full bodies.
 */
export async function probeSmogonUsageFileExists(url: string): Promise<boolean> {
  try {
    const head = await smogonFetch(url, { method: 'HEAD', next: { revalidate: 3600 }, timeoutMs: 6_000 });
    if (head.ok) return true;
    if (head.status === 404) return false;
  } catch {
    // network error — try range GET below
  }

  try {
    const range = await smogonFetch(url, {
      headers: { Range: 'bytes=0-0' },
      next: { revalidate: 3600 },
      timeoutMs: 6_000,
    });
    return range.ok;
  } catch {
    return false;
  }
}
