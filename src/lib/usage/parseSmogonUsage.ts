import type { Format, Generation, Platform, UsageRow } from '@/types/usage';

type UsageMonth = `${number}-${number}`;

const NAME_OVERRIDES: Record<string, number> = {
  'great-tusk': 984,
  'flutter-mane': 987,
  'iron-bundle': 991,
  'iron-valiant': 1006,
  'roaring-moon': 1005,
  'walking-wake': 1009,
  'raging-bolt': 1021,
  'iron-crown': 1023,
  'iron-boulder': 1022,
  'gouging-fire': 1020,
  'ting-lu': 1003,
  'chien-pao': 1002,
  'wo-chien': 1001,
  'chi-yu': 1004,
  'koraidon': 1007,
  'miraidon': 1008,
  'landorus-therian': 645,
  'tornadus-therian': 641,
  'thundurus-therian': 642,
  'enamorus-therian': 905,
};

function slugifyPokemonName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['.:%]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function inferPokemonId(name: string): number {
  const slug = slugifyPokemonName(name);
  if (NAME_OVERRIDES[slug]) return NAME_OVERRIDES[slug];
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return (hash % 1025) + 1;
}

function asUsageMonth(month: string): UsageMonth {
  const match = month.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return month as UsageMonth;
  return `${match[1]}-${match[2].padStart(2, '0')}` as UsageMonth;
}

export function parseSmogonUsageText(
  text: string,
  opts: {
    platform: Platform;
    generation: Generation;
    format: Format;
    month: string;
    sourceUrl: string;
    sourceLabel: string;
  }
): UsageRow[] {
  const rows: UsageRow[] = [];
  const lines = text.split('\n');

  // Smogon's combined usage tables look like:
  //  | Rank | Pokemon            | Usage %   | Raw    | %       | Real   | %       |
  //  | 1    | Great Tusk         | 31.32479% | 134557 | 28.032% | 106283 | 27.982% |
  // Parse by cells instead of a fixed-width regex so extra/missing trailing columns
  // (older dumps omit the Real columns) never make every row silently fail to match.
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    const cells = trimmed
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 4) continue;

    const [rankCell, nameCell, usageCell, rawCell] = cells;
    if (!/^\d+$/.test(rankCell)) continue; // skips the header row ("Rank")
    const usageMatch = usageCell.match(/^([\d.]+)%$/);
    if (!usageMatch || !nameCell) continue;

    const rank = Number.parseInt(rankCell, 10);
    const pokemonName = nameCell;
    const usagePercent = Number.parseFloat(usageMatch[1]);
    const sampleSize = /^\d+$/.test(rawCell) ? Number.parseInt(rawCell, 10) : Number.NaN;

    rows.push({
      pokemonId: inferPokemonId(pokemonName),
      pokemonName,
      month: asUsageMonth(opts.month),
      platform: opts.platform,
      generation: opts.generation,
      format: opts.format,
      usagePercent: Number.isFinite(usagePercent) ? usagePercent : 0,
      rank,
      sampleSize: Number.isFinite(sampleSize) ? sampleSize : undefined,
      source: {
        label: opts.sourceLabel,
        url: opts.sourceUrl,
        collectedAt: new Date().toISOString(),
      },
    });
  }

  return rows.sort((a, b) => a.rank - b.rank);
}
