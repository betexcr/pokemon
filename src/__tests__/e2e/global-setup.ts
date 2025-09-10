import { chromium, FullConfig } from '@playwright/test';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Test user credentials
const TEST_USERS = {
  host: {
    email: process.env.TEST_HOST_EMAIL || 'test-host@pokemon-battles.test',
    password: process.env.TEST_HOST_PASSWORD || 'TestHost123!',
    displayName: 'Test Host',
  },
  guest: {
    email: process.env.TEST_GUEST_EMAIL || 'test-guest@pokemon-battles.test',
    password: process.env.TEST_GUEST_PASSWORD || 'TestGuest123!',
    displayName: 'Test Guest',
  },
  errorTest: {
    email: process.env.TEST_ERROR_EMAIL || 'test-error@pokemon-battles.test',
    password: process.env.TEST_ERROR_PASSWORD || 'TestError123!',
    displayName: 'Test Error User',
  }
};

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');
  
  // Initialize Firebase
  let app;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  // Clean up any existing test users
  await cleanupTestUsers(auth);
  
  // Create test users
  console.log('👤 Creating test users...');
  const testUsers = await createTestUsers(auth);
  
  // Store test user data for tests
  process.env.TEST_USERS_DATA = JSON.stringify(testUsers);
  
  // Create test teams for users
  console.log('🎮 Creating test teams...');
  await createTestTeams(db, testUsers);
  
  console.log('✅ E2E test setup completed successfully');
  console.log(`📊 Created ${Object.keys(testUsers).length} test users`);
}

async function cleanupTestUsers(auth: any) {
  console.log('🧹 Cleaning up existing test users...');
  
  for (const [key, user] of Object.entries(TEST_USERS)) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
      await deleteUser(userCredential.user);
      console.log(`🗑️ Deleted existing test user: ${user.email}`);
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        console.log(`⚠️ Could not delete user ${user.email}: ${error.message}`);
      }
    }
  }
}

async function createTestUsers(auth: any) {
  const testUsers: any = {};
  
  for (const [key, userData] of Object.entries(TEST_USERS)) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      // Update display name
      await userCredential.user.updateProfile({
        displayName: userData.displayName
      });
      
      testUsers[key] = {
        uid: userCredential.user.uid,
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
      };
      
      console.log(`✅ Created test user: ${userData.email} (${userCredential.user.uid})`);
    } catch (error: any) {
      console.error(`❌ Failed to create test user ${userData.email}:`, error.message);
      throw error;
    }
  }
  
  return testUsers;
}

async function createTestTeams(db: any, testUsers: any) {
  const testTeam = {
    name: 'Test Team',
    slots: [
      { id: 1, level: 50, moves: [1, 2, 3, 4] }, // Bulbasaur
      { id: 4, level: 50, moves: [1, 2, 3, 4] }, // Charmander
      { id: 7, level: 50, moves: [1, 2, 3, 4] }, // Squirtle
      { id: 25, level: 50, moves: [1, 2, 3, 4] }, // Pikachu
      { id: 39, level: 50, moves: [1, 2, 3, 4] }, // Jigglypuff
      { id: 143, level: 50, moves: [1, 2, 3, 4] }, // Snorlax
    ],
    createdAt: new Date(),
  };
  
  for (const [key, user] of Object.entries(testUsers)) {
    try {
      const teamRef = doc(collection(db, 'userTeams'), `${user.uid}_test_team`);
      await setDoc(teamRef, {
        ...testTeam,
        userId: user.uid,
        teamName: `${user.displayName}'s Test Team`,
      });
      console.log(`✅ Created test team for ${user.email}`);
    } catch (error: any) {
      console.error(`❌ Failed to create test team for ${user.email}:`, error.message);
    }
  }
}

export default globalSetup;
