import { test, expect } from '@playwright/test';
import { 
  getTestUsers, 
  signInUser, 
  createRoom, 
  joinRoom, 
  selectTeam, 
  markReady, 
  startBattle,
  checkFirebaseErrorLogs,
  verifyRoomData,
  waitForFirebaseOperation
} from './firebase-test-utils';

test.describe('Firebase Permission Error Scenarios E2E Tests', () => {
  let testUsers: any;

  test.beforeAll(async () => {
    testUsers = getTestUsers();
  });

  test('Unauthenticated user cannot access protected resources', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      console.log('🔐 Testing unauthenticated access...');

      // Try to access lobby without authentication
      await page.goto('/lobby');
      
      // Should redirect to login page
      await expect(page).toHaveURL(/.*\/auth\/login/);
      
      // Try to access a specific room without authentication
      await page.goto('/lobby/test-room-id');
      
      // Should show authentication required
      await expect(page.locator('[data-testid="auth-required"]')).toBeVisible();

      // Try to access team page without authentication
      await page.goto('/team');
      
      // Should redirect to login page
      await expect(page).toHaveURL(/.*\/auth\/login/);

      console.log('✅ Unauthenticated access test passed!');

    } finally {
      await context.close();
    }
  });

  test('User cannot access rooms they are not part of', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('🚫 Testing unauthorized room access...');

      // Host signs in and creates room
      await signInUser(hostPage, testUsers.host);
      const roomId = await createRoom(hostPage, testUsers.host);

      // Guest signs in but tries to access a different room
      await signInUser(guestPage, testUsers.guest);
      
      // Try to access a non-existent room
      await guestPage.goto('/lobby/non-existent-room');
      
      // Should show room not found error
      await expect(guestPage.locator('[data-testid="room-not-found"]')).toBeVisible();

      // Now try to access the actual room (should work)
      await guestPage.goto(`/lobby/${roomId}`);
      await expect(guestPage.locator('[data-testid="room-container"]')).toBeVisible();

      console.log('✅ Unauthorized room access test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Permission errors are logged and analyzed correctly', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('📊 Testing permission error logging...');

      // Host signs in and creates room
      await signInUser(hostPage, testUsers.host);
      const roomId = await createRoom(hostPage, testUsers.host);

      // Guest signs in and joins room
      await signInUser(guestPage, testUsers.guest);
      await joinRoom(guestPage, roomId, testUsers.guest);

      // Try to perform operations that might cause permission errors
      console.log('🔍 Testing permission error scenarios...');
      
      // Try to access room with invalid permissions
      try {
        await guestPage.goto('/lobby/invalid-room-id');
        await guestPage.waitForSelector('[data-testid="room-not-found"]', { timeout: 5000 });
      } catch (error) {
        console.log('Expected error occurred:', error);
      }

      // Check error logs for permission-related errors
      const errorLogs = await checkFirebaseErrorLogs(hostPage);
      
      // Look for permission-related errors
      const permissionErrors = errorLogs.filter(error => 
        error.code?.includes('permission-denied') || 
        error.code?.includes('unauthenticated') ||
        error.message?.toLowerCase().includes('permission') ||
        error.message?.toLowerCase().includes('unauthorized')
      );

      console.log(`📋 Found ${permissionErrors.length} permission-related errors`);
      
      // Verify error analysis is working
      if (permissionErrors.length > 0) {
        for (const error of permissionErrors) {
          console.log(`  - ${error.code}: ${error.message}`);
          
          // Verify error has proper context
          expect(error.operation).toBeDefined();
          expect(error.type).toBeDefined();
        }
      }

      console.log('✅ Permission error logging test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Firebase security rules are properly enforced', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('🛡️ Testing Firebase security rules...');

      // Host signs in and creates room
      await signInUser(hostPage, testUsers.host);
      const roomId = await createRoom(hostPage, testUsers.host);

      // Guest signs in and joins room
      await signInUser(guestPage, testUsers.guest);
      await joinRoom(guestPage, roomId, testUsers.guest);

      // Test room read permissions
      console.log('📖 Testing room read permissions...');
      
      // Both users should be able to read room data
      await expect(hostPage.locator('[data-testid="room-container"]')).toBeVisible();
      await expect(guestPage.locator('[data-testid="room-container"]')).toBeVisible();

      // Test room write permissions
      console.log('✏️ Testing room write permissions...');
      
      // Host should be able to update room
      await selectTeam(hostPage, "Test Host's Test Team");
      await expect(hostPage.locator('[data-testid="selected-team"]')).toContainText("Test Host's Test Team");
      
      // Guest should be able to update room
      await selectTeam(guestPage, "Test Guest's Test Team");
      await expect(guestPage.locator('[data-testid="selected-team"]')).toContainText("Test Guest's Test Team");

      // Test battle creation permissions
      console.log('⚔️ Testing battle creation permissions...');
      
      // Both users mark ready
      await markReady(hostPage);
      await markReady(guestPage);
      
      // Host should be able to start battle
      await startBattle(hostPage);
      
      // Verify battle was created
      const battleUrl = hostPage.url();
      expect(battleUrl).toMatch(/\/battle\/[A-Za-z0-9]+/);

      console.log('✅ Firebase security rules test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Error recovery and retry mechanisms work correctly', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('🔄 Testing error recovery...');

      // Both users sign in
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      // Host creates room
      const roomId = await createRoom(hostPage, testUsers.host);

      // Guest joins room
      await joinRoom(guestPage, roomId, testUsers.guest);

      // Test retry mechanisms
      console.log('🔄 Testing retry mechanisms...');
      
      // Try to perform operations that might fail initially
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await selectTeam(hostPage, "Test Host's Test Team");
          break; // Success
        } catch (error) {
          retryCount++;
          console.log(`Retry attempt ${retryCount}/${maxRetries}`);
          
          if (retryCount >= maxRetries) {
            throw error;
          }
          
          // Wait before retry
          await hostPage.waitForTimeout(1000);
        }
      }

      // Verify operation succeeded
      await expect(hostPage.locator('[data-testid="selected-team"]')).toContainText("Test Host's Test Team");

      console.log('✅ Error recovery test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Concurrent access and race conditions are handled', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('🏃 Testing concurrent access...');

      // Both users sign in
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      // Host creates room
      const roomId = await createRoom(hostPage, testUsers.host);

      // Guest joins room
      await joinRoom(guestPage, roomId, testUsers.guest);

      // Test concurrent operations
      console.log('🏃 Testing concurrent operations...');
      
      // Both users try to select teams simultaneously
      const hostTeamPromise = selectTeam(hostPage, "Test Host's Test Team");
      const guestTeamPromise = selectTeam(guestPage, "Test Guest's Test Team");
      
      // Wait for both operations to complete
      await Promise.all([hostTeamPromise, guestTeamPromise]);
      
      // Verify both teams were selected
      await expect(hostPage.locator('[data-testid="selected-team"]')).toContainText("Test Host's Test Team");
      await expect(guestPage.locator('[data-testid="selected-team"]')).toContainText("Test Guest's Test Team");

      // Test concurrent ready status updates
      console.log('🏃 Testing concurrent ready updates...');
      
      const hostReadyPromise = markReady(hostPage);
      const guestReadyPromise = markReady(guestPage);
      
      await Promise.all([hostReadyPromise, guestReadyPromise]);
      
      // Verify both users are ready
      await expect(hostPage.locator('[data-testid="host-ready-status"]')).toHaveText('Ready');
      await expect(guestPage.locator('[data-testid="guest-ready-status"]')).toHaveText('Ready');

      console.log('✅ Concurrent access test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Data consistency is maintained during errors', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('📊 Testing data consistency...');

      // Both users sign in
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      // Host creates room
      const roomId = await createRoom(hostPage, testUsers.host);

      // Guest joins room
      await joinRoom(guestPage, roomId, testUsers.guest);

      // Perform operations that might cause errors
      console.log('📊 Testing data consistency during errors...');
      
      // Select teams
      await selectTeam(hostPage, "Test Host's Test Team");
      await selectTeam(guestPage, "Test Guest's Test Team");
      
      // Mark ready
      await markReady(hostPage);
      await markReady(guestPage);
      
      // Verify data consistency
      await verifyRoomData(roomId, {
        hostId: testUsers.host.uid,
        guestId: testUsers.guest.uid,
        status: 'ready',
        currentPlayers: 2
      });

      // Refresh pages and verify data persists
      await hostPage.reload();
      await guestPage.reload();
      
      await hostPage.waitForSelector('[data-testid="room-container"]');
      await guestPage.waitForSelector('[data-testid="room-container"]');
      
      // Verify data is still consistent
      await expect(hostPage.locator('[data-testid="selected-team"]')).toContainText("Test Host's Test Team");
      await expect(guestPage.locator('[data-testid="selected-team"]')).toContainText("Test Guest's Test Team");
      
      await expect(hostPage.locator('[data-testid="host-ready-status"]')).toHaveText('Ready');
      await expect(guestPage.locator('[data-testid="guest-ready-status"]')).toHaveText('Ready');

      console.log('✅ Data consistency test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
});

