// Test script to verify Firestore rules
// Run with: node test-firestore-rules.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, deleteDoc, getDoc, setDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "pokemon-battles-86a0d",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

async function testFirestoreRules() {
  console.log('🧪 Testing Firestore Rules...');
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  
  try {
    // Sign in as a test user (you'll need to create this user)
    console.log('🔐 Signing in...');
    const userCredential = await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
    const user = userCredential.user;
    console.log('✅ Signed in as:', user.uid);
    
    // Create a test battle document
    const testBattleId = 'test-battle-' + Date.now();
    const testBattleRef = doc(db, 'battles', testBattleId);
    
    console.log('📝 Creating test battle document...');
    await setDoc(testBattleRef, {
      hostId: user.uid,
      guestId: 'test-guest-id',
      status: 'active',
      roomId: 'test-room',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Test battle created:', testBattleId);
    
    // Try to delete the battle (should work since user is host)
    console.log('🗑️ Attempting to delete battle...');
    await deleteDoc(testBattleRef);
    console.log('✅ Battle deleted successfully!');
    
    // Test with a different user's battle (should fail)
    console.log('🧪 Testing deletion of another user\'s battle...');
    const otherBattleId = 'other-battle-' + Date.now();
    const otherBattleRef = doc(db, 'battles', otherBattleId);
    
    await setDoc(otherBattleRef, {
      hostId: 'other-user-id',
      guestId: 'test-guest-id',
      status: 'active',
      roomId: 'test-room',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    try {
      await deleteDoc(otherBattleRef);
      console.log('❌ ERROR: Should not have been able to delete other user\'s battle!');
    } catch (error) {
      console.log('✅ Correctly blocked deletion of other user\'s battle:', error.code);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Uncomment to run the test
// testFirestoreRules();
