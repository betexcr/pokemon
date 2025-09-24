#!/usr/bin/env node

/**
 * Battle Flow Monitor
 * 
 * This script monitors the battle flow in real-time to help debug
 * any issues during browser testing with testbattle1 and testbattle2.
 * 
 * Usage: node monitor-battle-flow.js
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, doc, onSnapshot, query, orderBy, limit } = require('firebase/firestore');

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
const TEST_USERS = {
  testbattle1: {
    email: 'testbattle1@pokemon.test',
    password: 'testbattle123',
    uid: 'axEUHeNI2icyOL62HqZynoH4SWk1'
  },
  testbattle2: {
    email: 'testbattle2@pokemon.test',
    password: 'testbattle123',
    uid: 'ruIS3D8VQtXeOKjho3KWf50keq92'
  }
};

// Monitoring state
let isMonitoring = false;
let roomListeners = new Map();
let battleListeners = new Map();

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function formatUser(userId) {
  if (userId === TEST_USERS.testbattle1.uid) return 'testbattle1';
  if (userId === TEST_USERS.testbattle2.uid) return 'testbattle2';
  return userId;
}

// Authentication
async function authenticateMonitor() {
  try {
    log('Authenticating monitor...');
    await signInWithEmailAndPassword(auth, TEST_USERS.testbattle1.email, TEST_USERS.testbattle1.password);
    log('Monitor authenticated successfully', 'success');
    return true;
  } catch (error) {
    log(`Monitor authentication failed: ${error.message}`, 'error');
    return false;
  }
}

// Room monitoring
function startRoomMonitoring() {
  log('Starting room monitoring...');
  
  const roomsQuery = query(
    collection(db, 'battle_rooms'),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  
  const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const roomData = change.doc.data();
      const roomId = change.doc.id;
      
      if (change.type === 'added') {
        log(`🆕 Room created: ${roomId} by ${formatUser(roomData.hostId)}`, 'success');
      } else if (change.type === 'modified') {
        log(`🔄 Room updated: ${roomId}`, 'info');
        
        // Check for specific changes
        if (roomData.guestId && roomData.guestId !== roomData.hostId) {
          log(`   👥 Guest joined: ${formatUser(roomData.guestId)}`, 'success');
        }
        
        if (roomData.hostTeam) {
          log(`   🎯 Host team selected: ${roomData.hostTeam.name}`, 'success');
        }
        
        if (roomData.guestTeam) {
          log(`   🎯 Guest team selected: ${roomData.guestTeam.name}`, 'success');
        }
        
        if (roomData.status === 'ready') {
          log(`   ✅ Room ready for battle!`, 'success');
        }
      } else if (change.type === 'removed') {
        log(`🗑️ Room deleted: ${roomId}`, 'warning');
      }
    });
  });
  
  roomListeners.set('main', unsubscribe);
  log('Room monitoring started', 'success');
}

// Battle monitoring
function startBattleMonitoring() {
  log('Starting battle monitoring...');
  
  const battlesQuery = query(
    collection(db, 'battles'),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  
  const unsubscribe = onSnapshot(battlesQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const battleData = change.doc.data();
      const battleId = change.doc.id;
      
      if (change.type === 'added') {
        log(`⚔️ Battle created: ${battleId}`, 'success');
        log(`   👥 Players: ${formatUser(battleData.hostId)} vs ${formatUser(battleData.guestId)}`, 'info');
        log(`   🏠 Room: ${battleData.roomId}`, 'info');
      } else if (change.type === 'modified') {
        log(`🔄 Battle updated: ${battleId}`, 'info');
        
        // Check for specific changes
        if (battleData.phase) {
          log(`   📊 Phase: ${battleData.phase}`, 'info');
        }
        
        if (battleData.turnNumber) {
          log(`   🔄 Turn: ${battleData.turnNumber}`, 'info');
        }
        
        if (battleData.status === 'completed') {
          log(`   🏆 Battle completed! Winner: ${battleData.winner || 'Unknown'}`, 'success');
        }
        
        if (battleData.actions && battleData.actions.length > 0) {
          const lastAction = battleData.actions[battleData.actions.length - 1];
          log(`   ⚡ Last action: ${lastAction.type || 'Unknown'}`, 'info');
        }
      } else if (change.type === 'removed') {
        log(`🗑️ Battle deleted: ${battleId}`, 'warning');
      }
    });
  });
  
  battleListeners.set('main', unsubscribe);
  log('Battle monitoring started', 'success');
}

// Chat monitoring
function startChatMonitoring() {
  log('Starting chat monitoring...');
  
  const chatQuery = query(
    collection(db, 'chat_messages'),
    orderBy('timestamp', 'desc'),
    limit(20)
  );
  
  const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const messageData = change.doc.data();
      
      if (change.type === 'added') {
        log(`💬 Chat: ${formatUser(messageData.userId)}: ${messageData.message}`, 'info');
      }
    });
  });
  
  log('Chat monitoring started', 'success');
}

// Start monitoring
async function startMonitoring() {
  log('🚀 Starting Battle Flow Monitor', 'info');
  log('=' .repeat(60), 'info');
  
  // Authenticate
  const authenticated = await authenticateMonitor();
  if (!authenticated) {
    log('❌ Failed to authenticate monitor', 'error');
    return;
  }
  
  // Start monitoring
  startRoomMonitoring();
  startBattleMonitoring();
  startChatMonitoring();
  
  isMonitoring = true;
  
  log('=' .repeat(60), 'info');
  log('🎯 Monitor is now watching for battle activity...', 'success');
  log('📱 Open your browsers and start testing!', 'info');
  log('🛑 Press Ctrl+C to stop monitoring', 'info');
  log('=' .repeat(60), 'info');
}

// Stop monitoring
function stopMonitoring() {
  log('🛑 Stopping monitor...', 'warning');
  
  // Unsubscribe from all listeners
  roomListeners.forEach((unsubscribe) => unsubscribe());
  battleListeners.forEach((unsubscribe) => unsubscribe());
  
  roomListeners.clear();
  battleListeners.clear();
  
  isMonitoring = false;
  log('✅ Monitor stopped', 'success');
}

// Handle process termination
process.on('SIGINT', () => {
  stopMonitoring();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled rejection: ${reason}`, 'error');
});

// Start the monitor
startMonitoring().catch(error => {
  log(`❌ Monitor failed to start: ${error.message}`, 'error');
  process.exit(1);
});
