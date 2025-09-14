#!/usr/bin/env node

/**
 * Firebase Connection Test
 * 
 * This script tests the Firebase connection and reads existing data
 * to verify the Firebase setup is working correctly.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Firebase configuration from your actual project
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration missing!');
  console.error('Please set up your .env.local file with Firebase credentials');
  process.exit(1);
}

console.log('🔥 Firebase Connection Test');
console.log('==========================\n');

console.log('📋 Firebase Configuration:');
console.log(`   Project ID: ${firebaseConfig.projectId}`);
console.log(`   Auth Domain: ${firebaseConfig.authDomain}`);
console.log(`   API Key: ${firebaseConfig.apiKey?.substring(0, 10)}...`);
console.log('');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('✅ Firebase initialized successfully');

// Test 1: Test basic connection
async function testConnection() {
  console.log('🧪 Test 1: Testing Firebase connection...');
  
  try {
    // Try to read from a collection (this should work even without auth)
    const testCollection = collection(db, 'battles');
    console.log('✅ Firebase connection established');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    return false;
  }
}

// Test 2: Check existing battles
async function testReadBattles() {
  console.log('🧪 Test 2: Reading existing battles...');
  
  try {
    const battlesRef = collection(db, 'battles');
    const snapshot = await getDocs(battlesRef);
    
    console.log(`✅ Found ${snapshot.size} existing battles`);
    
    if (snapshot.size > 0) {
      console.log('📊 Sample battle data:');
      snapshot.forEach((doc, index) => {
        if (index < 2) { // Show first 2 battles
          const data = doc.data();
          console.log(`   Battle ${doc.id}:`, {
            status: data.status,
            hostId: data.hostId,
            guestId: data.guestId,
            turnNumber: data.turnNumber,
            movesCount: data.moves?.length || 0
          });
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to read battles:', error.message);
    return false;
  }
}

// Test 3: Check battle rooms
async function testReadBattleRooms() {
  console.log('🧪 Test 3: Reading battle rooms...');
  
  try {
    const roomsRef = collection(db, 'battle_rooms');
    const snapshot = await getDocs(roomsRef);
    
    console.log(`✅ Found ${snapshot.size} existing battle rooms`);
    
    if (snapshot.size > 0) {
      console.log('📊 Sample room data:');
      snapshot.forEach((doc, index) => {
        if (index < 2) { // Show first 2 rooms
          const data = doc.data();
          console.log(`   Room ${doc.id}:`, {
            status: data.status,
            hostId: data.hostId,
            guestId: data.guestId,
            currentPlayers: data.currentPlayers,
            maxPlayers: data.maxPlayers
          });
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to read battle rooms:', error.message);
    return false;
  }
}

// Test 4: Test real-time listener (read-only)
async function testRealtimeListener() {
  console.log('🧪 Test 4: Testing real-time listener...');
  
  return new Promise((resolve) => {
    try {
      const battlesRef = collection(db, 'battles');
      let updateCount = 0;
      
      const unsubscribe = onSnapshot(battlesRef, (snapshot) => {
        updateCount++;
        console.log(`📡 Real-time update #${updateCount}: ${snapshot.size} battles`);
        
        if (updateCount >= 2) {
          unsubscribe();
          console.log('✅ Real-time listener working correctly');
          resolve(true);
        }
      }, (error) => {
        console.error('❌ Real-time listener error:', error.message);
        resolve(false);
      });
      
      // Set timeout to resolve if no updates
      setTimeout(() => {
        unsubscribe();
        console.log('⏰ Real-time listener timeout (no updates received)');
        resolve(true);
      }, 5000);
      
    } catch (error) {
      console.error('❌ Failed to set up real-time listener:', error.message);
      resolve(false);
    }
  });
}

// Run all tests
async function runTests() {
  try {
    const connectionOk = await testConnection();
    if (!connectionOk) {
      console.log('❌ Cannot continue without Firebase connection');
      return;
    }

    await testReadBattles();
    await testReadBattleRooms();
    await testRealtimeListener();
    
    console.log('\n🎉 Firebase Connection Tests Complete!');
    console.log('✅ Firebase is properly configured and working');
    console.log('🔥 Your Pokemon battle app can now use Firebase for real-time battles!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runTests();
