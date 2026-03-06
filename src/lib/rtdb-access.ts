/**
 * Unified RTDB access layer.
 * Uses Firebase Admin SDK when available (production), falls back to
 * the RTDB REST API with a client auth token (local development).
 */

const RTDB_URL = (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? '').replace(/\/$/, '');
let _adminReady = false;

function ensureAdmin(): boolean {
    if (_adminReady) return true;
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) return false;
    try {
        const { getApps, initializeApp, cert } = require('firebase-admin/app') as typeof import('firebase-admin/app');
        if (!getApps().length) {
            const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            initializeApp({ credential: cert(sa), databaseURL: RTDB_URL });
        }
        _adminReady = true;
        return true;
    } catch (e: any) {
        console.warn('Admin SDK init failed:', e.message);
        return false;
    }
}

// --- Admin helpers ---
async function adminGet(path: string) {
    const { getDatabase } = require('firebase-admin/database') as typeof import('firebase-admin/database');
    return (await getDatabase().ref(path).once('value')).val();
}

async function adminSet(path: string, value: any) {
    const { getDatabase } = require('firebase-admin/database') as typeof import('firebase-admin/database');
    await getDatabase().ref(path).set(value);
}

async function adminUpdate(path: string, value: Record<string, any>) {
    const { getDatabase } = require('firebase-admin/database') as typeof import('firebase-admin/database');
    await getDatabase().ref(path).update(value);
}

// --- REST helpers ---
function restUrl(path: string, token: string) {
    return `${RTDB_URL}/${path}.json?auth=${encodeURIComponent(token)}`;
}

async function restGet(path: string, token: string) {
    const res = await fetch(restUrl(path, token));
    if (!res.ok) throw new Error(`RTDB REST GET ${path}: ${res.status} ${await res.text()}`);
    return res.json();
}

async function restSet(path: string, value: any, token: string) {
    const res = await fetch(restUrl(path, token), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
    });
    if (!res.ok) throw new Error(`RTDB REST PUT ${path}: ${res.status} ${await res.text()}`);
}

async function restUpdate(path: string, value: Record<string, any>, token: string) {
    const res = await fetch(restUrl(path, token), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
    });
    if (!res.ok) throw new Error(`RTDB REST PATCH ${path}: ${res.status} ${await res.text()}`);
}

export interface RtdbOps {
    get(path: string): Promise<any>;
    set(path: string, value: any): Promise<void>;
    update(path: string, value: Record<string, any>): Promise<void>;
}

/**
 * Returns an RtdbOps handle. If `authToken` is provided and Admin SDK
 * is not available, uses the REST API with that token.
 */
export function getRtdbOps(authToken?: string): RtdbOps {
    const useAdmin = ensureAdmin();

    if (useAdmin) {
        return { get: adminGet, set: adminSet, update: adminUpdate };
    }

    if (!authToken) {
        throw new Error('No FIREBASE_SERVICE_ACCOUNT_KEY and no auth token for REST fallback');
    }

    return {
        get: (p) => restGet(p, authToken),
        set: (p, v) => restSet(p, v, authToken),
        update: (p, v) => restUpdate(p, v, authToken),
    };
}

export async function verifyAuthToken(idToken: string): Promise<string> {
    if (ensureAdmin()) {
        const { auth } = require('firebase-admin') as typeof import('firebase-admin');
        const decoded = await auth().verifyIdToken(idToken);
        return decoded.uid;
    }
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) throw new Error('No Firebase API key for token verification');
    const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        },
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.users?.[0]?.localId;
}
