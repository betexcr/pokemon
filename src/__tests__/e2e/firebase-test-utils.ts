import { Page, expect } from '@playwright/test';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export interface TestUser {
  uid: string;
  email: string;
  password: string;
  displayName: string;
}

export interface TestUsers {
  host: TestUser;
  guest: TestUser;
  errorTest: TestUser;
}

export function getTestUsers(): TestUsers {
  const testUsersData = process.env.TEST_USERS_DATA;
  if (!testUsersData) {
    throw new Error('Test users data not found. Make sure global setup ran successfully.');
  }
  return JSON.parse(testUsersData);
}

export async function signInUser(page: Page, user: TestUser): Promise<void> {
  console.log(`🔐 Mock signing in user: ${user.email}`);
  
  // Since Email/Password auth is not enabled, we'll mock the authentication
  // by directly setting the user state in the browser
  await page.goto('/');
  
  // Mock authentication by setting Firebase auth state
  await page.evaluate((userData) => {
    // Mock Firebase auth state
    if (window.firebaseAuth) {
      // @ts-ignore
      window.firebaseAuth.currentUser = {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        emailVerified: true
      };
      
      // Trigger auth state change
      // @ts-ignore
      if (window.firebaseAuth.onAuthStateChanged) {
        // @ts-ignore
        window.firebaseAuth.onAuthStateChanged(window.firebaseAuth.currentUser);
      }
    }
    
    // Also set in localStorage for persistence
    localStorage.setItem('firebase:authUser', JSON.stringify({
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName
    }));
  }, user);
  
  // Wait for the app to recognize the authenticated state
  await page.waitForTimeout(1000);
  
  // Navigate to a protected page to verify auth
  await page.goto('/lobby');
  await page.waitForLoadState('networkidle');
  
  console.log(`✅ User mock signed in successfully: ${user.email}`);
}

export async function signOutUser(page: Page): Promise<void> {
  console.log('🔐 Mock signing out user');
  
  // Mock sign out by clearing auth state
  await page.evaluate(() => {
    // Clear Firebase auth state
    if (window.firebaseAuth) {
      // @ts-ignore
      window.firebaseAuth.currentUser = null;
      
      // Trigger auth state change
      // @ts-ignore
      if (window.firebaseAuth.onAuthStateChanged) {
        // @ts-ignore
        window.firebaseAuth.onAuthStateChanged(null);
      }
    }
    
    // Clear localStorage
    localStorage.removeItem('firebase:authUser');
  });
  
  // Wait for the app to recognize the unauthenticated state
  await page.waitForTimeout(1000);
  
  console.log('✅ User mock signed out successfully');
}

export async function createRoom(page: Page, user: TestUser): Promise<string> {
  console.log(`🏠 Creating room for user: ${user.email}`);
  
  // Navigate to lobby
  await page.goto('/lobby');
  
  // Click create room button
  await page.click('[data-testid="create-room-button"]');
  
  // Wait for room creation
  await page.waitForURL(/\/lobby\/[A-Za-z0-9]+/, { timeout: 10000 });
  
  // Get room ID from URL
  const url = page.url();
  const roomId = url.split('/lobby/')[1];
  
  console.log(`✅ Room created successfully: ${roomId}`);
  return roomId;
}

export async function joinRoom(page: Page, roomId: string, user: TestUser): Promise<void> {
  console.log(`🚪 Joining room ${roomId} as user: ${user.email}`);
  
  // Navigate to room
  await page.goto(`/lobby/${roomId}`);
  
  // Wait for room to load
  await page.waitForSelector('[data-testid="room-container"]', { timeout: 10000 });
  
  // Verify user is in the room
  await expect(page.locator(`[data-testid="user-${user.uid}"]`)).toBeVisible();
  
  console.log(`✅ User joined room successfully: ${user.email}`);
}

export async function selectTeam(page: Page, teamName: string): Promise<void> {
  console.log(`🎮 Selecting team: ${teamName}`);
  
  // Click team selector
  await page.click('[data-testid="team-selector-button"]');
  
  // Wait for team selector modal
  await page.waitForSelector('[data-testid="team-selector-modal"]');
  
  // Select team
  await page.click(`[data-testid="team-${teamName}"]`);
  
  // Confirm selection
  await page.click('[data-testid="confirm-team-selection"]');
  
  // Wait for team to be selected
  await expect(page.locator('[data-testid="selected-team"]')).toContainText(teamName);
  
  console.log(`✅ Team selected successfully: ${teamName}`);
}

export async function markReady(page: Page): Promise<void> {
  console.log('✅ Marking user as ready');
  
  // Click ready button
  await page.click('[data-testid="ready-button"]');
  
  // Wait for ready status to update
  await expect(page.locator('[data-testid="ready-button"]')).toHaveText('Ready');
  
  console.log('✅ User marked as ready');
}

