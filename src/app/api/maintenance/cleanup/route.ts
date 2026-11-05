import { NextRequest, NextResponse } from 'next/server';
import { runBattleCleanup } from '@/lib/server/battle-cleanup';
import {
  adminDeleteBattle,
  adminListBattlesCreatedBefore,
  getAdminFirestore,
  isAdminAvailable,
} from '@/lib/rtdb-access';
import { enforceTurnDeadline } from '@/lib/battle-resolution';
import { logger } from '@/lib/server/logger';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Daily cleanup of abandoned multiplayer battles and rooms (Vercel Cron, see vercel.json).
 * Requires `Authorization: Bearer $CRON_SECRET` (Vercel sends it for cron jobs) and the Admin SDK.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Cleanup disabled (CRON_SECRET not set)' }, { status: 503 });
  if (request.headers.get('Authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminAvailable()) {
    return NextResponse.json({ error: 'Firebase Admin SDK required' }, { status: 503 });
  }

  try {
    const firestore = getAdminFirestore();
    const report = await runBattleCleanup({
      now: () => Date.now(),
      listBattlesCreatedBefore: adminListBattlesCreatedBefore,
      endStaleBattle: (id) => enforceTurnDeadline(id),
      deleteBattle: adminDeleteBattle,
      listRoomsCreatedBefore: async (statuses, cutoff, limit) => {
        // Single-field createdAt query (no composite index needed); status is filtered here
        const admin = require('firebase-admin') as typeof import('firebase-admin');
        const snap = await firestore
          .collection('battle_rooms')
          .where('createdAt', '<', admin.firestore.Timestamp.fromMillis(cutoff))
          .orderBy('createdAt')
          .limit(limit * 3)
          .get();
        return snap.docs
          .filter((d) => statuses.includes(String(d.get('status') ?? 'waiting')))
          .slice(0, limit)
          .map((d) => d.id);
      },
      deleteRoom: async (roomId) => {
        await firestore.collection('battle_rooms').doc(roomId).delete();
      },
    });
    logger.info('Battle cleanup finished', { route: 'maintenance/cleanup', ...report });
    return NextResponse.json({ success: true, ...report });
  } catch (error) {
    logger.error('Battle cleanup failed', { route: 'maintenance/cleanup', err: error });
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
