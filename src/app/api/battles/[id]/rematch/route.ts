import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getRtdbOps, isAdminAvailable, verifyAuthToken } from '@/lib/rtdb-access';
import { requestRematch } from '@/lib/battle-rematch';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { logger } from '@/lib/server/logger';

/**
 * POST /api/battles/{id}/rematch — ask for a rematch after the battle ended. When both players have
 * asked, their room is reset to "ready" (same teams) and the response carries the room id.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: battleId } = await params;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split('Bearer ')[1];
    let uid: string;
    try {
      uid = await verifyAuthToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
    }
    const rl = await checkRateLimit(`battle-rematch:${uid}`, 10, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    if (!isAdminAvailable()) return NextResponse.json({ error: 'Rematch needs the Admin SDK' }, { status: 503 });

    const db = getAdminFirestore();
    const result = await requestRematch(battleId, uid, {
      ops: getRtdbOps(token),
      findRoomId: async (id) => {
        const snap = await db.collection('battles').doc(id).get();
        const roomId = snap.exists ? snap.get('roomId') : null;
        return typeof roomId === 'string' && roomId ? roomId : null;
      },
      resetRoom: async (roomId, id) => {
        const admin = require('firebase-admin') as typeof import('firebase-admin');
        const ref = db.collection('battle_rooms').doc(roomId);
        return db.runTransaction(async (txn) => {
          const snap = await txn.get(ref);
          if (!snap.exists) return false;
          const room = snap.data()!;
          if (room.battleId !== id || !room.guestId) return false;
          // Same players and teams, both ready: the host starts the next battle from the room
          txn.update(ref, {
            status: 'ready',
            hostReady: true,
            guestReady: true,
            battleId: admin.firestore.FieldValue.delete(),
            rematchOf: id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return true;
        });
      },
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const status = (error as { status?: number })?.status;
    if (status === 404 || status === 403) return NextResponse.json({ error: (error as Error).message }, { status });
    logger.error('Error in rematch route', { route: 'battles/rematch', err: error });
    return NextResponse.json({ error: 'Failed to request a rematch' }, { status: 500 });
  }
}
