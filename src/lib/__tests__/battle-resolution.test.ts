import { describe, it, expect, vi, beforeEach } from 'vitest';
import { claimTurn, isResolvingStale, RESOLVING_STALE_MS } from '../battle-resolution-claim';
import {
  projectPrivateVolatiles,
  RecoverableResolutionError,
  isRecoverableResolutionFailure,
  illegalRejectMetaFields,
  shouldRecoverStaleResolving,
  softFailChoosingFields,
  shouldSkipClientVersionForResolve,
  shouldClearPendingAction,
} from '../battle-private-volatiles';
import { __test__ as normalizeTest } from '../server/normalize-team-rtdb';
import type { RtdbOps } from '../rtdb-access';

/** Match TURN_DEADLINE_MS without importing create-rtdb-battle (Vitest alias deep graph). */
const TURN_DEADLINE_MS = 30_000;

describe('claimTurn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('commits when phase is choosing and turn matches', async () => {
    const meta = {
      phase: 'choosing',
      turn: 2,
      players: { p1: { uid: 'a' }, p2: { uid: 'b' } },
    };
    const ops: RtdbOps = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      transaction: vi.fn(async (_path, transform) => {
        const next = transform(meta);
        expect(next).toMatchObject({ phase: 'resolving' });
        return { committed: true, snapshot: next };
      }),
    };

    const result = await claimTurn(ops, 'battle-1', 2);
    expect(result.committed).toBe(true);
  });

  it('aborts stale reclaim when resolution already exists', async () => {
    const ops: RtdbOps = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      transaction: vi.fn(async (_path, transform) => {
        const next = transform({
          phase: 'resolving',
          turn: 2,
          resolvingStartedAt: Date.now() - RESOLVING_STALE_MS - 1000,
        });
        expect(next).toBeUndefined();
        return { committed: false, snapshot: null };
      }),
    };

    const result = await claimTurn(ops, 'battle-1', 2, { resolutionExists: true });
    expect(result.committed).toBe(false);
  });

  it('recovers stale resolving when no resolution written', async () => {
    const stale = {
      phase: 'resolving',
      turn: 2,
      resolvingStartedAt: Date.now() - RESOLVING_STALE_MS - 1000,
    };
    const ops: RtdbOps = {
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      transaction: vi.fn(async (_path, transform) => {
        const next = transform(stale);
        expect(next).toMatchObject({ phase: 'resolving' });
        return { committed: true, snapshot: next };
      }),
    };

    const result = await claimTurn(ops, 'battle-1', 2, { resolutionExists: false });
    expect(result.committed).toBe(true);
  });
});

describe('isResolvingStale', () => {
  it('detects stale resolvingStartedAt', () => {
    expect(
      isResolvingStale({
        phase: 'resolving',
        resolvingStartedAt: Date.now() - RESOLVING_STALE_MS - 1,
      } as any)
    ).toBe(true);
    expect(
      isResolvingStale({
        phase: 'resolving',
        resolvingStartedAt: Date.now(),
      } as any)
    ).toBe(false);
  });
});

describe('projectPrivateVolatiles', () => {
  it('maps engine choiceLock string and encore.move / disable.move', () => {
    const projected = projectPrivateVolatiles({
      pokemon: { id: 1, name: 'bulbasaur', types: [], stats: [], weight: 1, abilities: [] },
      level: 50,
      nature: 'hardy',
      currentHp: 100,
      maxHp: 100,
      moves: [{ id: 'tackle', pp: 10, maxPp: 35 }],
      volatile: {
        choiceLock: 'tackle',
        encore: { move: 'tackle', turns: 2 },
        disable: { move: 'growl', turns: 1 },
      },
      statModifiers: {
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0,
      },
    } as any);

    expect(projected.choiceLock).toEqual({ moveId: 'tackle', locked: true });
    expect(projected.encoreMoveId).toBe('tackle');
    expect(projected.disable).toEqual({ moveId: 'growl' });
  });
});

