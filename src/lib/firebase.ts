import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is properly configured
const isFirebaseConfigured = firebaseConfig.apiKey && 
  firebaseConfig.authDomain && 
  firebaseConfig.projectId;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Expose Firebase instances to the browser window for E2E visibility
    if (typeof window !== 'undefined') {
      // Modern explicit globals
      // @ts-expect-error - augmenting window for test visibility
      window.firebaseApp = app;
      // @ts-expect-error - augmenting window for test visibility
      window.firebaseAuth = auth;
      // @ts-expect-error - augmenting window for test visibility
      window.firebaseDb = db;

      // Legacy shim used by some tests: emulate window.firebase.apps
      // @ts-expect-error - augmenting window for test visibility
      window.firebase = window.firebase || {};
      // @ts-expect-error - augmenting window for test visibility
      window.firebase.apps = [app];
    }
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
} else {
  console.warn('Firebase not configured. Please set up your environment variables.');
}

export { auth, db };
export default app;