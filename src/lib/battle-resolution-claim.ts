import type { RTDBBattleMeta } from './firebase-rtdb-service';
import type { RtdbOps } from './rtdb-access';

export const RESOLVING_STALE_MS = 60_000;

/**
 * Atomically claim turn resolution via RTDB transaction (or best-effort REST fallback).
 * Stale reclaim requires that `turns/{turn}/resolution` does not already exist
 * (caller should pass `resolutionExists`).
 */
export async function claimTurn(
  ops: RtdbOps,
  battleId: string,
  expectedTurn: number,
  options?: { resolutionExists?: boolean }
): Promise<{ committed: boolean; meta: RTDBBattleMeta | null }> {
  const resolutionExists = options?.resolutionExists === true;

  if (ops.transaction) {
    const result = await ops.transaction(`battles/${battleId}/meta`, (current: RTDBBattleMeta | null) => {
      if (!current) return;
      if (current.phase === 'ended') return;

      const staleResolving =
        current.phase === 'resolving' &&
        typeof (current as { resolvingStartedAt?: number }).resolvingStartedAt === 'number' &&
        Date.now() - ((current as { resolvingStartedAt?: number }).resolvingStartedAt as number) >
          RESOLVING_STALE_MS;

      if (current.phase === 'resolving' && !staleResolving) return;
      if (current.phase !== 'choosing' && !staleResolving) return;

      // Never skip turn equality on stale reclaim if resolution already written
      if (staleResolving) {
        if (resolutionExists) return;
        if (current.turn !== expectedTurn) return;
      } else if (current.turn !== expectedTurn) {
        return;
      }

      return {
        ...current,
        phase: 'resolving',
        resolvingStartedAt: Date.now(),
      };
    });
    return { committed: result.committed, meta: result.snapshot as RTDBBattleMeta | null };
  }

  const meta = (await ops.get(`battles/${battleId}/meta`)) as RTDBBattleMeta | null;
  if (!meta || meta.phase !== 'choosing' || meta.turn !== expectedTurn) {
    return { committed: false, meta };
  }
  await ops.update(`battles/${battleId}/meta`, {
    phase: 'resolving',
    resolvingStartedAt: Date.now(),
  });
  return { committed: true, meta: { ...meta, phase: 'resolving' } };
}

export function isResolvingStale(meta: RTDBBattleMeta | null | undefined): boolean {
  if (!meta || meta.phase !== 'resolving') return false;
  const started = (meta as { resolvingStartedAt?: number }).resolvingStartedAt;
  if (typeof started !== 'number') return true;
  return Date.now() - started > RESOLVING_STALE_MS;
}
