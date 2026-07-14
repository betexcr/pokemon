type VolatileLike = {
  choiceLock?: string;
  encore?: { move: string; turns: number };
  disable?: { move: string; turns: number };
};

type ActiveLike = {
  volatile?: VolatileLike;
};

/**
 * Project engine volatiles onto the RTDB private root shape used by useBattleState.
 * Engine uses choiceLock?: string, encore.move, disable.move.
 */
export function projectPrivateVolatiles(active: ActiveLike) {
  const v = active.volatile || {};
  const choiceLockId = typeof v.choiceLock === 'string' ? v.choiceLock : undefined;
  const encoreMove = v.encore?.move;
  const disableMove = v.disable?.move;
  return {
    choiceLock: choiceLockId ? { moveId: choiceLockId, locked: true } : {},
    encoreMoveId: encoreMove,
    disable: disableMove ? { moveId: disableMove } : undefined,
  };
}

export class RecoverableResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecoverableResolutionError';
  }
}

/** True when resolve/submit should soft-fail (keep battle alive) instead of ending it. */
export function isRecoverableResolutionFailure(error: unknown): boolean {
  if (error instanceof RecoverableResolutionError) return true;
  return error instanceof Error && error.name === 'RecoverableResolutionError';
}

/** Soft-fail meta bump that clears choices so clients can resubmit freely. */
export function softFailChoosingFields(
  meta: { version?: number },
  turnDeadlineMs: number,
  now = Date.now()
) {
  return {
    phase: 'choosing' as const,
    resolvingStartedAt: null,
    version: (meta.version ?? 1) + 1,
    deadlineAt: now + turnDeadlineMs,
  };
}

/** Clear pendingAction when version bumps while choosing, or illegal reject for this turn. */
export function shouldClearPendingAction(opts: {
  pendingTurn: number | undefined;
  phase: string | undefined;
  turn: number | undefined;
  version: number | undefined;
  lastSeenVersion: number | undefined;
  lastValidationTurn?: number | null;
  lastValidationRejected?: boolean;
}): boolean {
  if (opts.pendingTurn == null) return false;
  if (!opts.phase || opts.phase === 'ended') return true;
  if (opts.turn != null && opts.turn !== opts.pendingTurn) return true;
  if (
    opts.phase === 'choosing' &&
    typeof opts.version === 'number' &&
    typeof opts.lastSeenVersion === 'number' &&
    opts.version > opts.lastSeenVersion
  ) {
    return true;
  }
  if (
    opts.lastValidationRejected &&
    opts.lastValidationTurn === opts.pendingTurn &&
    opts.phase === 'choosing'
  ) {
    return true;
  }
  return false;
}

/** When both choices already exist, skip clientVersion gate and re-resolve. */
export function shouldSkipClientVersionForResolve(
  phase: string | undefined,
  bothChoicesPresent: boolean
): boolean {
  return phase === 'choosing' && bothChoicesPresent;
}

/**
 * Meta fields written when illegal choices are rejected (deadline refreshed).
 * Pure helper so unit tests can assert Wave 4 deadline behavior without the engine.
 */
export function illegalRejectMetaFields(
  meta: { version?: number },
  turnDeadlineMs: number,
  now = Date.now()
) {
  return {
    phase: 'choosing' as const,
    resolvingStartedAt: null,
    version: (meta.version ?? 1) + 1,
    deadlineAt: now + turnDeadlineMs,
  };
}

/** Submit path: recover stuck resolving when claim is stale and no resolution exists. */
export function shouldRecoverStaleResolving(
  phase: string | undefined,
  resolutionExists: boolean,
  stale: boolean
): boolean {
  return phase === 'resolving' && !resolutionExists && stale;
}
