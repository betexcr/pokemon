#!/usr/bin/env node

/**
 * Custom Test User Setup for Specific UIDs
 * 
 * This script creates test users with specific UIDs for E2E testing.
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

// Custom test users with specific UIDs
const CUSTOM_TEST_USERS = {
  testbattle1: {
    uid: 'testbattle1-cli-uid',
    email: 'testbattle1@pokemon-battles.test',
    password: 'TestBattle123!',
    displayName: 'Test Battle 1',
  },
  testbattle2: {
    uid: 'testbattle2-cli-uid',
    email: 'testbattle2@pokemon-battles.test',
    password: 'TestBattle123!',
    displayName: 'Test Battle 2',
  }
};

async function setupCustomTestUsers() {
  console.log('🚀 Setting up custom test users with specific UIDs...');
  
  try {
    // Initialize Firebase Admin
    if (!firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
      console.log('⚠️ Firebase Admin credentials not found. Using client SDK instead...');
      await setupCustomTestUsersWithClientSDK();
      return;
    }
    
    const app = initializeApp({
      credential: cert(firebaseConfig),
      projectId: firebaseConfig.projectId,
    });
    
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Clean up existing test users
    await cleanupCustomTestUsers(auth);
    
    // Create test users with specific UIDs
    const testUsers = await createCustomTestUsers(auth);
    
    // Create test teams
    await createCustomTestTeams(db, testUsers);
    
    console.log('✅ Custom test users setup completed successfully');
    console.log(`📊 Created ${Object.keys(testUsers).length} test users with specific UIDs`);
    
  } catch (error) {
    console.error('❌ Failed to setup custom test users:', error.message);
    process.exit(1);
  }
}

async function setupCustomTestUsersWithClientSDK() {
  console.log('🔄 Using Firebase Client SDK for custom test user setup...');
  
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
  await cleanupCustomTestUsersClient(auth);
  
  // Create test users (Note: Client SDK doesn't allow custom UIDs)
  console.log('⚠️ Client SDK cannot create users with custom UIDs. Using default UIDs...');
  const testUsers = await createCustomTestUsersClient(auth);
  
  // Create test teams
  await createCustomTestTeamsClient(db, testUsers);
  
  console.log('✅ Custom test users setup completed successfully');
  console.log(`📊 Created ${Object.keys(testUsers).length} test users`);
}

async function cleanupCustomTestUsers(auth) {
  console.log('🧹 Cleaning up existing custom test users...');
  
  for (const [key, user] of Object.entries(CUSTOM_TEST_USERS)) {
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

async function cleanupCustomTestUsersClient(auth) {
  console.log('🧹 Cleaning up existing custom test users...');
  
  for (const [key, user] of Object.entries(CUSTOM_TEST_USERS)) {
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

async function createCustomTestUsers(auth) {
  const testUsers = {};
  
  for (const [key, userData] of Object.entries(CUSTOM_TEST_USERS)) {
    try {
      // Create user with custom UID
      const userRecord = await auth.createUser({
        uid: userData.uid,
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

async function createCustomTestUsersClient(auth) {
  const testUsers = {};
  
  for (const [key, userData] of Object.entries(CUSTOM_TEST_USERS)) {
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
        uid: userCredential.user.uid, // This will be a generated UID, not custom
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

async function createCustomTestTeams(db, testUsers) {
  // Create comprehensive 6-Pokemon teams for multiplayer battle testing
  const testTeams = {
    testbattle1: {
      name: 'Battle Team 1',
      slots: [
        { id: 25, level: 50, moves: [1, 2, 3, 4] }, // Pikachu
        { id: 6, level: 50, moves: [1, 2, 3, 4] }, // Charizard
        { id: 9, level: 50, moves: [1, 2, 3, 4] }, // Blastoise
        { id: 3, level: 50, moves: [1, 2, 3, 4] }, // Venusaur
        { id: 143, level: 50, moves: [1, 2, 3, 4] }, // Snorlax
        { id: 149, level: 50, moves: [1, 2, 3, 4] }, // Dragonite
      ],
      createdAt: new Date(),
    },
    testbattle2: {
      name: 'Battle Team 2',
      slots: [
        { id: 150, level: 50, moves: [1, 2, 3, 4] }, // Mewtwo
        { id: 144, level: 50, moves: [1, 2, 3, 4] }, // Articuno
        { id: 145, level: 50, moves: [1, 2, 3, 4] }, // Zapdos
        { id: 146, level: 50, moves: [1, 2, 3, 4] }, // Moltres
        { id: 130, level: 50, moves: [1, 2, 3, 4] }, // Gyarados
        { id: 94, level: 50, moves: [1, 2, 3, 4] }, // Gengar
      ],
      createdAt: new Date(),
    }
  };
  
  for (const [key, user] of Object.entries(testUsers)) {
    try {
      const teamData = testTeams[key];
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

async function createCustomTestTeamsClient(db, testUsers) {
  // Create comprehensive 6-Pokemon teams for multiplayer battle testing
  const testTeams = {
    testbattle1: {
      name: 'Battle Team 1',
      slots: [
        { id: 25, level: 50, moves: [1, 2, 3, 4] }, // Pikachu
        { id: 6, level: 50, moves: [1, 2, 3, 4] }, // Charizard
        { id: 9, level: 50, moves: [1, 2, 3, 4] }, // Blastoise
        { id: 3, level: 50, moves: [1, 2, 3, 4] }, // Venusaur
        { id: 143, level: 50, moves: [1, 2, 3, 4] }, // Snorlax
        { id: 149, level: 50, moves: [1, 2, 3, 4] }, // Dragonite
      ],
      createdAt: new Date(),
    },
    testbattle2: {
      name: 'Battle Team 2',
      slots: [
        { id: 150, level: 50, moves: [1, 2, 3, 4] }, // Mewtwo
        { id: 144, level: 50, moves: [1, 2, 3, 4] }, // Articuno
        { id: 145, level: 50, moves: [1, 2, 3, 4] }, // Zapdos
        { id: 146, level: 50, moves: [1, 2, 3, 4] }, // Moltres
        { id: 130, level: 50, moves: [1, 2, 3, 4] }, // Gyarados
        { id: 94, level: 50, moves: [1, 2, 3, 4] }, // Gengar
      ],
      createdAt: new Date(),
    }
  };
  
  for (const [key, user] of Object.entries(testUsers)) {
    try {
      const teamData = testTeams[key];
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

async function cleanupCustomTestUsers() {
  console.log('🧹 Cleaning up custom test users...');
  
  try {
    // Initialize Firebase Admin
    if (!firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
      console.log('⚠️ Firebase Admin credentials not found. Using client SDK instead...');
      await cleanupCustomTestUsersWithClientSDK();
      return;
    }
    
    const app = initializeApp({
      credential: cert(firebaseConfig),
      projectId: firebaseConfig.projectId,
    });
    
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Clean up test users
    await cleanupCustomTestUsers(auth);
    
    // Clean up test data
    await cleanupCustomTestData(db);
    
    console.log('✅ Custom test users cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Failed to cleanup custom test users:', error.message);
    process.exit(1);
  }
}

async function cleanupCustomTestUsersWithClientSDK() {
  console.log('🔄 Using Firebase Client SDK for custom test user cleanup...');
  
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
  await cleanupCustomTestUsersClient(auth);
  
  // Clean up test data
  await cleanupCustomTestDataClient(db);
  
  console.log('✅ Custom test users cleanup completed successfully');
}

async function cleanupCustomTestData(db) {
  console.log('🗑️ Cleaning up custom test data...');
  
  // Get all test users
  const testUserEmails = Object.values(CUSTOM_TEST_USERS).map(user => user.email);
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
    console.log('⚠️ No custom test users found for cleanup');
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

async function cleanupCustomTestDataClient(db) {
  console.log('🗑️ Cleaning up custom test data...');
  
  // Get all test users
  const testUserEmails = Object.values(CUSTOM_TEST_USERS).map(user => user.email);
  const testUsers = [];
  
  for (const email of testUserEmails) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, CUSTOM_TEST_USERS[Object.keys(CUSTOM_TEST_USERS).find(key => CUSTOM_TEST_USERS[key].email === email)].password);
      testUsers.push(userCredential.user.uid);
    } catch (error) {
      // User doesn't exist, skip
    }
  }
  
  if (testUsers.length === 0) {
    console.log('⚠️ No custom test users found for cleanup');
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
    setupCustomTestUsers();
    break;
  case 'cleanup':
    cleanupCustomTestUsers();
    break;
  default:
    console.log('Usage: node setup-custom-test-users.js [setup|cleanup]');
    console.log('  setup   - Create test users with specific UIDs');
    console.log('  cleanup - Delete test users and data');
    process.exit(1);
}
