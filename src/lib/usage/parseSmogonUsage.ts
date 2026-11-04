import type { Format, Generation, Platform, UsageRow } from '@/types/usage';
import { dexIdForSpecies } from './species';

type UsageMonth = `${number}-${number}`;

/**
 * National dex number for a Smogon species name (base species for formes such as
 * "Landorus-Therian"); 0 when the name is unknown. Previously unknown names were hashed into
 * a pseudo-random id, which showed the wrong Pokémon's image.
 */
export function inferPokemonId(name: string): number {
  return dexIdForSpecies(name);
}

/** Header stats of a Smogon usage file ("Total battles: N", "Avg. weight/team: X"). */
export function parseSmogonUsageHeader(text: string): { totalBattles?: number; avgWeightPerTeam?: number } {
  const battles = text.match(/Total battles:\s*(\d+)/i);
  const weight = text.match(/Avg\. weight\/team:\s*([\d.]+)/i);
  return {
    totalBattles: battles ? Number.parseInt(battles[1], 10) : undefined,
    avgWeightPerTeam: weight ? Number.parseFloat(weight[1]) : undefined,
  };
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
