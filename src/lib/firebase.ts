import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'pokemon-battles-86a0d',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-app-id',
};

// Check if we're in development mode and should use emulators
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Connect to emulators in development mode
  if (isDevelopment && typeof window !== 'undefined') {
    // Only connect to emulators once
    if (!auth._delegate._config.emulator) {
      try {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        console.log('🔗 Connected to Firebase Auth Emulator');
      } catch (error) {
        console.log('ℹ️ Auth emulator already connected or not available');
      }
    }

    if (!db._delegate._databaseId.projectId.includes('demo-')) {
      try {
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        console.log('🔗 Connected to Firebase Firestore Emulator');
      } catch (error) {
        console.log('ℹ️ Firestore emulator already connected or not available');
      }
    }
  }

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

export { auth, db };
export default app;