"use client";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const trimmed = (v?: string) => (typeof v === "string" ? v.trim() : v);

const config = {
  apiKey: trimmed(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: trimmed(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: trimmed(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: trimmed(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: trimmed(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: trimmed(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

export function firebaseClient() {
  const app = getApps().length ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  // Do NOT initialize Firestore here to avoid eager network connections.
  // Call getDb() when Firestore is actually needed.
  return { app, auth, GoogleAuthProvider };
}

// Lazily obtain Firestore instance on-demand to prevent connection attempts on pages
// that do not use Firestore (e.g., checklist when offline or in SSR contexts).
export function getDb() {
  const app = getApps().length ? getApp() : initializeApp(config);
  // Importing from firebase/firestore is safe; creating the instance only when called.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getFirestore } = require("firebase/firestore") as typeof import("firebase/firestore");
  return getFirestore(app);
}

