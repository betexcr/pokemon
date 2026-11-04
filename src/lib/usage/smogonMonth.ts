/**
 * Smogon stats URLs use month folders like /stats/2025-01/ (with a hyphen), not YYYYMM.
 */
export function normalizeUsageMonth(month: string): string {
  const match = month.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return month;
  const year = match[1];
  const mm = match[2].padStart(2, '0');
  return `${year}-${mm}`;
}

/** Path segment for https://www.smogon.com/stats/{smogonStatsMonthPath(month)}/ */
export function smogonStatsMonthPath(month: string): string {
  return normalizeUsageMonth(month);
}

function formatYearMonth(year: number, monthIndex0: number): string {
  const d = new Date(Date.UTC(year, monthIndex0, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Most recent month Smogon could have published. Stats for month M are only uploaded
 * after M ends (usually within the first days of M+1), so the current month never has data.
 */
export function latestPublishableUsageMonth(now: Date = new Date()): string {
  return formatYearMonth(now.getUTCFullYear(), now.getUTCMonth() - 1);
}

/** `count` consecutive months ending at `from` (inclusive), newest first. */
export function monthsBackFrom(from: string, count: number): string[] {
  const norm = normalizeUsageMonth(from);
  const m = norm.match(/^(\d{4})-(\d{2})$/);
  if (!m) return [];
  const year = Number.parseInt(m[1], 10);
  const month0 = Number.parseInt(m[2], 10) - 1;
  return Array.from({ length: Math.max(0, count) }, (_, i) => formatYearMonth(year, month0 - i));
}

/** Clamp a requested month to the latest publishable one (YYYY-MM strings compare lexically). */
export function clampToPublishableMonth(month: string, now: Date = new Date()): string {
  const norm = normalizeUsageMonth(month);
  const latest = latestPublishableUsageMonth(now);
  return norm > latest ? latest : norm;
}