describe('normalizeTeamForRTDB absolute URL', () => {
  it('uses absolute pokeapi.co base', () => {
    expect(normalizeTest.POKEAPI_ABSOLUTE).toBe('https://pokeapi.co/api/v2/pokemon');
  });
});

describe('aurora veil public screen shape', () => {
  it('restores auroraVeil turns from public raw number', () => {
    const mapScreens = (raw: any) => ({
      reflect: raw?.reflect ? { turns: raw.reflect } : undefined,
      lightScreen: raw?.lightScreen ? { turns: raw.lightScreen } : undefined,
      auroraVeil: raw?.auroraVeil ? { turns: raw.auroraVeil } : undefined,
    });
    expect(mapScreens({ reflect: 5, lightScreen: 0, auroraVeil: 3 })).toEqual({
      reflect: { turns: 5 },
      lightScreen: undefined,
      auroraVeil: { turns: 3 },
    });
  });
});

describe('RecoverableResolutionError', () => {
  it('is named for submit classification', () => {
    const err = new RecoverableResolutionError('Missing base stats');
    expect(err.name).toBe('RecoverableResolutionError');
  });

  it('only treats RecoverableResolutionError as recoverable', () => {
    expect(isRecoverableResolutionFailure(new RecoverableResolutionError('hydrate'))).toBe(true);
    expect(isRecoverableResolutionFailure(new Error('PokeAPI timeout'))).toBe(false);
    expect(isRecoverableResolutionFailure(new Error('ECONNRESET'))).toBe(false);
    expect(isRecoverableResolutionFailure(new Error('corrupt state'))).toBe(false);
  });
});

describe('illegalRejectMetaFields', () => {
  it('bumps version and refreshes deadlineAt', () => {
    const now = 1_700_000_000_000;
    const meta = illegalRejectMetaFields({ version: 3 }, TURN_DEADLINE_MS, now);
    expect(meta.phase).toBe('choosing');
    expect(meta.resolvingStartedAt).toBeNull();
    expect(meta.version).toBe(4);
    expect(meta.deadlineAt).toBe(now + TURN_DEADLINE_MS);
  });
});

describe('softFailChoosingFields', () => {
  it('bumps version and deadline for soft-fail clears', () => {
    const now = 1_700_000_000_000;
    const soft = softFailChoosingFields({ version: 2 }, TURN_DEADLINE_MS, now);
    expect(soft.version).toBe(3);
    expect(soft.deadlineAt).toBe(now + TURN_DEADLINE_MS);
    expect(soft.phase).toBe('choosing');
  });
});

describe('shouldSkipClientVersionForResolve', () => {
  it('skips when choosing and both choices present', () => {
    expect(shouldSkipClientVersionForResolve('choosing', true)).toBe(true);
    expect(shouldSkipClientVersionForResolve('choosing', false)).toBe(false);
    expect(shouldSkipClientVersionForResolve('resolving', true)).toBe(false);
  });
});

describe('shouldClearPendingAction', () => {
  it('clears when version bumps while choosing', () => {
    expect(
      shouldClearPendingAction({
        pendingTurn: 3,
        phase: 'choosing',
        turn: 3,
        version: 5,
        lastSeenVersion: 4,
      })
    ).toBe(true);
  });

  it('clears on illegal reject for pending turn', () => {
    expect(
      shouldClearPendingAction({
        pendingTurn: 3,
        phase: 'choosing',
        turn: 3,
        version: 4,
        lastSeenVersion: 4,
        lastValidationTurn: 3,
        lastValidationRejected: true,
      })
    ).toBe(true);
  });
});

describe('shouldRecoverStaleResolving (submit)', () => {
  it('recovers only when resolving, stale, and no resolution', () => {
    expect(shouldRecoverStaleResolving('resolving', false, true)).toBe(true);
    expect(shouldRecoverStaleResolving('resolving', true, true)).toBe(false);
    expect(shouldRecoverStaleResolving('resolving', false, false)).toBe(false);
    expect(shouldRecoverStaleResolving('choosing', false, true)).toBe(false);
  });
});
