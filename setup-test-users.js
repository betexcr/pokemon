#!/usr/bin/env node

/**
 * Setup Test Users for Battle Flow Testing
 * 
 * This script creates testbattle1 and testbattle2 users for testing
 * the battle flow in two separate browsers.
 * 
 * Usage: node setup-test-users.js
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASbdOWHRBH_QAqpjRrp9KyzPWheNuUZmY",
  authDomain: "pokemon-battles-86a0d.firebaseapp.com",
  databaseURL: "https://pokemon-battles-86a0d-default-rtdb.firebaseio.com",
  projectId: "pokemon-battles-86a0d",
  storageBucket: "pokemon-battles-86a0d.firebasestorage.app",
  messagingSenderId: "665621845004",
  appId: "1:665621845004:web:2c5505206389d807ed0a29"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test user configuration
const TEST_USERS = [
  {
    email: 'testbattle1@pokemon.test',
    password: 'testbattle123',
    displayName: 'Test Battle 1',
    uid: null
  },
  {
    email: 'testbattle2@pokemon.test',
    password: 'testbattle123',
    displayName: 'Test Battle 2',
    uid: null
  }
];

async function createTestUser(userConfig) {
  try {
    console.log(`Creating user: ${userConfig.email}`);
    
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userConfig.email, 
      userConfig.password
    );
    
    const user = userCredential.user;
    userConfig.uid = user.uid;
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'userProfiles', user.uid), {
      userId: user.uid,
      email: userConfig.email,
      displayName: userConfig.displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isTestUser: true
    });
    
    // Create a test team for the user
    const testTeam = {
      id: `test-team-${user.uid}`,
      name: `${userConfig.displayName} Team`,
      userId: user.uid,
      slots: [
        {
          id: 25, // Pikachu
          level: 50,
          moves: [
            { id: 'tackle', pp: 35, maxPp: 35 },
            { id: 'thunderbolt', pp: 15, maxPp: 15 },
            { id: 'quick-attack', pp: 30, maxPp: 30 },
            { id: 'thunder', pp: 10, maxPp: 10 }
          ]
        },
        {
          id: 1, // Bulbasaur
          level: 50,
          moves: [
            { id: 'tackle', pp: 35, maxPp: 35 },
            { id: 'vine-whip', pp: 25, maxPp: 25 },
            { id: 'razor-leaf', pp: 25, maxPp: 25 },
            { id: 'solar-beam', pp: 10, maxPp: 10 }
          ]
        }
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPublic: true
    };
    
    await setDoc(doc(db, 'userTeams', testTeam.id), testTeam);
    
    console.log(`✅ User created successfully: ${userConfig.displayName} (${user.uid})`);
    console.log(`   Email: ${userConfig.email}`);
    console.log(`   Team: ${testTeam.name}`);
    
    return userConfig;
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️  User already exists: ${userConfig.email}`);
      
      // Try to sign in to get the user
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth, 
          userConfig.email, 
          userConfig.password
        );
        userConfig.uid = userCredential.user.uid;
        console.log(`✅ User signed in: ${userConfig.displayName} (${userConfig.uid})`);
        return userConfig;
      } catch (signInError) {
        console.error(`❌ Failed to sign in user ${userConfig.email}:`, signInError.message);
        return null;
      }
    } else {
      console.error(`❌ Failed to create user ${userConfig.email}:`, error.message);
      return null;
    }
  }
}

async function setupTestUsers() {
  console.log('🚀 Setting up test users for battle flow testing...');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const userConfig of TEST_USERS) {
    const result = await createTestUser(userConfig);
    results.push(result);
    console.log(''); // Empty line for readability
  }
  
  console.log('=' .repeat(60));
  console.log('📊 Test User Setup Results:');
  
  const successful = results.filter(r => r !== null);
  const failed = results.filter(r => r === null);
  
  console.log(`✅ Successful: ${successful.length}/${TEST_USERS.length}`);
  console.log(`❌ Failed: ${failed.length}/${TEST_USERS.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎯 Test Users Ready:');
    successful.forEach(user => {
      console.log(`   • ${user.displayName} (${user.email})`);
      console.log(`     UID: ${user.uid}`);
      console.log(`     Password: ${user.password}`);
    });
    
    console.log('\n🌐 Browser Test Instructions:');
    console.log('1. Open two separate browsers (Chrome, Firefox, Safari, etc.)');
    console.log('2. Navigate to your Pokemon battle app');
    console.log('3. Sign in with the test users:');
    console.log(`   Browser 1: ${successful[0].email} / ${successful[0].password}`);
    console.log(`   Browser 2: ${successful[1].email} / ${successful[1].password}`);
    console.log('4. Test the complete battle flow');
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Users:');
    failed.forEach((_, index) => {
      const userConfig = TEST_USERS[index];
      console.log(`   • ${userConfig.email}`);
    });
  }
  
  console.log('\n🎯 Test user setup complete!');
  
  return results;
}

// Run the setup
setupTestUsers().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});