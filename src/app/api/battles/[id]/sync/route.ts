import { NextRequest, NextResponse } from 'next/server';
import { getRtdbOps, verifyAuthToken } from '@/lib/rtdb-access';
import { enforceTurnDeadline, resolveTurn } from '@/lib/battle-resolution';
import { handleBattleEnd } from '@/lib/multiplayer/handleBattleEnd';
import { syncBattle } from '@/lib/battle-sync';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { getRequestId, withRequestIdHeaders } from '@/lib/server/request-context';
import { logger } from '@/lib/server/logger';

export const maxDuration = 60;

/**
 * POST /api/battles/{id}/sync — a participant asks the server to unstick the battle: enforce a passed
 * deadline, resolve a turn whose choices are all in, or recover a stale resolution. Idempotent.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request);
  const json = (body: unknown, status?: number) => NextResponse.json(body, { status, headers: withRequestIdHeaders(requestId) });
  try {
    const { id: battleId } = await params;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const token = authHeader.split('Bearer ')[1];
    let uid: string;
    try {
      uid = await verifyAuthToken(token);
    } catch {
      return json({ error: 'Invalid Token' }, 401);
    }
    const rl = await checkRateLimit(`battle-sync:${uid}`, 20, 60_000);
    if (!rl.allowed) return json({ error: 'Too many requests' }, 429);

    const ops = getRtdbOps(token);
    const result = await syncBattle(battleId, uid, {
      ops,
      enforceTurnDeadline: (id) => enforceTurnDeadline(id, token),
      resolveTurn: (id) => resolveTurn(id, token),
      finalizeEnded: (id, meta) => handleBattleEnd(id, undefined, 'victory', meta, ops),
    });
    return json({ success: true, ...result });
  } catch (error: unknown) {
    const status = (error as { status?: number })?.status;
    if (status === 404 || status === 403) return json({ error: (error as Error).message }, status);
    logger.error('Error in sync route', { route: 'battles/sync', requestId, err: error });
    return json({ error: 'Failed to sync battle' }, 503);
  }
}
