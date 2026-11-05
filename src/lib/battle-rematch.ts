// Rematch after a multiplayer battle: each player asks (stored Admin-only under battles/{id}/rematch/{uid});
// once both have, the battle's room is reset to "ready" with the same teams so the host can start a new
// battle, and `rematch/roomId` tells both clients where to go. Storage is injected for tests.

import type { RtdbOps } from './rtdb-access';
import type { RTDBBattleMeta } from './firebase-rtdb-service';

export type RematchDeps = {
  ops: RtdbOps;
  /** Room the battle was started from (Firestore battles/{id}.roomId). */
  findRoomId: (battleId: string) => Promise<string | null>;
  /**
   * Reset the room for a new battle if it still points at this battle. Returns false when the room is
   * gone or already moved on (e.g. a rematch was started already).
   */
  resetRoom: (roomId: string, battleId: string) => Promise<boolean>;
  now?: () => number;
};

export type RematchResult =
  | { status: 'waiting' }
  | { status: 'ready'; roomId: string }
  | { status: 'unavailable'; reason: string };

export async function requestRematch(battleId: string, uid: string, deps: RematchDeps): Promise<RematchResult> {
  const { ops } = deps;
  const meta = (await ops.get(`battles/${battleId}/meta`)) as RTDBBattleMeta | null;
  if (!meta) throw Object.assign(new Error('Battle not found'), { status: 404 });
  const p1 = meta.players?.p1?.uid;
  const p2 = meta.players?.p2?.uid;
  if (uid !== p1 && uid !== p2) throw Object.assign(new Error('Not a participant in this battle'), { status: 403 });
  if (meta.phase !== 'ended') return { status: 'unavailable', reason: 'Battle has not ended' };

  const existing = ((await ops.get(`battles/${battleId}/rematch`)) ?? {}) as Record<string, unknown>;
  if (typeof existing.roomId === 'string') return { status: 'ready', roomId: existing.roomId };

  await ops.set(`battles/${battleId}/rematch/${uid}`, (deps.now ?? Date.now)());
  const requests = { ...existing, [uid]: true };
  if (!requests[p1] || !requests[p2]) return { status: 'waiting' };

  const roomId = await deps.findRoomId(battleId);
  if (!roomId) return { status: 'unavailable', reason: 'The battle room no longer exists' };
  const reset = await deps.resetRoom(roomId, battleId);
  if (!reset) return { status: 'unavailable', reason: 'The room has moved on to another battle' };
  await ops.set(`battles/${battleId}/rematch/roomId`, roomId);
  return { status: 'ready', roomId };
}
