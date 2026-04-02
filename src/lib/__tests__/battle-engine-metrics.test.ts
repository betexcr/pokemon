import { describe, it, expect } from 'vitest';
import {
  getBattleEngineMetricsSnapshot,
  recordHydrationFallback,
  recordIllegalActionRejected,
  recordMoveDataMiss,
  recordNormalizedAction,
  recordResolutionDurationMs,
  resetMoveDataMissCountForTests,
} from '../battle-engine-metrics';

describe('battle-engine-metrics', () => {
  it('tracks and resets counters', () => {
    resetMoveDataMissCountForTests();
    recordMoveDataMiss('tackle');
    recordHydrationFallback();
    recordNormalizedAction();
    recordIllegalActionRejected();
    recordResolutionDurationMs(10);
    const snap = getBattleEngineMetricsSnapshot();
    expect(snap.moveDataMissCount).toBe(1);
    expect(snap.hydrationFallbackCount).toBe(1);
    expect(snap.normalizedActionCount).toBe(1);
    expect(snap.illegalActionRejectCount).toBe(1);
    expect(snap.avgResolutionMs).toBeGreaterThanOrEqual(10);
  });
});
