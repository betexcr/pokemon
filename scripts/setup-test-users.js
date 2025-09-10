#!/usr/bin/env node

/**
 * Test User Management Script
 * 
 * This script creates and manages test users for E2E testing.
 * It uses Firebase Admin SDK to create/delete test users.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

// Firebase Admin configuration
const firebaseConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
    // Initialize Firebase Admin
    if (!firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
      console.log('⚠️ Firebase Admin credentials not found. Using client SDK instead...');
      await setupTestUsersWithClientSDK();
      return;
    }
    
    const app = initializeApp({
      credential: cert(firebaseConfig),
      projectId: firebaseConfig.projectId,
    });
    
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

async function setupTestUsersWithClientSDK() {
  console.log('🔄 Using Firebase Client SDK for test user setup...');
  
  const { initializeApp: initClientApp, getApps } = require('firebase/app');
  const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } = require('firebase/auth');
  const { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } = require('firebase/firestore');
  
  // Firebase client configuration
  const clientConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  
  // Initialize Firebase
  let app;
  if (getApps().length === 0) {
    app = initClientApp(clientConfig);
  } else {
    app = getApps()[0];
  }
  
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  // Clean up existing test users
  await cleanupTestUsersClient(auth);
  
  // Create test users
  const testUsers = await createTestUsersClient(auth);
  
  // Create test teams
  await createTestTeamsClient(db, testUsers);
  
  console.log('✅ Test users setup completed successfully');
  console.log(`📊 Created ${Object.keys(testUsers).length} test users`);
}

async function cleanupTestUsers(auth) {
  console.log('🧹 Cleaning up existing test users...');
  
  for (const [key, user] of Object.entries(TEST_USERS)) {
    try {
      const userRecord = await auth.getUserByEmail(user.email);
      await auth.deleteUser(userRecord.uid);
      console.log(`🗑️ Deleted existing test user: ${user.email}`);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        console.log(`⚠️ Could not delete user ${user.email}: ${error.message}`);
      }
    }
  }
}

async function cleanupTestUsersClient(auth) {
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
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        emailVerified: true,
      });
      
      testUsers[key] = {
        uid: userRecord.uid,
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
      };
      
      console.log(`✅ Created test user: ${userData.email} (${userRecord.uid})`);
    } catch (error) {
      console.error(`❌ Failed to create test user ${userData.email}:`, error.message);
      throw error;
    }
  }
  
  return testUsers;
}

async function createTestUsersClient(auth) {
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
  // Create comprehensive 6-Pokemon teams for multiplayer battle testing
  const testTeams = {
    host: {
      name: 'Complete Team',
      slots: [
        { id: 1, level: 50, moves: [1, 2, 3, 4] }, // Bulbasaur
        { id: 4, level: 50, moves: [1, 2, 3, 4] }, // Charmander
        { id: 7, level: 50, moves: [1, 2, 3, 4] }, // Squirtle
        { id: 25, level: 50, moves: [1, 2, 3, 4] }, // Pikachu
        { id: 39, level: 50, moves: [1, 2, 3, 4] }, // Jigglypuff
        { id: 143, level: 50, moves: [1, 2, 3, 4] }, // Snorlax
      ],
      createdAt: new Date(),
    },
    guest: {
      name: 'Complete Team',
      slots: [
        { id: 2, level: 50, moves: [1, 2, 3, 4] }, // Ivysaur
        { id: 5, level: 50, moves: [1, 2, 3, 4] }, // Charmeleon
        { id: 8, level: 50, moves: [1, 2, 3, 4] }, // Wartortle
        { id: 26, level: 50, moves: [1, 2, 3, 4] }, // Raichu
        { id: 40, level: 50, moves: [1, 2, 3, 4] }, // Wigglytuff
        { id: 144, level: 50, moves: [1, 2, 3, 4] }, // Articuno
      ],
      createdAt: new Date(),
    },
    errorTest: {
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
    }
  };
  
  for (const [key, user] of Object.entries(testUsers)) {
    try {
      const teamData = testTeams[key] || testTeams.errorTest;
      const teamRef = doc(collection(db, 'userTeams'), `${user.uid}_test_team`);
      await setDoc(teamRef, {
        ...teamData,
        userId: user.uid,
        teamName: `${user.displayName}'s ${teamData.name}`,
      });
      console.log(`✅ Created ${teamData.name} for ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to create test team for ${user.email}:`, error.message);
    }
  }
}

async function createTestTeamsClient(db, testUsers) {
  // Create comprehensive 6-Pokemon teams for multiplayer battle testing
  const testTeams = {
    host: {
      name: 'Complete Team',
      slots: [
        { id: 1, level: 50, moves: [1, 2, 3, 4] }, // Bulbasaur
        { id: 4, level: 50, moves: [1, 2, 3, 4] }, // Charmander
        { id: 7, level: 50, moves: [1, 2, 3, 4] }, // Squirtle
        { id: 25, level: 50, moves: [1, 2, 3, 4] }, // Pikachu
        { id: 39, level: 50, moves: [1, 2, 3, 4] }, // Jigglypuff
        { id: 143, level: 50, moves: [1, 2, 3, 4] }, // Snorlax
      ],
      createdAt: new Date(),
    },
    guest: {
      name: 'Complete Team',
      slots: [
        { id: 2, level: 50, moves: [1, 2, 3, 4] }, // Ivysaur
        { id: 5, level: 50, moves: [1, 2, 3, 4] }, // Charmeleon
        { id: 8, level: 50, moves: [1, 2, 3, 4] }, // Wartortle
        { id: 26, level: 50, moves: [1, 2, 3, 4] }, // Raichu
        { id: 40, level: 50, moves: [1, 2, 3, 4] }, // Wigglytuff
        { id: 144, level: 50, moves: [1, 2, 3, 4] }, // Articuno
      ],
      createdAt: new Date(),
    },
    errorTest: {
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
    }
  };
  
  for (const [key, user] of Object.entries(testUsers)) {
    try {
      const teamData = testTeams[key] || testTeams.errorTest;
      const teamRef = doc(collection(db, 'userTeams'), `${user.uid}_test_team`);
      await setDoc(teamRef, {
        ...teamData,
        userId: user.uid,
        teamName: `${user.displayName}'s ${teamData.name}`,
      });
      console.log(`✅ Created ${teamData.name} for ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to create test team for ${user.email}:`, error.message);
    }
  }
}

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up test users...');
  
  try {
    // Initialize Firebase Admin
    if (!firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
      console.log('⚠️ Firebase Admin credentials not found. Using client SDK instead...');
      await cleanupTestUsersWithClientSDK();
      return;
    }
    
    const app = initializeApp({
      credential: cert(firebaseConfig),
      projectId: firebaseConfig.projectId,
    });
    
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Clean up test users
    await cleanupTestUsers(auth);
    
    // Clean up test data
    await cleanupTestData(db);
    
    console.log('✅ Test users cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Failed to cleanup test users:', error.message);
    process.exit(1);
  }
}

async function cleanupTestUsersWithClientSDK() {
  console.log('🔄 Using Firebase Client SDK for test user cleanup...');
  
  const { initializeApp: initClientApp, getApps } = require('firebase/app');
  const { getAuth, signInWithEmailAndPassword, deleteUser } = require('firebase/auth');
  const { getFirestore, collection, query, where, getDocs, deleteDoc } = require('firebase/firestore');
  
  // Firebase client configuration
  const clientConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  
  // Initialize Firebase
  let app;
  if (getApps().length === 0) {
    app = initClientApp(clientConfig);
  } else {
    app = getApps()[0];
  }
  
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  // Clean up test users
  await cleanupTestUsersClient(auth);
  
  // Clean up test data
  await cleanupTestDataClient(db);
  
  console.log('✅ Test users cleanup completed successfully');
}

async function cleanupTestData(db) {
  console.log('🗑️ Cleaning up test data...');
  
  // Get all test users
  const testUserEmails = Object.values(TEST_USERS).map(user => user.email);
  const testUsers = [];
  
  for (const email of testUserEmails) {
    try {
      const userRecord = await auth.getUserByEmail(email);
      testUsers.push(userRecord.uid);
    } catch (error) {
      // User doesn't exist, skip
    }
  }
  
  if (testUsers.length === 0) {
    console.log('⚠️ No test users found for cleanup');
    return;
  }
  
  // Clean up test teams
  for (const userId of testUsers) {
    try {
      const teamsQuery = query(
        collection(db, 'userTeams'),
        where('userId', '==', userId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      
      for (const teamDoc of teamsSnapshot.docs) {
        await deleteDoc(teamDoc.ref);
        console.log(`🗑️ Deleted test team: ${teamDoc.id}`);
      }
    } catch (error) {
      console.error(`❌ Failed to cleanup teams for user ${userId}:`, error.message);
    }
  }
  
  // Clean up test battle rooms
  try {
    const roomsQuery = query(
      collection(db, 'battle_rooms'),
      where('hostId', 'in', testUsers)
    );
    const roomsSnapshot = await getDocs(roomsQuery);
    
    for (const roomDoc of roomsSnapshot.docs) {
      await deleteDoc(roomDoc.ref);
      console.log(`🗑️ Deleted test room: ${roomDoc.id}`);
    }
  } catch (error) {
    console.error('❌ Failed to cleanup test rooms:', error.message);
  }
  
  // Clean up test battles
  try {
    const battlesQuery = query(
      collection(db, 'battles'),
      where('hostId', 'in', testUsers)
    );
    const battlesSnapshot = await getDocs(battlesQuery);
    
    for (const battleDoc of battlesSnapshot.docs) {
      await deleteDoc(battleDoc.ref);
      console.log(`🗑️ Deleted test battle: ${battleDoc.id}`);
    }
  } catch (error) {
    console.error('❌ Failed to cleanup test battles:', error.message);
  }
}

async function cleanupTestDataClient(db) {
  console.log('🗑️ Cleaning up test data...');
  
  // Get all test users
  const testUserEmails = Object.values(TEST_USERS).map(user => user.email);
  const testUsers = [];
  
  for (const email of testUserEmails) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, TEST_USERS[Object.keys(TEST_USERS).find(key => TEST_USERS[key].email === email)].password);
      testUsers.push(userCredential.user.uid);
    } catch (error) {
      // User doesn't exist, skip
    }
  }
  
  if (testUsers.length === 0) {
    console.log('⚠️ No test users found for cleanup');
    return;
  }
  
  // Clean up test teams
  for (const userId of testUsers) {
    try {
      const teamsQuery = query(
        collection(db, 'userTeams'),
        where('userId', '==', userId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      
      for (const teamDoc of teamsSnapshot.docs) {
        await deleteDoc(teamDoc.ref);
        console.log(`🗑️ Deleted test team: ${teamDoc.id}`);
      }
    } catch (error) {
      console.error(`❌ Failed to cleanup teams for user ${userId}:`, error.message);
    }
  }
  
  // Clean up test battle rooms
  try {
    const roomsQuery = query(
      collection(db, 'battle_rooms'),
      where('hostId', 'in', testUsers)
    );
    const roomsSnapshot = await getDocs(roomsQuery);
    
    for (const roomDoc of roomsSnapshot.docs) {
      await deleteDoc(roomDoc.ref);
      console.log(`🗑️ Deleted test room: ${roomDoc.id}`);
    }
  } catch (error) {
    console.error('❌ Failed to cleanup test rooms:', error.message);
  }
  
  // Clean up test battles
  try {
    const battlesQuery = query(
      collection(db, 'battles'),
      where('hostId', 'in', testUsers)
    );
    const battlesSnapshot = await getDocs(battlesQuery);
    
    for (const battleDoc of battlesSnapshot.docs) {
      await deleteDoc(battleDoc.ref);
      console.log(`🗑️ Deleted test battle: ${battleDoc.id}`);
    }
  } catch (error) {
    console.error('❌ Failed to cleanup test battles:', error.message);
  }
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'setup':
    setupTestUsers();
    break;
  case 'cleanup':
    cleanupTestUsers();
    break;
  default:
    console.log('Usage: node setup-test-users.js [setup|cleanup]');
    console.log('  setup   - Create test users and teams');
    console.log('  cleanup - Delete test users and data');
    process.exit(1);
}