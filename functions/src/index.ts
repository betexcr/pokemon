import express from 'express';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { resolveTurn } from '../../src/lib/battle-resolution';
import { handleBattleEnd } from '../../src/lib/multiplayer/handleBattleEnd';

const app = express();
app.use(express.json());

function ensureAdmin(): void {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
}

app.get('/test-firebase', async (_req, res) => {
  try {
    ensureAdmin();
    const status = {
      initialized: admin.apps.length > 0,
      apps: admin.apps.map((appItem) => appItem?.name)
    };

    return res.status(200).json({ status: 'ok', firebase: status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

app.post('/battles/:id/submit', async (req, res) => {
  try {
    ensureAdmin();

    const battleId = req.params.id;

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];

    let uid: string;
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid Token';
      console.error('Token Verification Failed:', message);
      return res.status(401).json({ error: 'Invalid Token' });
    }

    const body = req.body ?? {};
    const { action, moveId, target, switchToIndex, clientVersion } = body as {
      action?: string;
      moveId?: string;
      target?: string | number;
      switchToIndex?: number;
      clientVersion?: string;
    };

    if (!action || !['move', 'switch', 'forfeit'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    if (action === 'move' && (typeof moveId !== 'string' && typeof moveId !== 'number')) {
      return res.status(400).json({ error: 'Missing or invalid moveId' });
    }
    if (action === 'switch' && typeof switchToIndex !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid switchToIndex' });
    }

    const db = admin.database();
    const metaRef = db.ref(`battles/${battleId}/meta`);
    const metaSnap = await metaRef.once('value');
    const meta = metaSnap.val();

    if (!meta) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    if (meta.phase === 'ended') {
      return res.status(400).json({ error: 'Battle already ended' });
    }

    const p1Uid = meta.players?.p1?.uid;
    const p2Uid = meta.players?.p2?.uid;

    if (!p1Uid || !p2Uid) {
      return res.status(400).json({ error: 'Battle data is corrupted (missing player info)' });
    }

    if (uid !== p1Uid && uid !== p2Uid) {
      return res.status(403).json({ error: 'Not a participant in this battle' });
    }

    if (action === 'forfeit') {
      const winner: 'player' | 'opponent' = uid === p1Uid ? 'opponent' : 'player';
      await handleBattleEnd(battleId, winner, 'forfeit', meta);
      return res.status(200).json({ success: true, forfeit: true });
    }

    if (meta.phase !== 'choosing') {
      return res.status(400).json({ error: `Not in choosing phase (current: ${meta.phase})` });
    }

    const choiceRef = db.ref(`battles/${battleId}/turns/${meta.turn}/choices/${uid}`);
    const existingSnap = await choiceRef.once('value');

    if (!existingSnap.exists()) {
      const payload: Record<string, unknown> = {};
      if (action === 'move') {
        payload.moveId = moveId;
        if (target !== undefined) {
          payload.target = target;
        }
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

    const choicesRef = db.ref(`battles/${battleId}/turns/${meta.turn}/choices`);
    const choicesSnap = await choicesRef.once('value');
    const choices = choicesSnap.val() || {};

    const p1Submitted = choices[p1Uid];
    const p2Submitted = choices[p2Uid];

    if (p1Submitted && p2Submitted) {
      await resolveTurn(battleId);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in submit route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export const api = functions.https.onRequest(app);
