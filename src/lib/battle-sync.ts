// Server-side "sync" for a multiplayer battle: called by a participant's client when the battle looks
// stuck (after a reconnect, a past deadline, or a long resolution). Turn work normally runs only when a
// player submits a choice, so without this a battle can hang when:
//   - the opponent disconnected and the turn deadline passed (nobody submits again to enforce it),
//   - both choices were stored but resolution never ran (the submit request died mid-way),
//   - resolution crashed and left `meta.phase = 'resolving'`.
// Every action here is idempotent and reuses the regular turn pipeline.

import type { RtdbOps } from './rtdb-access';
import type { RTDBBattleMeta } from './firebase-rtdb-service';
import { allRequiredChoicesPresent } from './battle-pending-switch';
import { isResolvingStale } from './battle-resolution-claim';

export type SyncOutcome =
  | 'none'
  | 'ended'
  | 'timed-out'
  | 'resolved'
  | 'recovered'
  | 'finalized';

export type SyncDeps = {
  ops: RtdbOps;
  enforceTurnDeadline: (battleId: string) => Promise<boolean>;
  resolveTurn: (battleId: string) => Promise<void>;
  finalizeEnded: (battleId: string, meta: RTDBBattleMeta) => Promise<void>;
  now?: () => number;
};

export async function syncBattle(battleId: string, uid: string, deps: SyncDeps): Promise<{ outcome: SyncOutcome; phase?: string; turn?: number }> {
  const { ops } = deps;
  const now = deps.now ?? Date.now;
  const meta = (await ops.get(`battles/${battleId}/meta`)) as RTDBBattleMeta | null;
  if (!meta) throw Object.assign(new Error('Battle not found'), { status: 404 });
  if (uid !== meta.players?.p1?.uid && uid !== meta.players?.p2?.uid) {
    throw Object.assign(new Error('Not a participant in this battle'), { status: 403 });
  }
  if (meta.phase === 'ended') return { outcome: 'ended', phase: meta.phase, turn: meta.turn };

  if (meta.phase === 'resolving') {
    const resolution = await ops.get(`battles/${battleId}/turns/${meta.turn}/resolution`);
    if (resolution) {
      // The turn was written but meta never left 'resolving' (crash after the write): finish it
      await deps.finalizeEnded(battleId, meta);
      return { outcome: 'finalized', phase: meta.phase, turn: meta.turn };
    }
    if (isResolvingStale(meta)) {
      await deps.resolveTurn(battleId);
      return { outcome: 'recovered' };
    }
    return { outcome: 'none', phase: meta.phase, turn: meta.turn };
  }

  // choosing
  if (typeof meta.deadlineAt === 'number' && now() > meta.deadlineAt) {
    const timedOut = await deps.enforceTurnDeadline(battleId);
    if (timedOut) return { outcome: 'timed-out' };
  }
  const choices = (await ops.get(`battles/${battleId}/turns/${meta.turn}/choices`)) as Record<string, unknown> | null;
  if (allRequiredChoicesPresent(meta, choices)) {
    await deps.resolveTurn(battleId);
    return { outcome: 'resolved' };
  }
  return { outcome: 'none', phase: meta.phase, turn: meta.turn };
}
