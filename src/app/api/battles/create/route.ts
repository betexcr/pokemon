import { NextRequest, NextResponse } from 'next/server';
import type { DocumentReference } from 'firebase-admin/firestore';
import { getRtdbOps, verifyAuthToken, getAdminFirestore } from '@/lib/rtdb-access';
import { writeRtdbBattle } from '@/lib/server/create-rtdb-battle';
import { normalizeTeamForRTDB, TeamHydrationError } from '@/lib/server/normalize-team-rtdb';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { getRequestId, withRequestIdHeaders } from '@/lib/server/request-context';
import { logger } from '@/lib/server/logger';
import { captureServerException } from '@/lib/server/sentry';

export const maxDuration = 60;

type ClaimResult =
  | { kind: 'existing'; battleId: string }
  | {
      kind: 'claimed';
      battleId: string;
      room: Record<string, unknown>;
      hostTeamRaw: unknown;
      guestTeamRaw: unknown;
    };

async function rollbackRoom(roomRef: DocumentReference, shouldRollback: boolean) {
  if (!shouldRollback) return;
  try {
    await roomRef.update({ status: 'ready', battleId: null, startedAt: null });
  } catch {
    /* ignore */
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const json = (body: unknown, init?: { status?: number }) =>
    NextResponse.json(body, {
      status: init?.status,
      headers: withRequestIdHeaders(requestId),
    });

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice('Bearer '.length);

    let uid: string;
    try {
      uid = await verifyAuthToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
    }

    const rl = await checkRateLimit(`battle-create:${uid}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const roomId = typeof body.roomId === 'string' ? body.roomId : '';
    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const roomRef = db.collection('battle_rooms').doc(roomId);
    const teamsRef = roomRef.collection('private').doc('teams');

    let claim: ClaimResult;
    try {
      claim = await db.runTransaction(async (txn) => {
        const roomSnap = await txn.get(roomRef);
        if (!roomSnap.exists) {
          throw Object.assign(new Error('Room not found'), { status: 404 });
        }
        const room = roomSnap.data()!;

        if (room.hostId !== uid) {
          throw Object.assign(new Error('Only the host can start the battle'), { status: 403 });
        }
        if (!room.guestId) {
          throw Object.assign(new Error('Guest has not joined'), { status: 400 });
        }
        if (!room.hostReady || !room.guestReady) {
          throw Object.assign(new Error('Both players must be ready'), { status: 400 });
        }

        const teamsSnap = await txn.get(teamsRef);
        const teams = teamsSnap.exists ? teamsSnap.data()! : {};
        const hostTeamRaw = teams.hostTeam ?? room.hostTeam;
        const guestTeamRaw = teams.guestTeam ?? room.guestTeam;
        if (!hostTeamRaw || !guestTeamRaw) {
          throw Object.assign(new Error('Both players need teams'), { status: 400 });
        }

        if (room.status === 'battling' && typeof room.battleId === 'string' && room.battleId) {
          return { kind: 'existing' as const, battleId: room.battleId };
        }

        const battleId = db.collection('battles').doc().id;
        txn.update(roomRef, {
          status: 'battling',
          battleId,
          startedAt: new Date(),
        });
        return {
          kind: 'claimed' as const,
          battleId,
          room,
          hostTeamRaw,
          guestTeamRaw,
        };
      });
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const message = err instanceof Error ? err.message : 'Failed to claim battle';
      if (status === 400 || status === 403 || status === 404) {
        return NextResponse.json({ error: message }, { status });
      }
      throw err;
    }

    if (claim.kind === 'existing') {
      const ops = getRtdbOps(undefined, { requireAdmin: true });
      const existing = await ops.get(`battles/${claim.battleId}/meta`);
      if (existing) {
        return NextResponse.json({ success: true, battleId: claim.battleId });
      }
    }

    const roomSnap = await roomRef.get();
    const room = roomSnap.data()!;
    const battleId = claim.battleId;

    let hostTeamRaw: unknown;
    let guestTeamRaw: unknown;
    if (claim.kind === 'claimed') {
      hostTeamRaw = claim.hostTeamRaw;
      guestTeamRaw = claim.guestTeamRaw;
    } else {
      const teamsSnap = await teamsRef.get();
      const teams = teamsSnap.exists ? teamsSnap.data()! : {};
      hostTeamRaw = teams.hostTeam ?? room.hostTeam;
      guestTeamRaw = teams.guestTeam ?? room.guestTeam;
    }

    let hostTeam: Array<Record<string, unknown>>;
    let guestTeam: Array<Record<string, unknown>>;
    try {
      [hostTeam, guestTeam] = await Promise.all([
        normalizeTeamForRTDB(hostTeamRaw, { failOnMissingStats: true }),
        normalizeTeamForRTDB(guestTeamRaw, { failOnMissingStats: true }),
      ]);
    } catch (err) {
      await rollbackRoom(roomRef, claim.kind === 'claimed' || claim.kind === 'existing');
      const message = err instanceof TeamHydrationError ? err.message : 'Team hydration failed';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    try {
      const ops = getRtdbOps(undefined, { requireAdmin: true });
      await writeRtdbBattle(ops, {
        battleId,
        p1Uid: room.hostId,
        p1Name: room.hostName || 'Host Trainer',
        p1Team: hostTeam,
        p2Uid: room.guestId,
        p2Name: room.guestName || 'Guest Trainer',
        p2Team: guestTeam,
      });

      await db.collection('battles').doc(battleId).set(
        {
          roomId,
          hostId: room.hostId,
          hostName: room.hostName || 'Host Trainer',
          guestId: room.guestId,
          guestName: room.guestName || 'Guest Trainer',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true }
      );
    } catch (err) {
      logger.error('RTDB/Firestore battle write failed', { route: 'battles/create', requestId, err });
      await captureServerException(err, { route: 'battles/create', requestId });
      await rollbackRoom(roomRef, true);
      return json({ error: 'Failed to write battle. Please try again.' }, { status: 500 });
    }

    return json({ success: true, battleId });
  } catch (error: unknown) {
    logger.error('Error creating battle', { route: 'battles/create', requestId, err: error });
    await captureServerException(error, { route: 'battles/create', requestId });
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
