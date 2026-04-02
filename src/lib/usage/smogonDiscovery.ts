import { smogonStatsMonthPath } from './smogonMonth';

export const SMOGON_STATS_BASE = 'https://www.smogon.com/stats';

const indexCache = new Map<string, { expires: number; filenames: string[] }>();
const INDEX_TTL_MS = 1000 * 60 * 15;

/**
 * Lists bare filenames (e.g. gen9ou-0.txt) for a stats month directory.
 * Parses Apache-style index HTML from Smogon.
 */
export async function fetchSmogonIndexFilenames(month: string): Promise<string[]> {
  const pathMonth = smogonStatsMonthPath(month);
  const cacheKey = pathMonth;
  const hit = indexCache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return hit.filenames;

  const url = `${SMOGON_STATS_BASE}/${pathMonth}/`;
  let res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    await new Promise((r) => setTimeout(r, 350));
    res = await fetch(url, { next: { revalidate: 3600 } });
  }
  if (!res.ok) {
    indexCache.set(cacheKey, { expires: Date.now() + 60_000, filenames: [] });
    return [];
  }
  const html = await res.text();
  const names = new Set<string>();
  const re = /href="([^"]+\.txt)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const name = m[1];
    if (name.includes('/')) continue;
    if (name.endsWith('.gz')) continue;
    names.add(name);
  }
  const filenames = [...names];
  indexCache.set(cacheKey, { expires: Date.now() + INDEX_TTL_MS, filenames });
  return filenames;
}

/** Usage-weighted combined stats use the -0.txt suffix (not 1500/1630/1760). */
export function filterCombinedUsageFiles(filenames: string[]): string[] {
  return filenames.filter((f) => /-0\.txt$/i.test(f) && !/-(1500|1630|1760)-0\.txt$/i.test(f));
}
