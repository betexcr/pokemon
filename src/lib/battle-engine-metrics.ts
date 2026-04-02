let moveDataMissCount = 0;

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

/** Vitest only */
export function resetMoveDataMissCountForTests(): void {
  moveDataMissCount = 0;
}
