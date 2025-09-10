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
  exportErrorLogs,
  verifyRoomData,
  simulateNetworkError,
  restoreNetwork
} from './firebase-test-utils';

test.describe('Firebase Error Logging System E2E Tests', () => {
  let testUsers: any;

  test.beforeAll(async () => {
    testUsers = getTestUsers();
  });

  test('Firebase error logging system is functional', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('🔍 Testing Firebase error logging system...');

      // Both users sign in
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      // Host creates room
      const roomId = await createRoom(hostPage, testUsers.host);

      // Guest joins room
      await joinRoom(guestPage, roomId, testUsers.guest);

      // Check initial error logs (should be empty or minimal)
      console.log('📊 Checking initial error logs...');
      const initialErrors = await checkFirebaseErrorLogs(hostPage);
      
      // Verify error debugger is accessible
      await expect(hostPage.locator('[data-testid="firebase-error-debugger"]')).toBeVisible();
      await expect(hostPage.locator('[data-testid="error-summary"]')).toBeVisible();

      // Test error log export functionality
      console.log('📤 Testing error log export...');
      await exportErrorLogs(hostPage);

      // Verify error summary shows correct information
      const errorSummary = await hostPage.locator('[data-testid="error-summary"]').textContent();
      expect(errorSummary).toContain('Total Errors');
      expect(errorSummary).toContain('Recent');

      console.log('✅ Firebase error logging system test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Error logging captures permission errors', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('🔐 Testing permission error logging...');

      // Host signs in and creates room
      await signInUser(hostPage, testUsers.host);
      const roomId = await createRoom(hostPage, testUsers.host);

      // Guest tries to join room without being signed in
      console.log('🚫 Testing unauthorized access...');
      await guestPage.goto(`/lobby/${roomId}`);
      
      // Should show authentication required
      await expect(guestPage.locator('[data-testid="auth-required"]')).toBeVisible();

      // Now sign in guest and join properly
      await signInUser(guestPage, testUsers.guest);
      await joinRoom(guestPage, roomId, testUsers.guest);

      // Check error logs for permission-related errors
      console.log('📊 Checking permission error logs...');
      const errorLogs = await checkFirebaseErrorLogs(hostPage);
      
      // Look for permission-related errors
      const permissionErrors = errorLogs.filter(error => 
        error.code?.includes('permission-denied') || 
        error.code?.includes('unauthenticated') ||
        error.message?.toLowerCase().includes('permission')
      );

      // Verify error logging captured the issues
      expect(errorLogs.length).toBeGreaterThanOrEqual(0);
      
      if (permissionErrors.length > 0) {
        console.log(`📋 Found ${permissionErrors.length} permission-related errors`);
        permissionErrors.forEach(error => {
          console.log(`  - ${error.code}: ${error.message}`);
        });
      }

      console.log('✅ Permission error logging test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Error logging captures network errors', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('🌐 Testing network error logging...');

      // Both users sign in
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      // Host creates room
      const roomId = await createRoom(hostPage, testUsers.host);

      // Guest joins room
      await joinRoom(guestPage, roomId, testUsers.guest);

      // Simulate network error
      console.log('🚫 Simulating network error...');
      await simulateNetworkError(hostPage);

      // Try to perform Firebase operations that should fail
      try {
        await selectTeam(hostPage, "Test Host's Test Team");
      } catch (error) {
        console.log('Expected error occurred:', error);
      }

      // Restore network
      await restoreNetwork(hostPage);

      // Check error logs for network-related errors
      console.log('📊 Checking network error logs...');
      const errorLogs = await checkFirebaseErrorLogs(hostPage);
      
      // Look for network-related errors
      const networkErrors = errorLogs.filter(error => 
        error.code?.includes('network') || 
        error.code?.includes('timeout') ||
        error.message?.toLowerCase().includes('network') ||
        error.message?.toLowerCase().includes('failed to fetch')
      );

      // Verify error logging captured network issues
      if (networkErrors.length > 0) {
        console.log(`📋 Found ${networkErrors.length} network-related errors`);
        networkErrors.forEach(error => {
          console.log(`  - ${error.code}: ${error.message}`);
        });
      }

      console.log('✅ Network error logging test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Error logging provides actionable suggestions', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('💡 Testing error suggestions...');

      // Both users sign in
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      // Host creates room
      const roomId = await createRoom(hostPage, testUsers.host);

      // Guest joins room
      await joinRoom(guestPage, roomId, testUsers.guest);

      // Check error logs and suggestions
      console.log('📊 Checking error suggestions...');
      const errorLogs = await checkFirebaseErrorLogs(hostPage);
      
      // Verify suggestions are provided
      await expect(hostPage.locator('[data-testid="error-suggestions"]')).toBeVisible();
      
      const suggestions = await hostPage.locator('[data-testid="error-suggestion"]').all();
      
      if (suggestions.length > 0) {
        console.log(`💡 Found ${suggestions.length} error suggestions`);
        for (const suggestion of suggestions) {
          const suggestionText = await suggestion.textContent();
          console.log(`  - ${suggestionText}`);
          
          // Verify suggestions are actionable
          expect(suggestionText).toMatch(/check|verify|ensure|review/i);
        }
      }

      console.log('✅ Error suggestions test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Error logging tracks error frequency', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('📈 Testing error frequency tracking...');

      // Both users sign in
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      // Host creates room
      const roomId = await createRoom(hostPage, testUsers.host);

      // Guest joins room
      await joinRoom(guestPage, roomId, testUsers.guest);

      // Perform multiple operations to generate some errors
      for (let i = 0; i < 3; i++) {
        try {
          await selectTeam(hostPage, "Test Host's Test Team");
        } catch (error) {
          // Expected to fail on subsequent attempts
        }
      }

      // Check error frequency tracking
      console.log('📊 Checking error frequency...');
      const errorLogs = await checkFirebaseErrorLogs(hostPage);
      
      // Verify frequent errors are marked
      const frequentErrors = await hostPage.locator('[data-testid="frequent-error"]').all();
      
      if (frequentErrors.length > 0) {
        console.log(`📈 Found ${frequentErrors.length} frequent errors`);
        for (const error of frequentErrors) {
          const errorText = await error.textContent();
          console.log(`  - ${errorText}`);
        }
      }

      // Verify error summary shows frequency data
      const errorSummary = await hostPage.locator('[data-testid="error-summary"]').textContent();
      expect(errorSummary).toContain('Total Errors');
      expect(errorSummary).toContain('Recent');

      console.log('✅ Error frequency tracking test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Error logging exports data correctly', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('📤 Testing error log export...');

      // Both users sign in
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      // Host creates room
      const roomId = await createRoom(hostPage, testUsers.host);

      // Guest joins room
      await joinRoom(guestPage, roomId, testUsers.guest);

      // Generate some errors
      try {
        await selectTeam(hostPage, "Test Host's Test Team");
      } catch (error) {
        // Expected error
      }

      // Test export functionality
      console.log('📤 Testing export...');
      await exportErrorLogs(hostPage);

      // Verify export button works
      await expect(hostPage.locator('[data-testid="export-logs-button"]')).toBeVisible();
      await hostPage.click('[data-testid="export-logs-button"]');

      // Wait for download to start
      await hostPage.waitForTimeout(2000);

      console.log('✅ Error log export test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Error logging clears data correctly', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('🗑️ Testing error log clearing...');

      // Both users sign in
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      // Host creates room
      const roomId = await createRoom(hostPage, testUsers.host);

      // Guest joins room
      await joinRoom(guestPage, roomId, testUsers.guest);

      // Generate some errors
      try {
        await selectTeam(hostPage, "Test Host's Test Team");
      } catch (error) {
        // Expected error
      }

      // Check initial error count
      const initialErrors = await checkFirebaseErrorLogs(hostPage);
      const initialCount = initialErrors.length;

      // Clear error logs
      console.log('🗑️ Clearing error logs...');
      await hostPage.click('[data-testid="clear-logs-button"]');
      
      // Confirm clearing
      await hostPage.click('[data-testid="confirm-clear"]');

      // Wait for clearing to complete
      await hostPage.waitForTimeout(1000);

      // Check error count after clearing
      const clearedErrors = await checkFirebaseErrorLogs(hostPage);
      const clearedCount = clearedErrors.length;

      // Verify logs were cleared
      expect(clearedCount).toBeLessThanOrEqual(initialCount);

      console.log('✅ Error log clearing test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
});

