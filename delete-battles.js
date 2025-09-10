const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

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

async function deleteAllBattleData() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('🧹 Starting deletion of all battle data...');

    // Delete battle rooms
    console.log('📦 Deleting battle rooms...');
    const roomsSnapshot = await getDocs(collection(db, 'battle_rooms'));
    const roomPromises = [];
    
    roomsSnapshot.forEach((roomDoc) => {
      console.log(`🗑️  Deleting room: ${roomDoc.id}`);
      roomPromises.push(deleteDoc(doc(db, 'battle_rooms', roomDoc.id)));
    });

    await Promise.all(roomPromises);
    console.log(`✅ Deleted ${roomsSnapshot.size} battle rooms`);

    // Delete battles
    console.log('⚔️  Deleting battles...');
    const battlesSnapshot = await getDocs(collection(db, 'battles'));
    const battlePromises = [];
    
    battlesSnapshot.forEach((battleDoc) => {
      console.log(`🗑️  Deleting battle: ${battleDoc.id}`);
      battlePromises.push(deleteDoc(doc(db, 'battles', battleDoc.id)));
    });

    await Promise.all(battlePromises);
    console.log(`✅ Deleted ${battlesSnapshot.size} battles`);

    // Delete chat messages
    console.log('💬 Deleting chat messages...');
    const chatSnapshot = await getDocs(collection(db, 'chat_messages'));
    const chatPromises = [];
    
    chatSnapshot.forEach((chatDoc) => {
      console.log(`🗑️  Deleting chat message: ${chatDoc.id}`);
      chatPromises.push(deleteDoc(doc(db, 'chat_messages', chatDoc.id)));
    });

    await Promise.all(chatPromises);
    console.log(`✅ Deleted ${chatSnapshot.size} chat messages`);

    console.log('🎉 All battle data deleted successfully!');
    console.log('📊 Summary:');
    console.log(`   - Battle rooms: ${roomsSnapshot.size} deleted`);
    console.log(`   - Battles: ${battlesSnapshot.size} deleted`);
    console.log(`   - Chat messages: ${chatSnapshot.size} deleted`);

  } catch (error) {
    console.error('❌ Error during deletion:', error);
    process.exit(1);
  }
}

// Run the deletion
deleteAllBattleData();



