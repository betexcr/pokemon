import { FullConfig } from '@playwright/test';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test cleanup...');
  
  // Initialize Firebase
  let app;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  // Get test users data
  const testUsersData = process.env.TEST_USERS_DATA;
  if (!testUsersData) {
    console.log('⚠️ No test users data found for cleanup');
    return;
  }
  
  const testUsers = JSON.parse(testUsersData);
  
  // Clean up test data
  await cleanupTestData(db, testUsers);
  
  // Clean up test users
  await cleanupTestUsers(auth, testUsers);
  
  console.log('✅ E2E test cleanup completed successfully');
}

async function cleanupTestData(db: any, testUsers: any) {
  console.log('🗑️ Cleaning up test data...');
  
  // Clean up test teams
  for (const [key, user] of Object.entries(testUsers)) {
    try {
      const teamsQuery = query(
        collection(db, 'userTeams'),
        where('userId', '==', user.uid)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      
      for (const teamDoc of teamsSnapshot.docs) {
        await deleteDoc(teamDoc.ref);
        console.log(`🗑️ Deleted test team: ${teamDoc.id}`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to cleanup teams for ${user.email}:`, error.message);
    }
  }
  
  // Clean up test battle rooms
  try {
    const roomsQuery = query(
      collection(db, 'battle_rooms'),
      where('hostId', 'in', Object.values(testUsers).map((user: any) => user.uid))
    );
    const roomsSnapshot = await getDocs(roomsQuery);
    
    for (const roomDoc of roomsSnapshot.docs) {
      await deleteDoc(roomDoc.ref);
      console.log(`🗑️ Deleted test room: ${roomDoc.id}`);
    }
  } catch (error: any) {
    console.error('❌ Failed to cleanup test rooms:', error.message);
  }
  
  // Clean up test battles
  try {
    const battlesQuery = query(
      collection(db, 'battles'),
      where('hostId', 'in', Object.values(testUsers).map((user: any) => user.uid))
    );
    const battlesSnapshot = await getDocs(battlesQuery);
    
    for (const battleDoc of battlesSnapshot.docs) {
      await deleteDoc(battleDoc.ref);
      console.log(`🗑️ Deleted test battle: ${battleDoc.id}`);
    }
  } catch (error: any) {
    console.error('❌ Failed to cleanup test battles:', error.message);
  }
}

async function cleanupTestUsers(auth: any, testUsers: any) {
  console.log('👤 Cleaning up test users...');
  
  for (const [key, user] of Object.entries(testUsers)) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
      await deleteUser(userCredential.user);
      console.log(`🗑️ Deleted test user: ${user.email}`);
    } catch (error: any) {
      console.error(`❌ Failed to delete test user ${user.email}:`, error.message);
    }
  }
}

export default globalTeardown;
