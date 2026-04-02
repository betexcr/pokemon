/** Normalized line for battle text UIs (multiplayer + offline). */
export type BattleLogDisplayLine = {
  message: string;
  isEngineWarning: boolean;
};

export function battleLogToDisplayLines(battleLog: unknown[] | undefined): BattleLogDisplayLine[] {
  if (!battleLog?.length) return [];
  const out: BattleLogDisplayLine[] = [];
  for (const entry of battleLog) {
    if (typeof entry === 'string') {
      if (entry.trim()) out.push({ message: entry, isEngineWarning: false });
      continue;
    }
    if (entry && typeof entry === 'object' && 'message' in entry) {
      const msg = String((entry as { message?: unknown }).message ?? '');
      if (!msg) continue;
      const isEngineWarning = (entry as { type?: string }).type === 'engine_warning';
      out.push({ message: msg, isEngineWarning });
    }
  }
  return out;
}
