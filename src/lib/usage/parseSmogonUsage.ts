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

  for (const line of lines) {
    const match = line.match(
      /\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*([\d.]+)%\s*\|\s*([\d.]+)\s*\|\s*[\d.]+%\s*\|\s*[\d.]+%\s*\|/
    );
    if (!match) continue;

    const rank = Number.parseInt(match[1], 10);
    if (!Number.isFinite(rank)) continue;

    const pokemonName = match[2].trim();
    const usagePercent = Number.parseFloat(match[3]);
    const sampleSize = Number.parseInt(match[4], 10);

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
