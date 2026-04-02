import type { Format, Generation, Platform } from '@/types/usage';
import { SMOGON_STATS_BASE, fetchSmogonIndexFilenames, filterCombinedUsageFiles } from './smogonDiscovery';
import { normalizeUsageMonth, smogonStatsMonthPath } from './smogonMonth';
import { probeSmogonUsageFileExists } from './smogonProbe';

export type SmogonFormatKind = 'singles' | 'vgc' | 'bss';

export interface ResolvedSmogonStem {
  /** Filename without path, e.g. gen9ou-0.txt */
  filename: string;
  /** Stem used in URLs before -0.txt, e.g. gen9ou */
  stem: string;
  kind: SmogonFormatKind;
}

const VGC_REG_LETTER: Partial<Record<Format, string>> = {
  VGC_REG_A: 'a',
  VGC_REG_B: 'b',
  VGC_REG_C: 'c',
  VGC_REG_D: 'd',
  VGC_REG_E: 'e',
  VGC_REG_F: 'f',
  VGC_REG_G: 'g',
  VGC_REG_H: 'h',
  VGC_REG_I: 'i',
};

const BSS_REG_LETTER: Partial<Record<Format, string>> = {
  BSS_REG_C: 'c',
  BSS_REG_D: 'd',
  BSS_REG_E: 'e',
  BSS_REG_I: 'i',
};

function genNum(generation: Generation): number {
  return Number.parseInt(generation.replace('GEN', ''), 10);
}

function monthYear(month: string): number {
  const m = normalizeUsageMonth(month).match(/^(\d{4})-/);
  return m ? Number.parseInt(m[1], 10) : new Date().getFullYear();
}

/**
 * Pick VGC file from index: gen{N}vgc{YYYY}reg{L}[-bo3]-0.txt
 * Prefer non-bo3; prefer year matching usage month, then previous year.
 */
function pickVgcFromIndex(
  files: string[],
  generation: Generation,
  format: Format,
  month: string
): ResolvedSmogonStem | null {
  const g = genNum(generation);
  const letter = VGC_REG_LETTER[format];
  if (!letter) return null;

  const y = monthYear(month);
  const years = [y, y - 1, y - 2];
  const candidates = files.filter((name) => {
    const re = new RegExp(`^gen${g}vgc(\\d{4})reg${letter}(?:-bo3)?-0\\.txt$`, 'i');
    return re.test(name);
  });
  if (candidates.length === 0) return null;

  const score = (name: string): number => {
    const m = name.match(new RegExp(`^gen${g}vgc(\\d{4})reg${letter}(?:-(bo3))?-0\\.txt$`, 'i'));
    if (!m) return -Infinity;
    const fileYear = Number.parseInt(m[1], 10);
    const yearIdx = years.indexOf(fileYear);
    const base = yearIdx >= 0 ? 100 - yearIdx * 10 : 0;
    const bo3Penalty = name.toLowerCase().includes('bo3') ? -5 : 0;
    return base + bo3Penalty;
  };

  candidates.sort((a, b) => score(b) - score(a));
  const best = candidates[0];
  const stem = best.replace(/-0\.txt$/i, '');
  return { filename: best, stem, kind: 'vgc' };
}

/**
 * Pick BSS regulation file: gen{N}bssreg{L}-0.txt
 */
function pickBssRegFromIndex(
  files: string[],
  generation: Generation,
  format: Format
): ResolvedSmogonStem | null {
  const g = genNum(generation);
  const letter = BSS_REG_LETTER[format];
  if (!letter) return null;

  const re = new RegExp(`^gen${g}bssreg${letter}-0\\.txt$`, 'i');
  const hit = files.find((name) => re.test(name));
  if (!hit) return null;
  const stem = hit.replace(/-0\.txt$/i, '');
  return { filename: hit, stem, kind: 'bss' };
}

/**
 * Battle Stadium Singles (Gen 8): gen8battlestadiumsingles-0.txt
 */
function pickBattleStadiumSinglesGen8(files: string[]): ResolvedSmogonStem | null {
  const hit = files.find((name) => /^gen8battlestadiumsingles-0\.txt$/i.test(name));
  if (!hit) return null;
  const stem = hit.replace(/-0\.txt$/i, '');
  return { filename: hit, stem, kind: 'bss' };
}

/**
 * Heuristic series → regulation file for Gen 9 (Smogon naming varies by season).
 * Series 12 / 13 aligned with common Reg G / Reg H BSS dumps in recent indices.
 */
function pickBssSeriesGen9(
  files: string[],
  format: Format
): ResolvedSmogonStem | null {
  if (format === 'BSS_SERIES_12') {
    return pickFromStem(files, 'gen9bssregg');
  }
  if (format === 'BSS_SERIES_13') {
    return pickFromStem(files, 'gen9bssregh');
  }
  return null;
}

