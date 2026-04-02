let moveDataMissCount = 0;
let hydrationFallbackCount = 0;
let normalizedActionCount = 0;
let illegalActionRejectCount = 0;
let resolutionDurationTotalMs = 0;
let resolutionCount = 0;

/** Incremented when move metadata cannot be loaded (network/cache) or is missing. */
export function recordMoveDataMiss(moveId: string): void {
  moveDataMissCount += 1;
  console.warn(
    `[battle-engine] Move data unavailable for "${moveId}" (total misses: ${moveDataMissCount})`
  );
}

export function getMoveDataMissCount(): number {
  return moveDataMissCount;
}

export function recordHydrationFallback(): void {
  hydrationFallbackCount += 1;
}

export function recordNormalizedAction(): void {
  normalizedActionCount += 1;
}

export function recordIllegalActionRejected(): void {
  illegalActionRejectCount += 1;
}

export function recordResolutionDurationMs(ms: number): void {
  if (!Number.isFinite(ms) || ms < 0) return;
  resolutionDurationTotalMs += ms;
  resolutionCount += 1;
}

export function getBattleEngineMetricsSnapshot(): {
  moveDataMissCount: number;
  hydrationFallbackCount: number;
  normalizedActionCount: number;
  illegalActionRejectCount: number;
  avgResolutionMs: number;
  resolutionCount: number;
} {
  return {
    moveDataMissCount,
    hydrationFallbackCount,
    normalizedActionCount,
    illegalActionRejectCount,
    avgResolutionMs: resolutionCount > 0 ? Math.round(resolutionDurationTotalMs / resolutionCount) : 0,
    resolutionCount,
  };
}

/** Vitest only */
export function resetMoveDataMissCountForTests(): void {
  moveDataMissCount = 0;
  hydrationFallbackCount = 0;
  normalizedActionCount = 0;
  illegalActionRejectCount = 0;
  resolutionDurationTotalMs = 0;
  resolutionCount = 0;
}
