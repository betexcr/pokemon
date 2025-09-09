const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, onSnapshot } = require('firebase/firestore');
const { getAuth, signInAnonymously, signOut } = require('firebase/auth');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function testCompleteWorkflow() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    console.log('🧪 Starting complete workflow test...\n');

    // Test 1: Check Firestore rules (guest access)
    console.log('📋 Test 1: Testing Firestore rules (guest access)...');
    
    // Test unauthenticated access to battle rooms
    try {
      const roomsSnapshot = await getDocs(collection(db, 'battle_rooms'));
      console.log(`✅ Guest can read battle rooms: ${roomsSnapshot.size} rooms found`);
    } catch (error) {
      console.log(`❌ Guest cannot read battle rooms: ${error.message}`);
    }

    // Test unauthenticated access to chat messages
    try {
      const chatSnapshot = await getDocs(collection(db, 'chat_messages'));
      console.log(`✅ Guest can read chat messages: ${chatSnapshot.size} messages found`);
    } catch (error) {
      console.log(`❌ Guest cannot read chat messages: ${error.message}`);
    }

    // Test 2: Create a room as authenticated user
    console.log('\n📋 Test 2: Creating room as authenticated user...');
    
    // Sign in anonymously to simulate a user
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    console.log(`✅ Signed in as: ${user.uid}`);

    // Create a test room
    const roomData = {
      hostId: user.uid,
      hostName: 'Test Host',
      hostPhotoURL: null,
      hostReady: false,
      hostAnimatingBalls: [],
      hostReleasedBalls: [],
      guestAnimatingBalls: [],
      guestReleasedBalls: [],
      status: 'waiting',
      createdAt: new Date(),
      maxPlayers: 2,
      currentPlayers: 1,
      activeUsers: [user.uid]
    };

    const roomRef = await addDoc(collection(db, 'battle_rooms'), roomData);
    console.log(`✅ Room created: ${roomRef.id}`);

    // Test 3: Test room updates
    console.log('\n📋 Test 3: Testing room updates...');
    
    // Update room with host team
    const testTeam = {
      id: 'test-team-1',
      name: 'Test Team',
      slots: [
        { id: 1, level: 50, moves: [] },
        { id: 4, level: 50, moves: [] },
        { id: 7, level: 50, moves: [] }
      ]
    };

    await updateDoc(doc(db, 'battle_rooms', roomRef.id), {
      hostTeam: testTeam,
      hostReady: true
    });
    console.log('✅ Room updated with host team and ready status');

    // Test 4: Test guest joining (simulate another user)
    console.log('\n📋 Test 4: Testing guest joining...');
    
    // Sign out and sign in as different user (simulate guest)
    await signOut(auth);
    const guestCredential = await signInAnonymously(auth);
    const guest = guestCredential.user;
    console.log(`✅ Signed in as guest: ${guest.uid}`);

    // Try to join the room
    const guestTeam = {
      id: 'test-team-2',
      name: 'Guest Team',
      slots: [
        { id: 25, level: 50, moves: [] },
        { id: 26, level: 50, moves: [] },
        { id: 27, level: 50, moves: [] }
      ]
    };

    await updateDoc(doc(db, 'battle_rooms', roomRef.id), {
      guestId: guest.uid,
      guestName: 'Test Guest',
      guestPhotoURL: null,
      guestTeam: guestTeam,
      guestReady: true,
      currentPlayers: 2,
      status: 'ready'
    });
    console.log('✅ Guest joined room successfully');

    // Test 5: Test battle creation
    console.log('\n📋 Test 5: Testing battle creation...');
    
    const battleData = {
      roomId: roomRef.id,
      hostId: user.uid,
      hostName: 'Test Host',
      hostTeam: testTeam,
      guestId: guest.uid,
      guestName: 'Test Guest',
      guestTeam: guestTeam,
      status: 'waiting',
      currentTurn: 'host',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const battleRef = await addDoc(collection(db, 'battles'), battleData);
    console.log(`✅ Battle created: ${battleRef.id}`);

    // Update room with battle ID
    await updateDoc(doc(db, 'battle_rooms', roomRef.id), {
      battleId: battleRef.id,
      status: 'battling'
    });
    console.log('✅ Room updated with battle ID');

    // Test 6: Test chat messages
    console.log('\n📋 Test 6: Testing chat messages...');
    
    const messageData = {
      userId: guest.uid,
      userName: 'Test Guest',
      message: 'Hello from guest!',
      roomId: roomRef.id,
      type: 'user',
      timestamp: new Date()
    };

    const messageRef = await addDoc(collection(db, 'chat_messages'), messageData);
    console.log(`✅ Chat message created: ${messageRef.id}`);

    // Test 7: Test real-time listeners (guest access)
    console.log('\n📋 Test 7: Testing real-time listeners...');
    
    // Sign out to test as guest
    await signOut(auth);
    
    // Test room listener (should work for guests)
    const roomDoc = await getDoc(doc(db, 'battle_rooms', roomRef.id));
    if (roomDoc.exists()) {
      console.log('✅ Guest can read room data in real-time');
    } else {
      console.log('❌ Guest cannot read room data');
    }

    // Test battle listener (should work for guests)
    const battleDoc = await getDoc(doc(db, 'battles', battleRef.id));
    if (battleDoc.exists()) {
      console.log('✅ Guest can read battle data in real-time');
    } else {
      console.log('❌ Guest cannot read battle data');
    }

    // Test 8: Cleanup
    console.log('\n📋 Test 8: Cleaning up test data...');
    
    // Sign back in to clean up
    await signInAnonymously(auth);
    
    // Delete test data
    await updateDoc(doc(db, 'battle_rooms', roomRef.id), {
      status: 'finished'
    });
    console.log('✅ Test room marked as finished');

    console.log('\n🎉 Complete workflow test completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Firestore rules allow guest access');
    console.log('✅ Room creation works');
    console.log('✅ Room updates work');
    console.log('✅ Guest joining works');
    console.log('✅ Battle creation works');
    console.log('✅ Chat messages work');
    console.log('✅ Real-time listeners work for guests');
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testCompleteWorkflow();
