/**
 * Complete Battle Flow Integration Tests
 * 
 * These tests simulate the complete user journey from lobby creation
 * to battle completion using live Firebase services.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { firebaseTestUtils, TestUser, TestTeam } from './firebase-test-utils';

// Test data
const testData = firebaseTestUtils.generateTestData();

test.describe('Complete Battle Flow Integration Tests', () => {
  let hostContext: BrowserContext;
  let guestContext: BrowserContext;
  let hostPage: Page;
  let guestPage: Page;
  let roomId: string;
  let battleId: string;

  test.beforeAll(async ({ browser }) => {
    // Create separate browser contexts for host and guest
    hostContext = await browser.newContext();
    guestContext = await browser.newContext();
    
    hostPage = await hostContext.newPage();
    guestPage = await guestContext.newPage();
  });

  test.afterAll(async () => {
    // Cleanup test data
    await firebaseTestUtils.cleanupTestData();
    
    // Close browser contexts
    await hostContext.close();
    await guestContext.close();
  });

  test('Complete multiplayer battle journey', async () => {
    console.log('🎮 Starting complete multiplayer battle journey test...');

    // Step 1: Both users sign in
    console.log('👥 Step 1: User authentication');
    
    await hostPage.goto('/lobby');
    await signInUser(hostPage, testData.users.host);
    await expect(hostPage.locator('[data-testid="user-profile"]')).toBeVisible();
    
    await guestPage.goto('/lobby');
    await signInUser(guestPage, testData.users.guest);
    await expect(guestPage.locator('[data-testid="user-profile"]')).toBeVisible();
    
    console.log('✅ Both users authenticated successfully');

    // Step 2: Host creates a battle room
    console.log('🏠 Step 2: Room creation');
    
    await hostPage.click('[data-testid="create-room-button"]');
    await hostPage.waitForURL(/\/lobby\/[a-zA-Z0-9]+/);
    roomId = hostPage.url().split('/').pop()!;
    
    await expect(hostPage.locator('[data-testid="room-info"]')).toBeVisible();
    await expect(hostPage.locator('[data-testid="room-id"]')).toContainText(roomId);
    
    console.log(`✅ Room created: ${roomId}`);

    // Step 3: Guest joins the room
    console.log('🚪 Step 3: Guest joins room');
    
    await guestPage.goto(`/lobby/${roomId}`);
    await expect(guestPage.locator('[data-testid="room-info"]')).toBeVisible();
    await expect(guestPage.locator('[data-testid="guest-status"]')).toContainText('Joined');
    
    console.log('✅ Guest joined room successfully');

    // Step 4: Both users select teams
    console.log('⚔️ Step 4: Team selection');
    
    // Host selects team
    await hostPage.click('[data-testid="team-selector"]');
    await hostPage.click('[data-testid="team-option-Host Test Team"]');
    await expect(hostPage.locator('[data-testid="host-team-selected"]')).toBeVisible();
    
    // Guest selects team
    await guestPage.click('[data-testid="team-selector"]');
    await guestPage.click('[data-testid="team-option-Guest Test Team"]');
    await expect(guestPage.locator('[data-testid="guest-team-selected"]')).toBeVisible();
    
    console.log('✅ Both users selected teams');

    // Step 5: Both users mark as ready
    console.log('✅ Step 5: Ready status');
    
    await hostPage.click('[data-testid="ready-button"]');
    await expect(hostPage.locator('[data-testid="host-ready-status"]')).toHaveText('Ready');
    
    await guestPage.click('[data-testid="ready-button"]');
    await expect(guestPage.locator('[data-testid="guest-ready-status"]')).toHaveText('Ready');
    
    // Verify both users can see each other's ready status
    await expect(hostPage.locator('[data-testid="guest-ready-status"]')).toHaveText('Ready');
    await expect(guestPage.locator('[data-testid="host-ready-status"]')).toHaveText('Ready');
    
    console.log('✅ Both users marked as ready');

    // Step 6: Host starts the battle
    console.log('⚡ Step 6: Battle initiation');
    
    await hostPage.click('[data-testid="start-battle-button"]');
    
    // Wait for both users to be redirected to battle
    await hostPage.waitForURL(/\/battle\/runtime/);
    await guestPage.waitForURL(/\/battle\/runtime/);
    
    await expect(hostPage.locator('[data-testid="battle-interface"]')).toBeVisible();
    await expect(guestPage.locator('[data-testid="battle-interface"]')).toBeVisible();
    
    console.log('✅ Battle started successfully');

    // Step 7: Battle mechanics testing
    console.log('🥊 Step 7: Battle mechanics');
    
    // Host makes first move
    await hostPage.click('[data-testid="move-button-0"]');
    await expect(hostPage.locator('[data-testid="move-executed"]')).toBeVisible();
    
    // Guest should see the move
    await expect(guestPage.locator('[data-testid="opponent-move"]')).toBeVisible();
    
    // Guest makes a move
    await guestPage.click('[data-testid="move-button-0"]');
    await expect(guestPage.locator('[data-testid="move-executed"]')).toBeVisible();
    
    // Host should see the move
    await expect(hostPage.locator('[data-testid="opponent-move"]')).toBeVisible();
    
    console.log('✅ Battle mechanics working correctly');

    // Step 8: Test real-time synchronization
    console.log('🔄 Step 8: Real-time synchronization');
    
    // Host changes Pokemon
    await hostPage.click('[data-testid="pokemon-slot-1"]');
    await expect(hostPage.locator('[data-testid="pokemon-switched"]')).toBeVisible();
    
    // Guest should see the change
    await expect(guestPage.locator('[data-testid="opponent-pokemon-switch"]')).toBeVisible();
    
    console.log('✅ Real-time synchronization working');

    // Step 9: Battle completion simulation
    console.log('🏆 Step 9: Battle completion');
    
    // Simulate battle end (this would be more complex in real implementation)
    await hostPage.click('[data-testid="forfeit-button"]');
    await expect(hostPage.locator('[data-testid="battle-ended"]')).toBeVisible();
    await expect(guestPage.locator('[data-testid="battle-ended"]')).toBeVisible();
    
    console.log('✅ Battle completed successfully');

    console.log('🎉 Complete multiplayer battle journey test passed!');
  });

  test('Real-time room updates and synchronization', async () => {
    console.log('🔄 Testing real-time room updates...');

    // Setup
    await signInUser(hostPage, testData.users.host);
    await signInUser(guestPage, testData.users.guest);
    
    const roomId = await createRoom(hostPage);
    await joinRoom(guestPage, roomId);

    // Test 1: Ready status synchronization
    console.log('Testing ready status synchronization...');
    
    await hostPage.click('[data-testid="ready-button"]');
    
    // Guest should see host's ready status change immediately
    await expect(guestPage.locator('[data-testid="host-ready-status"]')).toHaveText('Ready');
    
    await guestPage.click('[data-testid="ready-button"]');
    
    // Host should see guest's ready status change immediately
    await expect(hostPage.locator('[data-testid="guest-ready-status"]')).toHaveText('Ready');
    
    console.log('✅ Ready status synchronization working');

    // Test 2: Team selection synchronization
    console.log('Testing team selection synchronization...');
    
    await hostPage.click('[data-testid="team-selector"]');
    await hostPage.click('[data-testid="team-option-Host Test Team"]');
    
    // Guest should see host's team selection
    await expect(guestPage.locator('[data-testid="host-team-display"]')).toBeVisible();
    
    console.log('✅ Team selection synchronization working');

    // Test 3: Chat synchronization
    console.log('Testing chat synchronization...');
    
    await hostPage.fill('[data-testid="chat-input"]', 'Hello from host!');
    await hostPage.click('[data-testid="send-message-button"]');
    
    // Guest should see the message
    await expect(guestPage.locator('[data-testid="chat-message"]')).toContainText('Hello from host!');
    
    await guestPage.fill('[data-testid="chat-input"]', 'Hello from guest!');
    await guestPage.click('[data-testid="send-message-button"]');
    
    // Host should see the message
    await expect(hostPage.locator('[data-testid="chat-message"]')).toContainText('Hello from guest!');
    
    console.log('✅ Chat synchronization working');

    console.log('🎉 Real-time synchronization tests passed!');
  });

  test('Firebase data persistence across sessions', async () => {
    console.log('💾 Testing data persistence...');

    // Setup
    await signInUser(hostPage, testData.users.host);
    
    // Create a team
    await hostPage.goto('/team');
    await hostPage.click('[data-testid="create-team-button"]');
    await hostPage.fill('[data-testid="team-name-input"]', 'Persistent Test Team');
    await hostPage.click('[data-testid="pokemon-slot-0"]');
    await hostPage.fill('[data-testid="pokemon-search"]', 'pikachu');
    await hostPage.click('[data-testid="pokemon-option-25"]');
    await hostPage.click('[data-testid="save-team-button"]');
    
    await expect(hostPage.locator('[data-testid="team-saved-success"]')).toBeVisible();
    
    // Refresh the page
    await hostPage.reload();
    
    // Team should still be there
    await expect(hostPage.locator('[data-testid="team-Persistent Test Team"]')).toBeVisible();
    
    console.log('✅ Data persistence working correctly');
  });

  test('Error handling and edge cases', async () => {
    console.log('⚠️ Testing error handling...');

    // Test 1: Invalid room ID
    console.log('Testing invalid room ID...');
    
    await guestPage.goto('/lobby/invalid-room-id');
    await expect(guestPage.locator('[data-testid="room-not-found"]')).toBeVisible();
    
    console.log('✅ Invalid room ID handled correctly');

    // Test 2: Network disconnection simulation
    console.log('Testing network disconnection...');
    
    await signInUser(hostPage, testData.users.host);
    const roomId = await createRoom(hostPage);
    
    // Simulate network offline
    await hostPage.context().setOffline(true);
    
    // Try to perform an action
    await hostPage.click('[data-testid="ready-button"]');
    await expect(hostPage.locator('[data-testid="network-error"]')).toBeVisible();
    
    // Restore network
    await hostPage.context().setOffline(false);
    
    // Should recover
    await expect(hostPage.locator('[data-testid="connection-restored"]')).toBeVisible();
    
    console.log('✅ Network disconnection handled correctly');

    console.log('🎉 Error handling tests passed!');
  });
});

// Helper functions
async function signInUser(page: Page, user: TestUser) {
  await page.goto('/lobby');
  await page.click('[data-testid="sign-in-tab"]');
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.click('[data-testid="sign-in-button"]');
  await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
}

async function createRoom(page: Page): Promise<string> {
  await page.click('[data-testid="create-room-button"]');
  await page.waitForURL(/\/lobby\/[a-zA-Z0-9]+/);
  return page.url().split('/').pop()!;
}

async function joinRoom(page: Page, roomId: string) {
  await page.goto(`/lobby/${roomId}`);
  await expect(page.locator('[data-testid="room-info"]')).toBeVisible();
}
