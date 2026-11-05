import type { RtdbOps } from '@/lib/rtdb-access';
import type { RTDBBattleMeta } from '@/lib/firebase-rtdb-service';

type EndReason = 'victory' | 'forfeit' | 'timeout' | 'resolution_failed';

// This module is shared by API routes and client hooks, so it must not import firebase-admin or
// rtdb-access (Turbopack pulls their Node-only dependencies into client bundles). Server callers pass
// their RtdbOps; with the Admin SDK those ops also update Firestore (`markFirestoreBattleEnded`).

/** Provided ops (server), or null so the caller falls back to the client SDK. */
function resolveOps(provided?: RtdbOps): RtdbOps | null {
  return provided ?? null;
}

/**
 * Update Firestore battle + room documents: through the Admin SDK when the ops offer it,
 * otherwise through the client services.
 */
async function updateFirestore(
  battleId: string,
  winner: 'player' | 'opponent' | undefined,
  winnerUid: string | undefined,
  endReason: EndReason,
  ops?: RtdbOps | null,
): Promise<void> {
  if (ops?.markFirestoreBattleEnded) {
    try {
      const result = await ops.markFirestoreBattleEnded(battleId, {
        status: 'completed',
        winner: winner ?? null,
        winnerUid: winnerUid ?? null,
        endReason,
      });
      if (result === 'missing') console.warn(`handleBattleEnd: no Firestore battle for ${battleId}`);
      return;
    } catch (err) {
      console.warn('handleBattleEnd: Admin Firestore update failed, trying the client path:', err);
    }
  }

  // Client path: lazy-require to avoid pulling client SDK into server bundles
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { battleService } = require('@/lib/battleService') as typeof import('@/lib/battleService');
  const battle = await battleService.getBattle(battleId);
  if (!battle) {
    console.warn(`handleBattleEnd: no Firestore battle for ${battleId}`);
    return;
  }
  await battleService.updateBattle(battleId, { status: 'completed', winner, winnerUid, endReason });
  if (battle.roomId) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { roomService } = require('@/lib/roomService') as typeof import('@/lib/roomService');
      await roomService.updateRoom(battle.roomId, { status: 'finished' });
    } catch (roomErr) {
      console.warn(`handleBattleEnd: failed to update room ${battle.roomId}:`, roomErr);
    }
  }
}

/**
 * Handle battle completion - update RTDB, Firestore, and room status.
 *
 * Accepts the winner side (engine-relative) and resolves UIDs from RTDB meta.
 * Safe to call multiple times for the same battle (idempotent).
 *
 * When `ops` is provided (server contexts like resolveTurn), uses it for RTDB.
 * When omitted (client contexts like hooks), falls back to client rtdbService.
 * Callers that already hold meta can pass it to avoid a redundant fetch.
 */
export async function handleBattleEnd(
  battleId: string,
  winner: 'player' | 'opponent' | undefined,
  endReason: EndReason = 'victory',
  existingMeta?: RTDBBattleMeta | null,
  ops?: RtdbOps,
): Promise<void> {
  try {
    const serverOps = resolveOps(ops);

    let meta = existingMeta ?? null;
    if (!meta) {
      if (serverOps) {
        meta = await serverOps.get(`battles/${battleId}/meta`);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { rtdbService } = require('@/lib/firebase-rtdb-service') as typeof import('@/lib/firebase-rtdb-service');
        meta = await rtdbService.getBattleMeta(battleId);
      }
    }
    if (!meta) {
      console.warn(`handleBattleEnd: no meta found for battle ${battleId}, skipping`);
      return;
    }

    let winnerUid: string | undefined;
    if (winner === 'player') {
      winnerUid = meta.players.p1.uid;
    } else if (winner === 'opponent') {
      winnerUid = meta.players.p2.uid;
    } else if (meta.winnerUid) {
      winnerUid = meta.winnerUid;
    }

    // RTDB already ended (atomic victory write) — sync Firestore only
    if (meta.phase === 'ended') {
      await updateFirestore(battleId, winner, winnerUid, endReason, serverOps);
      return;
    }

    // 1. Update RTDB meta — use a transaction when available to avoid
    //    double-writes from concurrent calls (TOCTOU guard).
    let rtdbAlreadyEnded = false;
    if (serverOps?.transaction) {
      const result = await serverOps.transaction(
        `battles/${battleId}/meta`,
        (current: RTDBBattleMeta | null) => {
          if (!current || current.phase === 'ended') return undefined; // abort
          return { ...current, phase: 'ended', winnerUid: winnerUid ?? null, endedReason: endReason };
        },
      );
      if (!result.committed) {
        rtdbAlreadyEnded = true;
      }
    } else if (serverOps) {
      await serverOps.update(`battles/${battleId}/meta`, {
        phase: 'ended',
        winnerUid: winnerUid ?? null,
        endedReason: endReason,
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { rtdbService } = require('@/lib/firebase-rtdb-service') as typeof import('@/lib/firebase-rtdb-service');
      await rtdbService.updateBattleMeta(battleId, {
        phase: 'ended',
        winnerUid,
        endedReason: endReason,
      });
    }

    // 2. Always sync Firestore battle + room (even when RTDB already ended concurrently)
    if (rtdbAlreadyEnded) {
      console.warn(`handleBattleEnd: battle ${battleId} already ended in RTDB; syncing Firestore`);
    }
    await updateFirestore(battleId, winner, winnerUid, endReason, serverOps);
  } catch (error) {
    console.error('Failed to handle battle end:', error);
    throw error;
  }
}

function resolveWinnerSide(
  meta: { players: { p1: { uid: string }; p2: { uid: string } } },
  loserUserId: string,
): 'player' | 'opponent' {
  if (loserUserId === meta.players.p1.uid) return 'opponent';
  if (loserUserId === meta.players.p2.uid) return 'player';
  throw new Error(`User ${loserUserId} is not a participant in this battle`);
}

/**
 * Handle forfeit - mark battle as ended with forfeit reason.
 * The opponent of `userId` wins.
 */
export async function handleForfeit(
  battleId: string,
  userId: string,
  ops?: RtdbOps,
): Promise<void> {
  let meta: RTDBBattleMeta | null;
  const serverOps = resolveOps(ops);

  if (serverOps) {
    meta = await serverOps.get(`battles/${battleId}/meta`);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { rtdbService } = require('@/lib/firebase-rtdb-service') as typeof import('@/lib/firebase-rtdb-service');
    meta = await rtdbService.getBattleMeta(battleId);
  }
  if (!meta) throw new Error('Battle not found');

  const winner = resolveWinnerSide(meta, userId);
  await handleBattleEnd(battleId, winner, 'forfeit', meta, serverOps ?? undefined);
}

/**
 * Handle timeout - mark battle as ended with timeout reason.
 * The opponent of `timedOutUserId` wins.
 */
async function handleTimeout(
  battleId: string,
  timedOutUserId: string,
  ops?: RtdbOps,
): Promise<void> {
  let meta: RTDBBattleMeta | null;
  const serverOps = resolveOps(ops);

  if (serverOps) {
    meta = await serverOps.get(`battles/${battleId}/meta`);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { rtdbService } = require('@/lib/firebase-rtdb-service') as typeof import('@/lib/firebase-rtdb-service');
    meta = await rtdbService.getBattleMeta(battleId);
  }
  if (!meta) throw new Error('Battle not found');

  const winner = resolveWinnerSide(meta, timedOutUserId);
  await handleBattleEnd(battleId, winner, 'timeout', meta, serverOps ?? undefined);
}