function pickFromStem(files: string[], stemPrefix: string): ResolvedSmogonStem | null {
  const name = `${stemPrefix}-0.txt`;
  const hit = files.find((f) => f.toLowerCase() === name.toLowerCase());
  if (!hit) return null;
  return { filename: hit, stem: stemPrefix, kind: 'bss' };
}

function pickSinglesStem(files: string[], generation: Generation, format: Format): ResolvedSmogonStem | null {
  const g = genNum(generation);
  const tier = format.toLowerCase();
  const expected = `gen${g}${tier}-0.txt`;
  const hit = files.find((name) => name.toLowerCase() === expected.toLowerCase());
  if (!hit) return null;
  const stem = `gen${g}${tier}`;
  return { filename: hit, stem, kind: 'singles' };
}

/**
 * When the monthly index is empty or unreachable, try conventional filenames with HEAD probes.
 * Mirrors pick order in pickVgcFromIndex / singles / BSS helpers.
 */
function buildStaticCandidateFilenames(
  platform: Platform,
  generation: Generation,
  format: Format,
  monthNorm: string
): string[] {
  const g = genNum(generation);
  const y = monthYear(monthNorm);
  const years = [y, y - 1, y - 2];

  if (platform === 'SMOGON_SINGLES') {
    const tier = format.toLowerCase();
    return [`gen${g}${tier}-0.txt`];
  }

  if (platform === 'VGC_OFFICIAL') {
    const letter = VGC_REG_LETTER[format];
    if (!letter) return [];
    const out: string[] = [];
    for (const year of years) {
      out.push(`gen${g}vgc${year}reg${letter}-0.txt`);
      out.push(`gen${g}vgc${year}reg${letter}-bo3-0.txt`);
    }
    return out;
  }

  if (platform === 'BSS_OFFICIAL') {
    if (format.startsWith('BSS_REG_')) {
      const letter = BSS_REG_LETTER[format];
      if (!letter) return [];
      return [`gen${g}bssreg${letter}-0.txt`];
    }
    if (generation === 'GEN8' && (format === 'BSS_SERIES_8' || format === 'BSS_SERIES_9')) {
      return ['gen8battlestadiumsingles-0.txt'];
    }
    if (generation === 'GEN9' && format === 'BSS_SERIES_12') return ['gen9bssregg-0.txt'];
    if (generation === 'GEN9' && format === 'BSS_SERIES_13') return ['gen9bssregh-0.txt'];
  }

  return [];
}

/** Used when `fetchSmogonIndexFilenames` returns no combined `-0.txt` rows (index HTML change or outage). */
async function tryResolveViaStaticHead(
  platform: Platform,
  generation: Generation,
  format: Format,
  monthNorm: string
): Promise<ResolvedSmogonStem | null> {
  const candidates = buildStaticCandidateFilenames(platform, generation, format, monthNorm);
  const pathMonth = smogonStatsMonthPath(monthNorm);
  const base = `${SMOGON_STATS_BASE}/${pathMonth}`;

  for (const filename of candidates) {
    const url = `${base}/${filename}`;
    if (await probeSmogonUsageFileExists(url)) {
      const stem = filename.replace(/-0\.txt$/i, '');
      const kind: SmogonFormatKind =
        platform === 'SMOGON_SINGLES' ? 'singles' : platform === 'VGC_OFFICIAL' ? 'vgc' : 'bss';
      return { filename, stem, kind };
    }
  }
  return null;
}

/**
 * Resolve which Smogon combined-usage file to load for the given filters.
 * Uses the monthly index when possible so renames (e.g. vgc year) stay discoverable.
 * If the index lists no files, falls back to HEAD checks on conventional paths.
 */
export async function resolveSmogonUsageFile(
  platform: Platform,
  generation: Generation,
  format: Format,
  month: string
): Promise<ResolvedSmogonStem | null> {
  if (platform === 'OTHER') return null;

  const monthNorm = normalizeUsageMonth(month);
  const files = filterCombinedUsageFiles(await fetchSmogonIndexFilenames(monthNorm));

  if (files.length > 0) {
    if (platform === 'SMOGON_SINGLES') {
      return pickSinglesStem(files, generation, format);
    }
    if (platform === 'VGC_OFFICIAL') {
      return pickVgcFromIndex(files, generation, format, monthNorm);
    }
    if (platform === 'BSS_OFFICIAL') {
      if (format.startsWith('BSS_REG_')) {
        return pickBssRegFromIndex(files, generation, format);
      }
      if (generation === 'GEN8' && (format === 'BSS_SERIES_8' || format === 'BSS_SERIES_9')) {
        return pickBattleStadiumSinglesGen8(files);
      }
      if (generation === 'GEN9' && (format === 'BSS_SERIES_12' || format === 'BSS_SERIES_13')) {
        return pickBssSeriesGen9(files, format);
      }
    }
    return null;
  }

  return tryResolveViaStaticHead(platform, generation, format, monthNorm);
}
