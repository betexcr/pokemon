/**
 * Unified RTDB access layer.
 * Production requires Firebase Admin SDK. User-token REST fallback is
 * development-only and never used for authoritative battle writes in prod.
 */

const RTDB_URL = (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? '').replace(/\/$/, '');
let _adminReady = false;

function isProductionRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === 'production' ||
    process.env.NODE_ENV === 'production'
  );
}

function ensureAdmin(): boolean {
  if (_adminReady) return true;
  try {
    const { getApps, initializeApp, cert } = require('firebase-admin/app') as typeof import('firebase-admin/app');
    if (getApps().length) {
      _adminReady = true;
      return true;
    }
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) return false;
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({ credential: cert(sa), databaseURL: RTDB_URL });
    _adminReady = true;
    return true;
  } catch (e: unknown) {
    console.warn('Admin SDK init failed:', e instanceof Error ? e.message : String(e));
    return false;
  }
}

/** Returns true when Admin SDK is available for server writes. */
export function isAdminAvailable(): boolean {
  return ensureAdmin();
}

function getAdminDb() {
  const { getDatabase } = require('firebase-admin/database') as typeof import('firebase-admin/database');
  return getDatabase();
}

async function adminGet(path: string) {
  return (await getAdminDb().ref(path).once('value')).val();
}

async function adminSet(path: string, value: unknown) {
  await getAdminDb().ref(path).set(value);
}

async function adminUpdate(path: string, value: Record<string, unknown>) {
  await getAdminDb().ref(path).update(value);
}

async function adminUpdateMulti(updates: Record<string, unknown>) {
  await getAdminDb().ref().update(updates);
}

async function adminTransaction(
  path: string,
  transform: (current: unknown) => unknown
): Promise<{ committed: boolean; snapshot: unknown }> {
  const result = await getAdminDb().ref(path).transaction(transform);
  return { committed: result.committed, snapshot: result.snapshot?.val() };
}

function restUrl(path: string, token: string) {
  return `${RTDB_URL}/${path}.json?auth=${encodeURIComponent(token)}`;
}

async function restGet(path: string, token: string) {
  const res = await fetch(restUrl(path, token));
  if (!res.ok) throw new Error(`RTDB REST GET ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function restSet(path: string, value: unknown, token: string) {
  const res = await fetch(restUrl(path, token), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`RTDB REST PUT ${path}: ${res.status} ${await res.text()}`);
}

async function restUpdate(path: string, value: Record<string, unknown>, token: string) {
  const res = await fetch(restUrl(path, token), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`RTDB REST PATCH ${path}: ${res.status} ${await res.text()}`);
}

async function restUpdateMulti(updates: Record<string, unknown>, token: string) {
  // REST has no true multi-path update; apply sequentially (dev-only fallback).
  await Promise.all(Object.entries(updates).map(([path, value]) => restSet(path, value, token)));
}

export interface RtdbOps {
  get(path: string): Promise<any>;
  set(path: string, value: any): Promise<void>;
  update(path: string, value: Record<string, any>): Promise<void>;
  /** Atomic multi-path update from DB root (Admin). */
  updateMulti?(updates: Record<string, unknown>): Promise<void>;
  /**
   * Run a transaction on the value at `path`. Return `undefined` from
   * `transform` to abort. Only available with the admin SDK.
   */
  transaction?(
    path: string,
    transform: (current: any) => any
  ): Promise<{ committed: boolean; snapshot: any }>;
}

export type GetRtdbOpsOptions = {
  /** When true, refuse user-token REST fallback even in development. */
  requireAdmin?: boolean;
};

/**
 * Returns an RtdbOps handle.
 * Production always requires Admin. Dev may fall back to caller ID token.
 */
export function getRtdbOps(authToken?: string, options?: GetRtdbOpsOptions): RtdbOps {
  const useAdmin = ensureAdmin();

  if (useAdmin) {
    return {
      get: adminGet,
      set: adminSet,
      update: adminUpdate,
      updateMulti: adminUpdateMulti,
      transaction: adminTransaction,
    };
  }

  if (options?.requireAdmin || isProductionRuntime()) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY / Admin SDK is required for battle authority in this environment'
    );
  }

  if (!authToken) {
    throw new Error('No FIREBASE_SERVICE_ACCOUNT_KEY and no auth token for REST fallback');
  }

  return {
    get: (p) => restGet(p, authToken),
    set: (p, v) => restSet(p, v, authToken),
    update: (p, v) => restUpdate(p, v, authToken),
    updateMulti: (updates) => restUpdateMulti(updates, authToken),
  };
}

export async function verifyAuthToken(idToken: string): Promise<string> {
  if (ensureAdmin()) {
    const { auth } = require('firebase-admin') as typeof import('firebase-admin');
    const decoded = await auth().verifyIdToken(idToken);
    return decoded.uid;
  }
  if (isProductionRuntime()) {
    throw new Error('Admin SDK required to verify tokens in production');
  }
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('No Firebase API key for token verification');
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.users?.[0]?.localId;
}

/** Firestore Admin helpers for API routes. */
export function getAdminFirestore() {
  if (!ensureAdmin()) {
    throw new Error('Firebase Admin SDK required for Firestore access');
  }
  const admin = require('firebase-admin') as typeof import('firebase-admin');
  return admin.firestore();
}
