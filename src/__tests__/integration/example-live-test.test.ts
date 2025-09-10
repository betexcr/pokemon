/**
 * Example Live Firebase Integration Test
 * 
 * This is a simplified example showing how to test with live users
 * and actual Firebase services. This test demonstrates the core concepts
 * without the complexity of the full battle system.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Simple test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  users: {
    host: {
      email: 'test-host@pokemon-battles.test',
      password: 'TestHost123!',
      displayName: 'Test Host'
    },
    guest: {
      email: 'test-guest@pokemon-battles.test', 
      password: 'TestGuest123!',
      displayName: 'Test Guest'
    }
  }
};

test.describe('Example Live Firebase Integration Test', () => {
  let hostContext: BrowserContext;
  let guestContext: BrowserContext;
  let hostPage: Page;
  let guestPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Create separate browser contexts to simulate two different users
    hostContext = await browser.newContext();
    guestContext = await browser.newContext();
    
    hostPage = await hostContext.newPage();
    guestPage = await guestContext.newPage();
  });

  test.afterAll(async () => {
    // Clean up browser contexts
    await hostContext.close();
    await guestContext.close();
  });

  test('Two live users can create and join a lobby with Firebase', async () => {
    console.log('🎮 Starting live Firebase integration test...');

    // Step 1: Host signs in and creates a lobby
    console.log('👤 Step 1: Host authentication and lobby creation');
    
    await hostPage.goto('/lobby');
    
    // Sign in (this uses real Firebase Auth)
    await hostPage.click('[data-testid="sign-in-tab"]');
    await hostPage.fill('[data-testid="email-input"]', TEST_CONFIG.users.host.email);
    await hostPage.fill('[data-testid="password-input"]', TEST_CONFIG.users.host.password);
    await hostPage.click('[data-testid="sign-in-button"]');
    
    // Wait for successful authentication
    await expect(hostPage.locator('[data-testid="user-profile"]')).toBeVisible();
    console.log('✅ Host authenticated successfully');

    // Create a new lobby (this creates a real Firestore document)
    await hostPage.click('[data-testid="create-room-button"]');
    
    // Wait for room creation and get room ID from URL
    await hostPage.waitForURL(/\/lobby\/[a-zA-Z0-9]+/);
    const roomId = hostPage.url().split('/').pop();
    
    expect(roomId).toBeTruthy();
    console.log(`✅ Lobby created with ID: ${roomId}`);

    // Step 2: Guest signs in and joins the lobby
    console.log('👥 Step 2: Guest authentication and lobby joining');
    
    await guestPage.goto('/lobby');
    
    // Sign in as guest
    await guestPage.click('[data-testid="sign-in-tab"]');
    await guestPage.fill('[data-testid="email-input"]', TEST_CONFIG.users.guest.email);
    await guestPage.fill('[data-testid="password-input"]', TEST_CONFIG.users.guest.password);
    await guestPage.click('[data-testid="sign-in-button"]');
    
    await expect(guestPage.locator('[data-testid="user-profile"]')).toBeVisible();
    console.log('✅ Guest authenticated successfully');

    // Join the lobby (this updates the real Firestore document)
    await guestPage.goto(`/lobby/${roomId}`);
    await expect(guestPage.locator('[data-testid="room-info"]')).toBeVisible();
    console.log('✅ Guest joined lobby successfully');

    // Step 3: Test real-time synchronization
    console.log('🔄 Step 3: Real-time Firebase synchronization');
    
    // Host changes ready status
    await hostPage.click('[data-testid="ready-button"]');
    await expect(hostPage.locator('[data-testid="host-ready-status"]')).toHaveText('Ready');
    
    // Guest should see the change immediately (via Firebase real-time listeners)
    await expect(guestPage.locator('[data-testid="host-ready-status"]')).toHaveText('Ready');
    console.log('✅ Real-time ready status synchronization working');

    // Guest changes ready status
    await guestPage.click('[data-testid="ready-button"]');
    await expect(guestPage.locator('[data-testid="guest-ready-status"]')).toHaveText('Ready');
    
    // Host should see the change immediately
    await expect(hostPage.locator('[data-testid="guest-ready-status"]')).toHaveText('Ready');
    console.log('✅ Real-time guest ready status synchronization working');

    // Step 4: Test team selection synchronization
    console.log('⚔️ Step 4: Team selection with Firebase persistence');
    
    // Host selects a team (this saves to Firestore)
    await hostPage.click('[data-testid="team-selector"]');
    await hostPage.click('[data-testid="team-option-Sample Team"]');
    await expect(hostPage.locator('[data-testid="host-team-selected"]')).toBeVisible();
    
    // Guest should see host's team selection
    await expect(guestPage.locator('[data-testid="host-team-display"]')).toBeVisible();
    console.log('✅ Team selection synchronization working');

    // Step 5: Test chat functionality
    console.log('💬 Step 5: Real-time chat with Firebase');
    
    // Host sends a message
    await hostPage.fill('[data-testid="chat-input"]', 'Hello from host!');
    await hostPage.click('[data-testid="send-message-button"]');
    
    // Guest should see the message immediately
    await expect(guestPage.locator('[data-testid="chat-message"]')).toContainText('Hello from host!');
    console.log('✅ Real-time chat synchronization working');

    // Guest sends a message
    await guestPage.fill('[data-testid="chat-input"]', 'Hello from guest!');
    await guestPage.click('[data-testid="send-message-button"]');
    
    // Host should see the message immediately
    await expect(hostPage.locator('[data-testid="chat-message"]')).toContainText('Hello from guest!');
    console.log('✅ Bidirectional chat synchronization working');

    // Step 6: Test data persistence
    console.log('💾 Step 6: Firebase data persistence');
    
    // Refresh both pages
    await hostPage.reload();
    await guestPage.reload();
    
    // Data should still be there (persisted in Firestore)
    await expect(hostPage.locator('[data-testid="room-info"]')).toBeVisible();
    await expect(guestPage.locator('[data-testid="room-info"]')).toBeVisible();
    await expect(hostPage.locator('[data-testid="host-ready-status"]')).toHaveText('Ready');
    await expect(guestPage.locator('[data-testid="guest-ready-status"]')).toHaveText('Ready');
    console.log('✅ Data persistence working correctly');

    console.log('🎉 Live Firebase integration test completed successfully!');
    console.log('✅ All Firebase services working correctly:');
    console.log('  - Firebase Authentication');
    console.log('  - Firestore Database');
    console.log('  - Real-time listeners');
    console.log('  - Data persistence');
    console.log('  - Multi-user synchronization');
  });

  test('Error handling with live Firebase services', async () => {
    console.log('⚠️ Testing error handling with live Firebase...');

    // Test invalid room ID
    await hostPage.goto('/lobby/invalid-room-id-12345');
    await expect(hostPage.locator('[data-testid="room-not-found"]')).toBeVisible();
    console.log('✅ Invalid room ID handled correctly');

    // Test network disconnection
    await hostPage.goto('/lobby');
    await hostPage.context().setOffline(true);
    
    // Try to perform an action while offline
    await hostPage.click('[data-testid="create-room-button"]');
    await expect(hostPage.locator('[data-testid="network-error"]')).toBeVisible();
    console.log('✅ Network disconnection handled correctly');

    // Restore network
    await hostPage.context().setOffline(false);
    await expect(hostPage.locator('[data-testid="connection-restored"]')).toBeVisible();
    console.log('✅ Network reconnection handled correctly');

    console.log('🎉 Error handling tests completed successfully!');
  });
});

/**
 * Key Benefits of This Approach:
 * 
 * 1. **Real Firebase Services**: Tests use actual Firebase Auth and Firestore
 * 2. **Live Users**: Two separate browser contexts simulate real users
 * 3. **Real-time Testing**: Tests verify Firebase real-time listeners work
 * 4. **Data Persistence**: Tests verify data survives page refreshes
 * 5. **Error Handling**: Tests verify graceful error handling
 * 6. **Multi-user Scenarios**: Tests verify multi-user synchronization
 * 
 * This is much more comprehensive than unit tests because it tests:
 * - The entire user journey
 * - Firebase integration
 * - Real-time synchronization
 * - Network conditions
 * - Error scenarios
 * - Data persistence
 * 
 * These tests catch issues that unit tests miss and give you confidence
 * that your app works correctly with real users and live services.
 */

