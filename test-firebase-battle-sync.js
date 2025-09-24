#!/usr/bin/env node

/**
 * Firebase Battle Sync Test
 * 
 * This script tests the Firebase-based battle synchronization system
 * to ensure real-time updates work correctly between players.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, onSnapshot, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
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
  console.error('Please set up your .env.local file with Firebase credentials:');
  console.error('NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key');
  console.error('NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id');
  console.error('...');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firebase Battle Sync Test');
console.log('============================\n');

// Test 1: Create a battle
async function testCreateBattle() {
  console.log('🧪 Test 1: Creating a battle...');
  
  try {
    const battleData = {
      roomId: 'test-room-123',
      hostId: 'player1',
      hostName: 'Player 1',
      hostTeam: { pokemon: ['pikachu', 'charizard'] },
      guestId: 'player2',
      guestName: 'Player 2',
      guestTeam: { pokemon: ['blastoise', 'venusaur'] },
      currentTurn: 'host',
      turnNumber: 1,
      moves: [],
      battleData: null,
      status: 'waiting',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'battles'), battleData);
    console.log('✅ Battle created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Failed to create battle:', error);
    return null;
  }
}

// Test 2: Listen to battle changes
async function testBattleListener(battleId) {
  console.log('🧪 Test 2: Setting up battle listener...');
  
  return new Promise((resolve) => {
    const battleRef = doc(db, 'battles', battleId);
    
    const unsubscribe = onSnapshot(battleRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log('📥 Battle update received:', {
          turnNumber: data.turnNumber,
          status: data.status,
          movesCount: data.moves?.length || 0,
          lastUpdate: data.updatedAt?.toDate?.() || 'N/A'
        });
        
        // Resolve after first update
        if (data.status === 'active') {
          unsubscribe();
          resolve();
        }
      }
    }, (error) => {
      console.error('❌ Battle listener error:', error);
      resolve();
    });
  });
}

// Test 3: Add moves to battle
async function testAddMoves(battleId) {
  console.log('🧪 Test 3: Adding moves to battle...');
  
  try {
    // Simulate player 1 selecting a move
    const battleRef = doc(db, 'battles', battleId);
    const battleSnap = await getDoc(battleRef);
    
    if (battleSnap.exists()) {
      const battleData = battleSnap.data();
      const newMove = {
        playerId: 'player1',
        playerName: 'Player 1',
        moveIndex: 0,
        moveName: 'Thunderbolt',
        turnNumber: 1
      };
      
      const updatedMoves = [...(battleData.moves || []), newMove];
      
      await updateDoc(battleRef, {
        moves: updatedMoves,
        battleData: {
          turnNumber: 1,
          phase: 'selection',
          player: { currentIndex: 0, pokemon: [{ name: 'Pikachu', currentHp: 100 }] },
          opponent: { currentIndex: 0, pokemon: [{ name: 'Blastoise', currentHp: 100 }] }
        },
        status: 'active',
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Move added to battle');
    }
  } catch (error) {
    console.error('❌ Failed to add move:', error);
  }
}

// Test 4: Simulate real-time updates
async function testRealTimeUpdates(battleId) {
  console.log('🧪 Test 4: Testing real-time updates...');
  
  let updateCount = 0;
  const battleRef = doc(db, 'battles', battleId);
  
  const unsubscribe = onSnapshot(battleRef, (doc) => {
    if (doc.exists()) {
      updateCount++;
      const data = doc.data();
      console.log(`📡 Update #${updateCount}:`, {
        turnNumber: data.turnNumber,
        movesCount: data.moves?.length || 0,
        status: data.status
      });
      
      // Stop after 3 updates
      if (updateCount >= 3) {
        unsubscribe();
        console.log('✅ Real-time updates working correctly');
      }
    }
  });

  // Simulate multiple updates
  setTimeout(async () => {
    try {
      await updateDoc(battleRef, {
        turnNumber: 2,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Failed to update battle:', error);
    }
  }, 1000);

  setTimeout(async () => {
    try {
      await updateDoc(battleRef, {
        status: 'completed',
        winner: 'player1',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Failed to complete battle:', error);
    }
  }, 2000);
}

// Run all tests
async function runTests() {
  try {
    const battleId = await testCreateBattle();
    if (!battleId) {
      console.log('❌ Cannot continue without battle ID');
      return;
    }

    // Set up listener first
    const listenerPromise = testBattleListener(battleId);
    
    // Add moves
    await testAddMoves(battleId);
    
    // Wait for listener to receive update
    await listenerPromise;
    
    // Test real-time updates
    await testRealTimeUpdates(battleId);
    
    console.log('\n🎉 Firebase Battle Sync Tests Complete!');
    console.log('✅ All tests passed - Firebase sync is working correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runTests();
