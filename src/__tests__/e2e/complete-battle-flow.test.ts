import { test, expect } from '@playwright/test';
import { 
  getTestUsers, 
  signInUser, 
  createRoom, 
  joinRoom, 
  selectTeam, 
  markReady, 
  startBattle, 
  makeMove, 
  waitForBattleUpdate,
  verifyRoomData,
  verifyBattleData,
  waitForFirebaseOperation
} from './firebase-test-utils';

test.describe('Complete Battle Flow E2E Tests', () => {
  let testUsers: any;

  test.beforeAll(async () => {
    testUsers = getTestUsers();
  });

  test('Complete multiplayer battle flow with Firebase validation', async ({ browser }) => {
    // Create two browser contexts for two users
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('🎮 Starting complete battle flow test...');

      // Step 1: Both users sign in
      console.log('👤 Step 1: User authentication');
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      // Step 2: Host creates room
      console.log('🏠 Step 2: Room creation');
      const roomId = await createRoom(hostPage, testUsers.host);
      
      // Verify room exists in Firebase
      await verifyRoomData(roomId, {
        hostId: testUsers.host.uid,
        hostName: testUsers.host.displayName,
        status: 'waiting',
        currentPlayers: 1
      });

      // Step 3: Guest joins room
      console.log('🚪 Step 3: Room joining');
      await joinRoom(guestPage, roomId, testUsers.guest);
      
      // Verify room updated in Firebase
      await verifyRoomData(roomId, {
        guestId: testUsers.guest.uid,
        guestName: testUsers.guest.displayName,
        status: 'ready',
        currentPlayers: 2
      });

      // Step 4: Both users select teams
      console.log('🎮 Step 4: Team selection');
      await selectTeam(hostPage, "Test Host's Test Team");
      await selectTeam(guestPage, "Test Guest's Test Team");

      // Step 5: Both users mark ready
      console.log('✅ Step 5: Ready status');
      await markReady(hostPage);
      await markReady(guestPage);

      // Step 6: Host starts battle
      console.log('⚔️ Step 6: Battle start');
      await startBattle(hostPage);
      
      // Get battle ID from URL
      const battleUrl = hostPage.url();
      const battleId = battleUrl.split('/battle/')[1];
      
      // Verify battle exists in Firebase
      await verifyBattleData(battleId, {
        hostId: testUsers.host.uid,
        guestId: testUsers.guest.uid,
        status: 'active'
      });

      // Step 7: Battle mechanics
      console.log('🎯 Step 7: Battle mechanics');
      
      // Host makes first move
      await makeMove(hostPage, 0);
      await waitForBattleUpdate(guestPage, 'Opponent is thinking...');
      
      // Guest makes move
      await makeMove(guestPage, 1);
      await waitForBattleUpdate(hostPage, 'Opponent is thinking...');
      
      // Host makes second move
      await makeMove(hostPage, 2);
      await waitForBattleUpdate(guestPage, 'Opponent is thinking...');

      // Step 8: Verify battle completion
      console.log('🏆 Step 8: Battle completion');
      
      // Wait for battle to complete (this would depend on your battle logic)
      await hostPage.waitForTimeout(5000);
      await guestPage.waitForTimeout(5000);
      
      // Verify both users are on battle results page
      await expect(hostPage.locator('[data-testid="battle-results"]')).toBeVisible();
      await expect(guestPage.locator('[data-testid="battle-results"]')).toBeVisible();

      console.log('✅ Complete battle flow test passed!');

    } finally {
      // Cleanup
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Real-time room synchronization', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('🔄 Testing real-time room synchronization...');

      // Both users sign in
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      // Host creates room
      const roomId = await createRoom(hostPage, testUsers.host);

      // Guest joins room
      await joinRoom(guestPage, roomId, testUsers.guest);

      // Test real-time updates
      console.log('📡 Testing real-time updates...');
      
      // Host changes ready status
      await markReady(hostPage);
      
      // Guest should see host ready status change
      await expect(guestPage.locator('[data-testid="host-ready-status"]')).toHaveText('Ready');
      
      // Guest changes ready status
      await markReady(guestPage);
      
      // Host should see guest ready status change
      await expect(hostPage.locator('[data-testid="guest-ready-status"]')).toHaveText('Ready');

      console.log('✅ Real-time synchronization test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Data persistence across page refreshes', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('💾 Testing data persistence...');

      // Both users sign in
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      // Host creates room and selects team
      const roomId = await createRoom(hostPage, testUsers.host);
      await selectTeam(hostPage, "Test Host's Test Team");
      await markReady(hostPage);

      // Guest joins room and selects team
      await joinRoom(guestPage, roomId, testUsers.guest);
      await selectTeam(guestPage, "Test Guest's Test Team");
      await markReady(guestPage);

      // Refresh both pages
      console.log('🔄 Refreshing pages...');
      await hostPage.reload();
      await guestPage.reload();

      // Wait for pages to load
      await hostPage.waitForSelector('[data-testid="room-container"]');
      await guestPage.waitForSelector('[data-testid="room-container"]');

      // Verify data persisted
      await expect(hostPage.locator('[data-testid="selected-team"]')).toContainText("Test Host's Test Team");
      await expect(guestPage.locator('[data-testid="selected-team"]')).toContainText("Test Guest's Test Team");
      
      await expect(hostPage.locator('[data-testid="host-ready-status"]')).toHaveText('Ready');
      await expect(guestPage.locator('[data-testid="guest-ready-status"]')).toHaveText('Ready');

      console.log('✅ Data persistence test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Error handling and recovery', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('🚨 Testing error handling...');

      // Both users sign in
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      // Host creates room
      const roomId = await createRoom(hostPage, testUsers.host);

      // Guest joins room
      await joinRoom(guestPage, roomId, testUsers.guest);

      // Test invalid room ID handling
      console.log('🔍 Testing invalid room ID...');
      await guestPage.goto('/lobby/invalid-room-id');
      
      // Should show error message
      await expect(guestPage.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(guestPage.locator('[data-testid="error-message"]')).toContainText('Room not found');

      // Test network error recovery
      console.log('🌐 Testing network error recovery...');
      
      // Go back to valid room
      await guestPage.goto(`/lobby/${roomId}`);
      await guestPage.waitForSelector('[data-testid="room-container"]');
      
      // Simulate network error (this would need to be implemented in your app)
      // For now, just verify the room is still accessible
      await expect(guestPage.locator('[data-testid="room-container"]')).toBeVisible();

      console.log('✅ Error handling test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
});

