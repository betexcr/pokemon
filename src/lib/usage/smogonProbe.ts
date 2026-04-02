/**
 * Cheap existence checks for Smogon combined usage files without downloading full bodies.
 */
export async function probeSmogonUsageFileExists(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, { method: 'HEAD', next: { revalidate: 3600 } });
    if (head.ok) return true;
    if (head.status === 404) return false;
  } catch {
    // network error — try range GET below
  }

  try {
    const range = await fetch(url, {
      headers: { Range: 'bytes=0-0' },
      next: { revalidate: 3600 },
    });
    return range.ok;
  } catch {
    return false;
  }
}
