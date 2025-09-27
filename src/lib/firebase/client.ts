"use client";
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const trimmed = (v?: string) => (typeof v === "string" ? v.trim() : v);

const config = {
  apiKey: trimmed(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: trimmed(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: trimmed(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: trimmed(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: trimmed(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: trimmed(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

const requiredKeys: Array<keyof typeof config> = ['apiKey', 'authDomain', 'projectId', 'appId'];
export const hasFirebaseClientConfig = requiredKeys.every((key) => Boolean(config[key]));

let cachedApp: FirebaseApp | null = null;

function ensureApp(): FirebaseApp | null {
  if (!hasFirebaseClientConfig) {
    throw new Error('Firebase client config missing');
  }

  if (cachedApp) {
    return cachedApp;
  }

  const apps = getApps();
  cachedApp = apps.length ? getApp() : initializeApp(config);
  return cachedApp;
}

export function firebaseClient() {
  const app = ensureApp();
  const auth: Auth | null = app ? getAuth(app) : null;
  // Do NOT initialize Firestore here to avoid eager network connections.
  // Call getDb() when Firestore is actually needed.
  return { app, auth, GoogleAuthProvider };
}

// Lazily obtain Firestore instance on-demand to prevent connection attempts on pages
// that do not use Firestore (e.g., checklist when offline or in SSR contexts).
export function getDb() {
  const app = ensureApp();
  // Importing from firebase/firestore is safe; creating the instance only when called.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getFirestore } = require("firebase/firestore") as typeof import("firebase/firestore");
  return getFirestore(app);
}
