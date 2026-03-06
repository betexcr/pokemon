import { NextRequest, NextResponse } from 'next/server';
import { getRtdbOps, verifyAuthToken } from '@/lib/rtdb-access';
import { resolveTurn } from '@/lib/battle-resolution';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: battleId } = await params;

        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];

        let uid: string;
        try {
            uid = await verifyAuthToken(token);
        } catch (authError: any) {
            console.error('Token Verification Failed:', authError);
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        const body = await request.json();
        const { action, moveId, target, switchToIndex, clientVersion } = body;

        if (!['move', 'switch', 'forfeit'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const ops = getRtdbOps(token);

        const meta = await ops.get(`battles/${battleId}/meta`);
        if (!meta) {
            return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }
        if (meta.phase === 'ended') {
            return NextResponse.json({ error: 'Battle already ended' }, { status: 400 });
        }

        // Handle forfeit immediately — no need to wait for opponent
        if (action === 'forfeit') {
            const winnerUid = uid === meta.players.p1.uid
                ? meta.players.p2.uid
                : meta.players.p1.uid;
            await ops.update(`battles/${battleId}/meta`, {
                phase: 'ended',
                winnerUid,
                endedReason: 'forfeit',
            });
            return NextResponse.json({ success: true, forfeit: true });
        }

        if (meta.phase !== 'choosing') {
            return NextResponse.json({ error: `Not in choosing phase (current: ${meta.phase})` }, { status: 400 });
        }

        const existingChoice = await ops.get(`battles/${battleId}/turns/${meta.turn}/choices/${uid}`);
        if (!existingChoice) {
            const payload: any = {};
            if (action === 'move') {
                payload.moveId = moveId;
                if (target !== undefined) payload.target = target;
            } else if (action === 'switch') {
                payload.switchToIndex = switchToIndex;
            }

            await ops.set(`battles/${battleId}/turns/${meta.turn}/choices/${uid}`, {
                action,
                payload,
                committedAt: Date.now(),
                clientVersion,
            });
        }

        const choices = await ops.get(`battles/${battleId}/turns/${meta.turn}/choices`) || {};
        const p1Submitted = choices[meta.players.p1.uid];
        const p2Submitted = choices[meta.players.p2.uid];

        if (p1Submitted && p2Submitted) {
            try {
                await resolveTurn(battleId, token);
            } catch (err: any) {
                console.error('Error resolving turn:', err);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in submit route:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
