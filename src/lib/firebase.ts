import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';
import { getFunctions, type Functions } from 'firebase/functions';

// Trim environment variables to avoid issues with stray whitespace/newlines in
// production builds that can break OAuth redirect/iframe URLs.
const trimmed = (value?: string) => (typeof value === 'string' ? value.trim() : value);

const firebaseConfig = {
  // Your Firebase config
  apiKey: trimmed(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: trimmed(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: trimmed(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: trimmed(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: trimmed(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: trimmed(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  // Add RTDB URL
  databaseURL: trimmed(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL),
  // Add measurement ID for Firebase Analytics
  measurementId: trimmed(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)
};

const requiredKeys: Array<keyof typeof firebaseConfig> = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId'
];

const hasFirebaseConfig = requiredKeys.every((key) => Boolean(firebaseConfig[key]));

let app: FirebaseApp | null = null;

if (hasFirebaseConfig) {
  const apps = getApps();
  app = apps.length ? getApp() : initializeApp(firebaseConfig);
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Firebase configuration is incomplete. Skipping client initialization.');
  }
}

// Initialize Firebase services when configuration is available
export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const rtdb: Database | null = app ? getDatabase(app) : null;
export const functions: Functions | null = app ? getFunctions(app) : null;

// Enable Firestore offline persistence once on the client, before app usage
let __persistenceAttempted = false;
if (typeof window !== 'undefined' && app && !__persistenceAttempted) {
  __persistenceAttempted = true;
  try {
    if (db) {
      void enableIndexedDbPersistence(db);
    }
  } catch {
    // Ignore if already enabled or unsupported
  }
}

export default app;
