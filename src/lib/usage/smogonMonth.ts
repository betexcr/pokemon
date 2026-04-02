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
