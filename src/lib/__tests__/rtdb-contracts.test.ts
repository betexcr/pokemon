import { describe, it, expect } from 'vitest';
import type { RTDBResolution } from '../firebase-rtdb-service';

describe('RTDB payload contracts', () => {
  it('meta contract supports ruleProfile', () => {
    const meta = {
      createdAt: Date.now(),
      format: 'singles',
      ruleSet: 'gen9-no-weather',
      region: 'global',
      players: { p1: { uid: 'u1', name: 'A' }, p2: { uid: 'u2', name: 'B' } },
      phase: 'choosing',
      turn: 1,
      deadlineAt: Date.now() + 30_000,
      version: 1,
      ruleProfile: 'simplified' as const,
    };
    expect(meta.ruleProfile).toBe('simplified');
  });

  it('turn resolution contract supports replay + metrics', () => {
    const payload: RTDBResolution = {
      by: 'function',
      committedAt: Date.now(),
      rngSeedUsed: 123,
      diffs: [],
      logs: ['ok'],
      stateHashAfter: 'abc12345',
      replay: {
        turn: 1,
        p1Action: { type: 'move', moveId: 'tackle', target: 'opponent' },
        p2Action: { type: 'switch', switchIndex: 1, target: 'player' },
        rngBefore: { seed: 1, state: 1, calls: 0 },
        rngAfter: { seed: 1, state: 2, calls: 1 },
      },
      validation: { normalized: false },
      metrics: { resolveDurationMs: 12, hydrationFallbackCount: 0 },
    };
    expect(payload.replay?.turn).toBe(1);
    expect(payload.metrics?.resolveDurationMs).toBeGreaterThanOrEqual(0);
  });
});