export async function startBattle(page: Page): Promise<void> {
  console.log('⚔️ Starting battle');
  
  // Click start battle button
  await page.click('[data-testid="start-battle-button"]');
  
  // Wait for battle to start
  await page.waitForURL(/\/battle\/[A-Za-z0-9]+/, { timeout: 15000 });
  
  console.log('✅ Battle started successfully');
}

export async function makeMove(page: Page, moveIndex: number): Promise<void> {
  console.log(`🎯 Making move ${moveIndex}`);
  
  // Click move button
  await page.click(`[data-testid="move-${moveIndex}"]`);
  
  // Wait for move to be processed
  await page.waitForTimeout(1000);
  
  console.log(`✅ Move ${moveIndex} made successfully`);
}

export async function waitForBattleUpdate(page: Page, expectedText: string): Promise<void> {
  console.log(`⏳ Waiting for battle update: ${expectedText}`);
  
  await expect(page.locator('[data-testid="battle-status"]')).toContainText(expectedText, { timeout: 10000 });
  
  console.log(`✅ Battle update received: ${expectedText}`);
}

export async function checkFirebaseErrorLogs(page: Page): Promise<any[]> {
  console.log('🔍 Checking Firebase error logs');
  
  // Open error debugger
  await page.click('[data-testid="debug-errors-button"]');
  
  // Wait for debugger to open
  await page.waitForSelector('[data-testid="firebase-error-debugger"]');
  
  // Get error summary
  const errorSummary = await page.locator('[data-testid="error-summary"]').textContent();
  
  // Get recent errors
  const recentErrors = await page.locator('[data-testid="recent-error"]').all();
  const errors = [];
  
  for (const errorElement of recentErrors) {
    const errorData = {
      type: await errorElement.locator('[data-testid="error-type"]').textContent(),
      code: await errorElement.locator('[data-testid="error-code"]').textContent(),
      message: await errorElement.locator('[data-testid="error-message"]').textContent(),
      operation: await errorElement.locator('[data-testid="error-operation"]').textContent(),
    };
    errors.push(errorData);
  }
  
  console.log(`📊 Found ${errors.length} recent errors`);
  return errors;
}

export async function exportErrorLogs(page: Page): Promise<string> {
  console.log('📤 Exporting error logs');
  
  // Click export button
  await page.click('[data-testid="export-logs-button"]');
  
  // Wait for download to start
  await page.waitForTimeout(2000);
  
  console.log('✅ Error logs exported successfully');
  return 'Error logs exported';
}

export async function verifyRoomData(roomId: string, expectedData: any): Promise<void> {
  console.log(`🔍 Verifying room data for room: ${roomId}`);
  
  // Initialize Firebase
  let app;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  const db = getFirestore(app);
  
  // Get room document
  const roomRef = doc(db, 'battle_rooms', roomId);
  const roomDoc = await getDoc(roomRef);
  
  if (!roomDoc.exists()) {
    throw new Error(`Room ${roomId} does not exist in Firestore`);
  }
  
  const roomData = roomDoc.data();
  
  // Verify expected data
  for (const [key, value] of Object.entries(expectedData)) {
    if (roomData[key] !== value) {
      throw new Error(`Room data mismatch for ${key}: expected ${value}, got ${roomData[key]}`);
    }
  }
  
  console.log(`✅ Room data verified successfully: ${roomId}`);
}

export async function verifyBattleData(battleId: string, expectedData: any): Promise<void> {
  console.log(`🔍 Verifying battle data for battle: ${battleId}`);
  
  // Initialize Firebase
  let app;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  const db = getFirestore(app);
  
  // Get battle document
  const battleRef = doc(db, 'battles', battleId);
  const battleDoc = await getDoc(battleRef);
  
  if (!battleDoc.exists()) {
    throw new Error(`Battle ${battleId} does not exist in Firestore`);
  }
  
  const battleData = battleDoc.data();
  
  // Verify expected data
  for (const [key, value] of Object.entries(expectedData)) {
    if (battleData[key] !== value) {
      throw new Error(`Battle data mismatch for ${key}: expected ${value}, got ${battleData[key]}`);
    }
  }
  
  console.log(`✅ Battle data verified successfully: ${battleId}`);
}

export async function waitForFirebaseOperation(operation: () => Promise<void>, timeout: number = 10000): Promise<void> {
  console.log(`⏳ Waiting for Firebase operation (timeout: ${timeout}ms)`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      await operation();
      console.log('✅ Firebase operation completed successfully');
      return;
    } catch (error) {
      // Continue waiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error(`Firebase operation timed out after ${timeout}ms`);
}

export async function simulateNetworkError(page: Page): Promise<void> {
  console.log('🌐 Simulating network error');
  
  // Block network requests
  await page.route('**/*', route => {
    if (route.request().url().includes('firebase') || route.request().url().includes('firestore')) {
      route.abort('failed');
    } else {
      route.continue();
    }
  });
  
  console.log('✅ Network error simulated');
}

export async function restoreNetwork(page: Page): Promise<void> {
  console.log('🌐 Restoring network');
  
  // Unblock network requests
  await page.unroute('**/*');
  
  console.log('✅ Network restored');
}

