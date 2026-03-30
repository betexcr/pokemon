import { getRtdbOps, type RtdbOps } from '@/lib/rtdb-access';
import type { RTDBBattleMeta } from '@/lib/firebase-rtdb-service';

type EndReason = 'victory' | 'forfeit' | 'timeout' | 'resolution_failed';

/**
 * Resolve RTDB ops: use provided ops, try server-side ops, or return null
 * (caller will fall back to client SDK).
 */
function resolveOps(provided?: RtdbOps): RtdbOps | null {
  if (provided) return provided;
  try {
    return getRtdbOps();
  } catch {
    return null;
  }
}

/**
 * Update Firestore battle + room documents.
 * Prefers firebase-admin (server), falls back to client services.
 */
async function updateFirestore(
  battleId: string,
  winner: 'player' | 'opponent' | undefined,
  winnerUid: string | undefined,
  endReason: EndReason,
): Promise<void> {
  try {
    const admin = require('firebase-admin') as typeof import('firebase-admin');
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      const snap = await db.collection('battles').doc(battleId).get();
      if (!snap.exists) {
        console.warn(`handleBattleEnd: no Firestore battle for ${battleId}`);
        return;
      }
      const data = snap.data()!;
      await snap.ref.update({
        status: 'completed',
        winner: winner ?? null,
        winnerUid: winnerUid ?? null,
        endReason,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      if (data.roomId) {
        try {
          await db.collection('rooms').doc(data.roomId).update({
            status: 'finished',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (roomErr) {
          console.warn(`handleBattleEnd: failed to update room ${data.roomId}:`, roomErr);
        }
      }
      return;
    }
  } catch {
    // Admin SDK not available — fall through to client path
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
    }

    // 1. Update RTDB meta — use a transaction when available to avoid
    //    double-writes from concurrent calls (TOCTOU guard).
    if (serverOps?.transaction) {
      const result = await serverOps.transaction(
        `battles/${battleId}/meta`,
        (current: RTDBBattleMeta | null) => {
          if (!current || current.phase === 'ended') return undefined; // abort
          return { ...current, phase: 'ended', winnerUid: winnerUid ?? null, endedReason: endReason };
        },
      );
      if (!result.committed) {
        console.warn(`handleBattleEnd: battle ${battleId} already ended (txn aborted), skipping`);
        return;
      }
    } else if (meta.phase === 'ended') {
      console.warn(`handleBattleEnd: battle ${battleId} already ended, skipping`);
      return;
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

    // 2. Update Firestore battle + room
    await updateFirestore(battleId, winner, winnerUid, endReason);
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
export async function handleTimeout(
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
