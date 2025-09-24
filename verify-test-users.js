#!/usr/bin/env node

/**
 * Verify Test Users
 * 
 * This script verifies that the test users can authenticate and access
 * their teams and profiles.
 * 
 * Usage: node verify-test-users.js
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

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

// Test user credentials
const TEST_USERS = [
  {
    email: 'testbattle1@pokemon.test',
    password: 'testbattle123',
    expectedUid: 'axEUHeNI2icyOL62HqZynoH4SWk1'
  },
  {
    email: 'testbattle2@pokemon.test',
    password: 'testbattle123',
    expectedUid: 'ruIS3D8VQtXeOKjho3KWf50keq92'
  }
];

async function verifyUser(userConfig) {
  try {
    console.log(`\n🔍 Verifying user: ${userConfig.email}`);
    
    // Test authentication
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      userConfig.email, 
      userConfig.password
    );
    
    const user = userCredential.user;
    console.log(`✅ Authentication successful`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Expected UID: ${userConfig.expectedUid}`);
    console.log(`   Match: ${user.uid === userConfig.expectedUid ? '✅' : '❌'}`);
    
    // Test profile access
    const profileRef = doc(db, 'userProfiles', user.uid);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      const profile = profileSnap.data();
      console.log(`✅ Profile accessible`);
      console.log(`   Display Name: ${profile.displayName}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Is Test User: ${profile.isTestUser}`);
    } else {
      console.log(`❌ Profile not found`);
    }
    
    // Test team access
    const teamId = `test-team-${user.uid}`;
    const teamRef = doc(db, 'userTeams', teamId);
    const teamSnap = await getDoc(teamRef);
    
    if (teamSnap.exists()) {
      const team = teamSnap.data();
      console.log(`✅ Team accessible`);
      console.log(`   Team Name: ${team.name}`);
      console.log(`   Pokemon Count: ${team.slots.length}`);
      console.log(`   Pokemon: ${team.slots.map(slot => slot.id).join(', ')}`);
    } else {
      console.log(`❌ Team not found`);
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Verification failed: ${error.message}`);
    return false;
  }
}

async function verifyAllUsers() {
  console.log('🚀 Verifying test users...');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const userConfig of TEST_USERS) {
    const result = await verifyUser(userConfig);
    results.push(result);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Verification Results:');
  
  const successful = results.filter(r => r === true);
  const failed = results.filter(r => r === false);
  
  console.log(`✅ Successful: ${successful.length}/${TEST_USERS.length}`);
  console.log(`❌ Failed: ${failed.length}/${TEST_USERS.length}`);
  
  if (successful.length === TEST_USERS.length) {
    console.log('\n🎉 All test users are ready for browser testing!');
    console.log('\n🌐 Next steps:');
    console.log('1. Open two browsers');
    console.log('2. Navigate to your Pokemon battle app');
    console.log('3. Sign in with the test users');
    console.log('4. Test the complete battle flow');
    console.log('\n📱 Run "node monitor-battle-flow.js" to monitor the battle flow in real-time');
  } else {
    console.log('\n❌ Some test users failed verification. Check the errors above.');
  }
  
  return results;
}

// Run verification
verifyAllUsers().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
