#!/usr/bin/env node

/**
 * Simple Test User Management Script
 * 
 * This script creates test users using Firebase Client SDK.
 */

const { initializeApp, getApps } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Firebase client configuration
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

async function setupTestUsers() {
  console.log('🚀 Setting up test users...');
  
  try {
    // Initialize Firebase
    let app;
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Clean up existing test users
    await cleanupTestUsers(auth);
    
    // Create test users
    const testUsers = await createTestUsers(auth);
    
    // Create test teams
    await createTestTeams(db, testUsers);
    
    console.log('✅ Test users setup completed successfully');
    console.log(`📊 Created ${Object.keys(testUsers).length} test users`);
    
  } catch (error) {
    console.error('❌ Failed to setup test users:', error.message);
    process.exit(1);
  }
}

async function cleanupTestUsers(auth) {
  console.log('🧹 Cleaning up existing test users...');
  
  for (const [key, user] of Object.entries(TEST_USERS)) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
      await deleteUser(userCredential.user);
      console.log(`🗑️ Deleted existing test user: ${user.email}`);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        console.log(`⚠️ Could not delete user ${user.email}: ${error.message}`);
      }
    }
  }
}

async function createTestUsers(auth) {
  const testUsers = {};
  
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
    } catch (error) {
      console.error(`❌ Failed to create test user ${userData.email}:`, error.message);
      throw error;
    }
  }
  
  return testUsers;
}

async function createTestTeams(db, testUsers) {
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
    } catch (error) {
      console.error(`❌ Failed to create test team for ${user.email}:`, error.message);
    }
  }
}

// Main execution
setupTestUsers();

