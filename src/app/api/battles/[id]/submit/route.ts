import { NextRequest, NextResponse } from 'next/server';
import { getRtdbOps, verifyAuthToken } from '@/lib/rtdb-access';
import { resolveTurn, enforceTurnDeadline } from '@/lib/battle-resolution';
import { isResolvingStale } from '@/lib/battle-resolution-claim';
import {
  isRecoverableResolutionFailure,
  shouldRecoverStaleResolving,
  shouldSkipClientVersionForResolve,
} from '@/lib/battle-private-volatiles';
import { handleBattleEnd } from '@/lib/multiplayer/handleBattleEnd';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { getRequestId, withRequestIdHeaders } from '@/lib/server/request-context';
import { logger } from '@/lib/server/logger';
import { captureServerException } from '@/lib/server/sentry';

export const maxDuration = 60;

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const requestId = getRequestId(request);
    const json = (body: unknown, init?: { status?: number }) =>
        NextResponse.json(body, {
            status: init?.status,
            headers: withRequestIdHeaders(requestId),
        });

    try {
        const { id: battleId } = await params;

        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];

        let uid: string;
        try {
            uid = await verifyAuthToken(token);
        } catch (authError: unknown) {
            logger.warn('Token verification failed', { route: 'battles/submit', requestId, err: authError });
            return json({ error: 'Invalid Token' }, { status: 401 });
        }

        const rl = await checkRateLimit(`battle-submit:${uid}`, 60, 60_000);
        if (!rl.allowed) {
            return json({ error: 'Too many requests' }, { status: 429 });
        }

        const body = await request.json();
        const { action, moveId, target, switchToIndex, clientVersion } = body;

        if (!['move', 'switch', 'forfeit'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        if (action === 'move' && (typeof moveId !== 'string' && typeof moveId !== 'number')) {
            return NextResponse.json({ error: 'Missing or invalid moveId' }, { status: 400 });
        }
        if (action === 'switch' && typeof switchToIndex !== 'number') {
            return NextResponse.json({ error: 'Missing or invalid switchToIndex' }, { status: 400 });
        }

        const ops = getRtdbOps(token);

        const meta = await ops.get(`battles/${battleId}/meta`);
        if (!meta) {
            return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }
        if (meta.phase === 'ended') {
            return NextResponse.json({ error: 'Battle already ended' }, { status: 400 });
        }

        if (uid !== meta.players?.p1?.uid && uid !== meta.players?.p2?.uid) {
            return NextResponse.json({ error: 'Not a participant in this battle' }, { status: 403 });
        }

        if (action === 'forfeit') {
            const winner = uid === meta.players.p1.uid ? 'opponent' : 'player';
            await handleBattleEnd(battleId, winner, 'forfeit', meta, ops);
            return NextResponse.json({ success: true, forfeit: true });
        }

        if (meta.phase === 'resolving') {
            const resolution = await ops.get(`battles/${battleId}/turns/${meta.turn}/resolution`);
            if (resolution) {
                // Resolution written but meta stuck — finish end idempotently
                try {
                    await handleBattleEnd(battleId, undefined, 'victory', meta, ops);
                } catch (err) {
                    console.error('Failed to finalize already-resolved battle:', err);
                }
                return NextResponse.json({ success: true, alreadyResolved: true });
            }
            if (shouldRecoverStaleResolving(meta.phase, false, isResolvingStale(meta))) {
                try {
                    await resolveTurn(battleId, token);
                    return NextResponse.json({ success: true, recovered: true });
                } catch (err: unknown) {
                    console.error('Error recovering stuck resolve:', err);
                    return NextResponse.json(
                        { error: 'Failed to recover turn. Please try again.' },
                        { status: 503 }
                    );
                }
            }
            return NextResponse.json({ error: `Not in choosing phase (current: ${meta.phase})` }, { status: 400 });
        }

        if (meta.phase === 'choosing') {
            await enforceTurnDeadline(battleId, token);
        }

        const metaAfter = await ops.get(`battles/${battleId}/meta`);
        if (!metaAfter || metaAfter.phase === 'ended') {
            return NextResponse.json({ success: true, timedOut: true });
        }
        if (metaAfter.phase !== 'choosing') {
            return NextResponse.json({ error: `Not in choosing phase (current: ${metaAfter.phase})` }, { status: 400 });
        }

        // Peek existing choices before writing — both present ⇒ re-resolve without version gate
        const choicesPeek = (await ops.get(`battles/${battleId}/turns/${metaAfter.turn}/choices`)) || {};
        const bothAlready =
            !!choicesPeek[metaAfter.players.p1.uid] && !!choicesPeek[metaAfter.players.p2.uid];

        if (shouldSkipClientVersionForResolve(metaAfter.phase, bothAlready)) {
            try {
                await resolveTurn(battleId, token);
                return NextResponse.json({ success: true, recovered: true });
            } catch (err: unknown) {
                console.error('Error resolving turn (both choices):', err);
                const recoverable = isRecoverableResolutionFailure(err);
                return NextResponse.json(
                    { error: 'Failed to resolve turn. Please try again.' },
                    { status: recoverable ? 503 : 500 }
                );
            }
        }

        if (typeof clientVersion !== 'number') {
            return NextResponse.json({ error: 'clientVersion required' }, { status: 400 });
        }
        if (typeof metaAfter.version === 'number' && clientVersion !== metaAfter.version) {
            return NextResponse.json(
                { error: 'Stale clientVersion', currentVersion: metaAfter.version },
                { status: 409 }
            );
        }

        const existingChoice = await ops.get(`battles/${battleId}/turns/${metaAfter.turn}/choices/${uid}`);
        if (!existingChoice) {
            const payload: Record<string, unknown> = {};
            if (action === 'move') {
                payload.moveId = moveId;
                if (target !== undefined) payload.target = target;
            } else if (action === 'switch') {
                payload.switchToIndex = switchToIndex;
            }

            await ops.set(`battles/${battleId}/turns/${metaAfter.turn}/choices/${uid}`, {
                action,
                payload,
                committedAt: Date.now(),
                clientVersion,
            });
        }

        const choices = await ops.get(`battles/${battleId}/turns/${metaAfter.turn}/choices`) || {};
        const p1Submitted = choices[metaAfter.players.p1.uid];
        const p2Submitted = choices[metaAfter.players.p2.uid];

        if (p1Submitted && p2Submitted) {
            try {
                await resolveTurn(battleId, token);
            } catch (err: unknown) {
                const recoverable = isRecoverableResolutionFailure(err);
                logger.error('Error resolving turn', {
                    route: 'battles/submit',
                    requestId,
                    battleId,
                    recoverable,
                    err,
                });
                if (!recoverable) {
                    await captureServerException(err, { route: 'battles/submit', requestId, battleId });
                }
                return json(
                    { error: 'Failed to resolve turn. Please try again.' },
                    { status: recoverable ? 503 : 500 }
                );
            }
        }

        return json({ success: true });
    } catch (error: unknown) {
        logger.error('Error in submit route', { route: 'battles/submit', requestId, err: error });
        await captureServerException(error, { route: 'battles/submit', requestId });
        return json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
