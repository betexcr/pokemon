import type { UsageRow, UsageSubstats } from '@/types/usage';
import { smogonStatsMonthPath } from './smogonMonth';
import { SMOGON_STATS_BASE } from './smogonDiscovery';

const SECTION_TITLE =
  /^(Moves|Items|Abilities|Spreads|Tera Types|Teammates|Checks and Counters|Raw count|Avg\. weight|Viability Ceiling)/i;

/** Next Pokémon block begins with Raw count under the name header (Smogon moveset dump layout). */
const NEXT_POKEMON_BLOCK =
  /\n\s*\+----------------------------------------\+\s*\n\s*\|\s*([^\n|]+?)\s*\|\s*\n\s*\+----------------------------------------\+\s*\n\s*\|\s*Raw count/g;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract one Pokémon's moveset sub-block from a full Smogon combined moveset file.
 */
export function extractPokemonMovesetBlock(fullText: string, pokemonName: string): string | null {
  const nameRe = new RegExp(
    `\\|\\s*${escapeRegExp(pokemonName).replace(/\s+/g, '\\s+')}\\s*\\|`,
    'i'
  );
  const match = fullText.match(nameRe);
  if (!match || match.index === undefined) return null;

  const headerIdx = match.index;
  const before = fullText.slice(0, headerIdx);
  const blockStart = before.lastIndexOf('+----------------------------------------+');
  if (blockStart < 0) return null;

  NEXT_POKEMON_BLOCK.lastIndex = headerIdx + match[0].length;
  const next = NEXT_POKEMON_BLOCK.exec(fullText);
  const blockEnd = next ? next.index : fullText.length;
  return fullText.slice(blockStart, blockEnd);
}

function parseSectionLines(block: string, title: string): string[] {
  const idx = block.search(new RegExp(`\\|\\s*${escapeRegExp(title)}\\s*\\|`, 'i'));
  if (idx < 0) return [];
  const afterHeader = block.slice(idx).split('\n').slice(1);
  const lines: string[] = [];
  for (const line of afterHeader) {
    const t = line.trim();
    if (/^\+---/.test(t)) break;
    const inner = t.replace(/^\|\s*/, '').replace(/\s*\|\s*$/, '').trim();
    if (/^\|\s/.test(line.trim()) && !/[\d.]+%/.test(t) && SECTION_TITLE.test(inner)) {
      break;
    }
    lines.push(line);
  }
  return lines;
}

function parsePctLines(lines: string[]): { name: string; pct: number }[] {
  const items: { name: string; pct: number }[] = [];
  for (const line of lines) {
    const t = line.trim();
    const m = t.match(/^\|\s*(.+?)\s+([\d.]+)%\s*\|/);
    if (!m) continue;
    const name = m[1].trim();
    if (/^Other$/i.test(name)) continue;
    const pct = Number.parseFloat(m[2]);
    if (!Number.isFinite(pct)) continue;
    items.push({ name, pct });
  }
  return items;
}

function parseSpreadLines(lines: string[]): UsageSubstats['spreads'] {
  const spreads: NonNullable<UsageSubstats['spreads']> = [];
  for (const line of lines) {
    const t = line.trim();
    const m = t.match(/^\|\s*([^|]+?)\s+([\d.]+)%\s*\|/);
    if (!m) continue;
    const raw = m[1].trim();
    if (/^Other$/i.test(raw)) continue;
    const pct = Number.parseFloat(m[2]);
    if (!Number.isFinite(pct)) continue;
    const colon = raw.indexOf(':');
    const nature = colon >= 0 ? raw.slice(0, colon).trim() : raw;
    const evs = colon >= 0 ? raw.slice(colon + 1).trim() : '';
    spreads.push({ nature, evs, pct });
  }
  return spreads.length ? spreads : undefined;
}

/**
 * Parse Smogon moveset combined dump (moveset/gen9ou-0.txt style) for one Pokémon.
 */
export function parseSmogonMovesetBlockForPokemon(fullText: string, pokemonName: string): UsageSubstats | undefined {
  const block = extractPokemonMovesetBlock(fullText, pokemonName);
  if (!block) return undefined;

  const substats: UsageSubstats = {};

  const moves = parsePctLines(parseSectionLines(block, 'Moves'));
  const items = parsePctLines(parseSectionLines(block, 'Items'));
  const abilities = parsePctLines(parseSectionLines(block, 'Abilities'));
  const teraTypes = parsePctLines(parseSectionLines(block, 'Tera Types'));
  const teammates = parsePctLines(parseSectionLines(block, 'Teammates'));
  const spreads = parseSpreadLines(parseSectionLines(block, 'Spreads'));

  if (moves.length) substats.moves = moves;
  if (items.length) substats.items = items;
  if (abilities.length) substats.abilities = abilities;
  if (teraTypes.length) substats.teraTypes = teraTypes;
  if (teammates.length) substats.teammates = teammates;
  if (spreads?.length) substats.spreads = spreads;

  return Object.keys(substats).length ? substats : undefined;
}

export async function fetchSmogonMovesetText(month: string, stem: string): Promise<string | null> {
  const pathMonth = smogonStatsMonthPath(month);
  const url = `${SMOGON_STATS_BASE}/${pathMonth}/moveset/${stem}-0.txt`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.text();
}

const SUBSTAT_TOP_K = 18;

/**
 * Attach moveset substats to the first `topK` rows (by rank) when the moveset dump exists.
 */
export async function enrichRowsWithMovesetSubstats(
  rows: UsageRow[],
  month: string,
  stem: string,
  topK: number = SUBSTAT_TOP_K
): Promise<UsageRow[]> {
  if (rows.length === 0) return rows;
  const sorted = [...rows].sort((a, b) => a.rank - b.rank);
  const head = sorted.slice(0, topK);
  const text = await fetchSmogonMovesetText(month, stem);
  if (!text) return rows;

  const byName = new Map<string, UsageSubstats | undefined>();
  for (const row of head) {
    if (byName.has(row.pokemonName)) continue;
    byName.set(row.pokemonName, parseSmogonMovesetBlockForPokemon(text, row.pokemonName));
  }

  return rows.map((row) => {
    const sub = byName.get(row.pokemonName);
    if (!sub) return row;
    return { ...row, substats: sub };
  });
}
