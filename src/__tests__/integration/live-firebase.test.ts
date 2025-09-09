/**
 * Live Firebase Integration Tests
 * 
 * These tests use actual Firebase services with real user accounts
 * to test the complete multiplayer battle flow.
 * 
 * Prerequisites:
 * 1. Firebase test project configured
 * 2. Test user accounts created
 * 3. Environment variables set for test project
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  firebaseConfig: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  testUsers: {
    host: {
      email: process.env.TEST_HOST_EMAIL || 'test-host@pokemon-battles.test',
      password: process.env.TEST_HOST_PASSWORD || 'TestHost123!',
      displayName: 'Test Host Trainer'
    },
    guest: {
      email: process.env.TEST_GUEST_EMAIL || 'test-guest@pokemon-battles.test',
      password: process.env.TEST_GUEST_PASSWORD || 'TestGuest123!',
      displayName: 'Test Guest Trainer'
    }
  }
};

// Firebase test utilities
class FirebaseTestUtils {
  private app: any;
  private auth: any;
  private db: any;

  constructor() {
    if (!getApps().length) {
      this.app = initializeApp(TEST_CONFIG.firebaseConfig);
    } else {
      this.app = getApps()[0];
    }
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
  }

  async signInUser(email: string, password: string) {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async signOutUser() {
    await signOut(this.auth);
  }

  async cleanupTestData() {
    // Clean up any test rooms
    const roomsQuery = query(
      collection(this.db, 'battle_rooms'),
      where('hostName', 'in', [TEST_CONFIG.testUsers.host.displayName, TEST_CONFIG.testUsers.guest.displayName])
    );
    const roomsSnapshot = await getDocs(roomsQuery);
    
    const cleanupPromises = roomsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(cleanupPromises);

    // Clean up any test battles
    const battlesQuery = query(
      collection(this.db, 'battles'),
      where('hostName', 'in', [TEST_CONFIG.testUsers.host.displayName, TEST_CONFIG.testUsers.guest.displayName])
    );
    const battlesSnapshot = await getDocs(battlesQuery);
    
    const battleCleanupPromises = battlesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(battleCleanupPromises);
  }
}

// Test helper functions
async function createTestTeam(page: Page, teamName: string) {
  // Navigate to team builder
  await page.goto('/team');
  
  // Create a new team
  await page.click('[data-testid="create-team-button"]');
  await page.fill('[data-testid="team-name-input"]', teamName);
  
  // Add some Pokemon to the team
  await page.click('[data-testid="pokemon-slot-0"]');
  await page.fill('[data-testid="pokemon-search"]', 'pikachu');
  await page.click('[data-testid="pokemon-option-25"]'); // Pikachu ID
  
  await page.click('[data-testid="pokemon-slot-1"]');
  await page.fill('[data-testid="pokemon-search"]', 'charizard');
  await page.click('[data-testid="pokemon-option-6"]'); // Charizard ID
  
  // Save the team
  await page.click('[data-testid="save-team-button"]');
  
  // Wait for team to be saved
  await expect(page.locator('[data-testid="team-saved-success"]')).toBeVisible();
}

async function signInUser(page: Page, userType: 'host' | 'guest') {
  const user = TEST_CONFIG.testUsers[userType];
  
  // Navigate to a protected page to trigger auth modal
  await page.goto('/lobby');
  
  // Sign in with email/password
  await page.click('[data-testid="sign-in-tab"]');
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.click('[data-testid="sign-in-button"]');
  
  // Wait for successful sign in
  await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
}

async function createBattleRoom(page: Page): Promise<string> {
  // Navigate to lobby
  await page.goto('/lobby');
  
  // Create a new room
  await page.click('[data-testid="create-room-button"]');
  
  // Wait for room to be created and get room ID from URL
  await page.waitForURL(/\/lobby\/[a-zA-Z0-9]+/);
  const roomId = page.url().split('/').pop();
  
  expect(roomId).toBeTruthy();
  return roomId!;
}

async function joinBattleRoom(page: Page, roomId: string) {
  // Navigate to the room
  await page.goto(`/lobby/${roomId}`);
  
  // Wait for room to load
  await expect(page.locator('[data-testid="room-info"]')).toBeVisible();
}

async function selectTeamAndReady(page: Page, teamName: string) {
  // Select team
  await page.click('[data-testid="team-selector"]');
  await page.click(`[data-testid="team-option-${teamName}"]`);
  
  // Mark as ready
  await page.click('[data-testid="ready-button"]');
  
  // Wait for ready status to update
  await expect(page.locator('[data-testid="ready-status"]')).toHaveText('Ready');
}

async function startBattle(page: Page) {
  // Start the battle (only host can do this)
  await page.click('[data-testid="start-battle-button"]');
  
  // Wait for battle to start
  await page.waitForURL(/\/battle\/runtime/);
}

// Main integration test
test.describe('Live Firebase Integration Tests', () => {
  let firebaseUtils: FirebaseTestUtils;
  let hostContext: BrowserContext;
  let guestContext: BrowserContext;
  let hostPage: Page;
  let guestPage: Page;

  test.beforeAll(async ({ browser }) => {
    firebaseUtils = new FirebaseTestUtils();
    
    // Create separate browser contexts for host and guest
    hostContext = await browser.newContext();
    guestContext = await browser.newContext();
    
    hostPage = await hostContext.newPage();
    guestPage = await guestContext.newPage();
  });

  test.afterAll(async () => {
    // Cleanup test data
    await firebaseUtils.cleanupTestData();
    
    // Close browser contexts
    await hostContext.close();
    await guestContext.close();
  });

  test('Complete multiplayer battle flow with live Firebase', async () => {
    // Step 1: Setup test teams for both users
    await signInUser(hostPage, 'host');
    await createTestTeam(hostPage, 'Host Test Team');
    
    await signInUser(guestPage, 'guest');
    await createTestTeam(guestPage, 'Guest Test Team');
    
    // Step 2: Host creates a battle room
    const roomId = await createBattleRoom(hostPage);
    console.log(`Created room: ${roomId}`);
    
    // Step 3: Guest joins the room
    await joinBattleRoom(guestPage, roomId);
    
    // Step 4: Both players select teams and mark ready
    await selectTeamAndReady(hostPage, 'Host Test Team');
    await selectTeamAndReady(guestPage, 'Guest Test Team');
    
    // Step 5: Host starts the battle
    await startBattle(hostPage);
    
    // Step 6: Verify both players are in the battle
    await expect(hostPage.locator('[data-testid="battle-interface"]')).toBeVisible();
    await expect(guestPage.locator('[data-testid="battle-interface"]')).toBeVisible();
    
    // Step 7: Test battle mechanics
    // Host makes a move
    await hostPage.click('[data-testid="move-button-0"]');
    
    // Guest should see the move
    await expect(guestPage.locator('[data-testid="opponent-move"]')).toBeVisible();
    
    // Guest makes a move
    await guestPage.click('[data-testid="move-button-0"]');
    
    // Host should see the move
    await expect(hostPage.locator('[data-testid="opponent-move"]')).toBeVisible();
    
    // Step 8: Continue battle until completion
    // (This would be more complex in a real test, but demonstrates the flow)
    
    console.log('✅ Complete multiplayer battle flow test passed!');
  });

  test('Real-time room updates with Firebase', async () => {
    // Test that room updates are synchronized in real-time
    
    await signInUser(hostPage, 'host');
    await signInUser(guestPage, 'guest');
    
    const roomId = await createBattleRoom(hostPage);
    await joinBattleRoom(guestPage, roomId);
    
    // Host changes ready status
    await hostPage.click('[data-testid="ready-button"]');
    
    // Guest should see the change immediately
    await expect(guestPage.locator('[data-testid="host-ready-status"]')).toHaveText('Ready');
    
    // Guest changes ready status
    await guestPage.click('[data-testid="ready-button"]');
    
    // Host should see the change immediately
    await expect(hostPage.locator('[data-testid="guest-ready-status"]')).toHaveText('Ready');
    
    console.log('✅ Real-time room updates test passed!');
  });

  test('Firebase authentication flow', async () => {
    // Test complete authentication flow
    
    // Test sign up
    await hostPage.goto('/lobby');
    await hostPage.click('[data-testid="sign-up-tab"]');
    await hostPage.fill('[data-testid="email-input"]', 'new-test-user@pokemon-battles.test');
    await hostPage.fill('[data-testid="password-input"]', 'NewTestUser123!');
    await hostPage.fill('[data-testid="display-name-input"]', 'New Test User');
    await hostPage.click('[data-testid="sign-up-button"]');
    
    // Should be signed in
    await expect(hostPage.locator('[data-testid="user-profile"]')).toBeVisible();
    
    // Test sign out
    await hostPage.click('[data-testid="sign-out-button"]');
    await expect(hostPage.locator('[data-testid="sign-in-button"]')).toBeVisible();
    
    console.log('✅ Firebase authentication flow test passed!');
  });

  test('Firebase data persistence', async () => {
    // Test that data persists across sessions
    
    await signInUser(hostPage, 'host');
    await createTestTeam(hostPage, 'Persistent Test Team');
    
    // Refresh the page
    await hostPage.reload();
    
    // Team should still be there
    await expect(hostPage.locator('[data-testid="team-Persistent Test Team"]')).toBeVisible();
    
    console.log('✅ Firebase data persistence test passed!');
  });
});
