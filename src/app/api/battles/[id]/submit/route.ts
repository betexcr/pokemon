import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'firebase-admin';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { resolveTurn } from '@/lib/battle-resolution';

// Lazy initialization to catch errors
function getAdminApp(): App {
    if (getApps().length) return getApps()[0];

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not defined');
    } 

    try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        return initializeApp({
            credential: cert(serviceAccount),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
        });
    } catch (error: any) {
        console.error('Failed to parse service account key:', error);
        throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Initialize Admin SDK first
        try {
            getAdminApp();
        } catch (initError: any) {
            console.error('Firebase Admin Init Error:', initError);
            return NextResponse.json({ error: `Server Configuration Error: ${initError.message}` }, { status: 500 });
        }

        const { id: battleId } = await params;

        // 1. Authenticate User
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        
        let uid: string;
        try {
            const decodedToken = await auth().verifyIdToken(token);
            uid = decodedToken.uid;
        } catch (authError: any) {
            console.error('Token Verification Failed:', authError);
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        // 2. Parse Body
        const body = await request.json();
        const { action, moveId, target, switchToIndex, clientVersion } = body;

        if (!['move', 'switch', 'forfeit'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // 3. Get Current Turn from RTDB (Admin SDK)
        const db = getDatabase();
        const metaRef = db.ref(`battles/${battleId}/meta`);
        const metaSnap = await metaRef.once('value');
        const meta = metaSnap.val();

        if (!meta) {
            return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
        }

        if (meta.phase !== 'choosing') {
            return NextResponse.json({ error: `Not in choosing phase (current: ${meta.phase})` }, { status: 400 });
        }

        // 4. Submit Choice (Admin SDK)
        const choiceRef = db.ref(`battles/${battleId}/turns/${meta.turn}/choices/${uid}`);
        
        // Check if choice exists to avoid overwrites (optional, but good practice)
        const existingSnap = await choiceRef.once('value');
        if (!existingSnap.exists()) {
             // Construct payload based on action to avoid undefined values which RTDB rejects
             const payload: any = {};
             if (action === 'move') {
                 payload.moveId = moveId;
                 if (target !== undefined) payload.target = target;
             } else if (action === 'switch') {
                 payload.switchToIndex = switchToIndex;
             }

             await choiceRef.set({
                action,
                payload,
                committedAt: { '.sv': 'timestamp' },
                clientVersion
            });
        }

        // 5. Check if both players have submitted
        const choicesRef = db.ref(`battles/${battleId}/turns/${meta.turn}/choices`);
        const choicesSnap = await choicesRef.once('value');
        const choices = choicesSnap.val() || {};

        const p1Submitted = choices[meta.players.p1.uid];
        const p2Submitted = choices[meta.players.p2.uid];

        if (p1Submitted && p2Submitted) {
            // Both players ready! Trigger resolution
            // We don't await this to return quickly to the client
            resolveTurn(battleId).catch(err => {
                console.error('Error resolving turn:', err);
            });
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
