import express from 'express';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { resolveTurn } from '../../src/lib/battle-resolution';

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
      apps: admin.apps.map((appItem) => appItem.name)
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

    const db = admin.database();
    const metaRef = db.ref(`battles/${battleId}/meta`);
    const metaSnap = await metaRef.once('value');
    const meta = metaSnap.val();

    if (!meta) {
      return res.status(404).json({ error: 'Battle not found' });
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

    const p1Submitted = choices[meta.players.p1.uid];
    const p2Submitted = choices[meta.players.p2.uid];

    if (p1Submitted && p2Submitted) {
      resolveTurn(battleId).catch((error) => {
        console.error('Error resolving turn:', error);
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error in submit route:', message);
    return res.status(500).json({ error: message });
  }
});

export const api = functions.https.onRequest(app);
