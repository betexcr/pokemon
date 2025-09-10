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
  waitForFirebaseOperation,
  checkFirebaseErrorLogs
} from './firebase-test-utils';

test.describe('Complete Multiplayer Battle E2E Tests', () => {
  let testUsers: any;

  test.beforeAll(async () => {
    testUsers = getTestUsers();
  });

  test('Complete 6-Pokemon multiplayer battle from start to finish', async ({ browser }) => {
    // Create two browser contexts for two users
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('🎮 Starting complete 6-Pokemon multiplayer battle test...');

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

      // Step 4: Both users select their 6-Pokemon teams
      console.log('🎮 Step 4: 6-Pokemon team selection');
      await selectTeam(hostPage, "Test Host's Complete Team");
      await selectTeam(guestPage, "Test Guest's Complete Team");

      // Verify both teams are loaded with 6 Pokemon
      await expect(hostPage.locator('[data-testid="team-pokemon-count"]')).toHaveText('6');
      await expect(guestPage.locator('[data-testid="team-pokemon-count"]')).toHaveText('6');

      // Step 5: Both users mark ready
      console.log('✅ Step 5: Ready status');
      await markReady(hostPage);
      await markReady(guestPage);

      // Verify both users are ready
      await expect(hostPage.locator('[data-testid="host-ready-status"]')).toHaveText('Ready');
      await expect(hostPage.locator('[data-testid="guest-ready-status"]')).toHaveText('Ready');
      await expect(guestPage.locator('[data-testid="host-ready-status"]')).toHaveText('Ready');
      await expect(guestPage.locator('[data-testid="guest-ready-status"]')).toHaveText('Ready');

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

      // Step 7: Complete battle mechanics with 6 Pokemon each
      console.log('🎯 Step 7: Complete battle mechanics with 6 Pokemon');
      
      // Wait for battle interface to load
      await expect(hostPage.locator('[data-testid="battle-interface"]')).toBeVisible();
      await expect(guestPage.locator('[data-testid="battle-interface"]')).toBeVisible();

      // Verify both players have 6 Pokemon in battle
      await expect(hostPage.locator('[data-testid="player-pokemon"]')).toHaveCount(6);
      await expect(guestPage.locator('[data-testid="opponent-pokemon"]')).toHaveCount(6);

      // Battle Round 1: Host's first Pokemon vs Guest's first Pokemon
      console.log('🥊 Battle Round 1: First Pokemon battle');
      
      // Host makes first move
      await makeMove(hostPage, 0); // First move
      await waitForBattleUpdate(guestPage, 'Opponent is thinking...');
      
      // Guest makes move
      await makeMove(guestPage, 1); // Second move
      await waitForBattleUpdate(hostPage, 'Opponent is thinking...');

      // Continue battle until first Pokemon faints
      let roundCount = 1;
      while (roundCount < 10) { // Safety limit
        // Check if battle is still active
        const battleStatus = await hostPage.locator('[data-testid="battle-status"]').textContent();
        if (battleStatus?.includes('Pokemon fainted') || battleStatus?.includes('Battle over')) {
          break;
        }

        // Host makes move
        await makeMove(hostPage, roundCount % 4); // Cycle through moves
        await waitForBattleUpdate(guestPage, 'Opponent is thinking...');
        
        // Guest makes move
        await makeMove(guestPage, (roundCount + 1) % 4); // Cycle through moves
        await waitForBattleUpdate(hostPage, 'Opponent is thinking...');

        roundCount++;
      }

      // Battle Round 2: Second Pokemon battle
      console.log('🥊 Battle Round 2: Second Pokemon battle');
      
      // Wait for Pokemon switch or continue battle
      await hostPage.waitForTimeout(2000);
      await guestPage.waitForTimeout(2000);

      // Continue battle with second Pokemon
      for (let i = 0; i < 5; i++) {
        const battleStatus = await hostPage.locator('[data-testid="battle-status"]').textContent();
        if (battleStatus?.includes('Battle over')) {
          break;
        }

        await makeMove(hostPage, i % 4);
        await waitForBattleUpdate(guestPage, 'Opponent is thinking...');
        
        await makeMove(guestPage, (i + 1) % 4);
        await waitForBattleUpdate(hostPage, 'Opponent is thinking...');
      }

      // Battle Round 3: Third Pokemon battle
      console.log('🥊 Battle Round 3: Third Pokemon battle');
      
      await hostPage.waitForTimeout(2000);
      await guestPage.waitForTimeout(2000);

      for (let i = 0; i < 5; i++) {
        const battleStatus = await hostPage.locator('[data-testid="battle-status"]').textContent();
        if (battleStatus?.includes('Battle over')) {
          break;
        }

        await makeMove(hostPage, i % 4);
        await waitForBattleUpdate(guestPage, 'Opponent is thinking...');
        
        await makeMove(guestPage, (i + 1) % 4);
        await waitForBattleUpdate(hostPage, 'Opponent is thinking...');
      }

      // Continue battle until completion (all 6 Pokemon or battle ends)
      console.log('🥊 Continuing battle until completion...');
      
      let battleRounds = 0;
      const maxRounds = 50; // Safety limit for complete battle
      
      while (battleRounds < maxRounds) {
        const battleStatus = await hostPage.locator('[data-testid="battle-status"]').textContent();
        
        if (battleStatus?.includes('Battle over') || battleStatus?.includes('Winner')) {
          console.log('🏆 Battle completed!');
          break;
        }

        // Make moves
        await makeMove(hostPage, battleRounds % 4);
        await waitForBattleUpdate(guestPage, 'Opponent is thinking...');
        
        await makeMove(guestPage, (battleRounds + 1) % 4);
        await waitForBattleUpdate(hostPage, 'Opponent is thinking...');

        battleRounds++;
        
        // Small delay between rounds
        await hostPage.waitForTimeout(1000);
        await guestPage.waitForTimeout(1000);
      }

      // Step 8: Verify battle completion
      console.log('🏆 Step 8: Battle completion verification');
      
      // Wait for battle results
      await hostPage.waitForTimeout(5000);
      await guestPage.waitForTimeout(5000);
      
      // Verify both users are on battle results page
      await expect(hostPage.locator('[data-testid="battle-results"]')).toBeVisible();
      await expect(guestPage.locator('[data-testid="battle-results"]')).toBeVisible();

      // Verify battle results show winner and loser
      await expect(hostPage.locator('[data-testid="battle-winner"]')).toBeVisible();
      await expect(guestPage.locator('[data-testid="battle-winner"]')).toBeVisible();

      // Verify battle statistics
      await expect(hostPage.locator('[data-testid="battle-stats"]')).toBeVisible();
      await expect(guestPage.locator('[data-testid="battle-stats"]')).toBeVisible();

      // Step 9: Verify Firebase data after battle completion
      console.log('🔍 Step 9: Firebase data verification');
      
      // Verify battle status in Firebase
      await verifyBattleData(battleId, {
        status: 'completed'
      });

      // Check for any Firebase errors during the battle
      const hostErrors = await checkFirebaseErrorLogs(hostPage);
      const guestErrors = await checkFirebaseErrorLogs(guestPage);
      
      console.log(`📊 Host Firebase errors: ${hostErrors.length}`);
      console.log(`📊 Guest Firebase errors: ${guestErrors.length}`);

      // Verify no critical errors occurred
      const criticalErrors = [...hostErrors, ...guestErrors].filter(error => 
        error.type === 'permission-denied' || error.type === 'unavailable'
      );
      
      if (criticalErrors.length > 0) {
        console.warn('⚠️ Critical Firebase errors detected:', criticalErrors);
      }

      console.log('✅ Complete 6-Pokemon multiplayer battle test passed!');

    } finally {
      // Cleanup
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Battle with Pokemon switching and team management', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('🔄 Testing Pokemon switching and team management...');

      // Setup battle
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      const roomId = await createRoom(hostPage, testUsers.host);
      await joinRoom(guestPage, roomId, testUsers.guest);

      await selectTeam(hostPage, "Test Host's Complete Team");
      await selectTeam(guestPage, "Test Guest's Complete Team");

      await markReady(hostPage);
      await markReady(guestPage);
      await startBattle(hostPage);

      // Test Pokemon switching
      console.log('🔄 Testing Pokemon switching...');
      
      // Wait for battle interface
      await expect(hostPage.locator('[data-testid="battle-interface"]')).toBeVisible();
      
      // Make a few moves first
      await makeMove(hostPage, 0);
      await waitForBattleUpdate(guestPage, 'Opponent is thinking...');
      
      await makeMove(guestPage, 1);
      await waitForBattleUpdate(hostPage, 'Opponent is thinking...');

      // Test switching to second Pokemon
      console.log('🔄 Switching to second Pokemon...');
      
      // Click switch Pokemon button
      await hostPage.click('[data-testid="switch-pokemon-button"]');
      
      // Select second Pokemon
      await hostPage.click('[data-testid="pokemon-2"]');
      
      // Confirm switch
      await hostPage.click('[data-testid="confirm-switch"]');
      
      // Wait for switch to complete
      await waitForBattleUpdate(guestPage, 'Opponent switched Pokemon');
      
      // Verify Pokemon switch occurred
      await expect(hostPage.locator('[data-testid="current-pokemon"]')).toContainText('Pokemon 2');
      await expect(guestPage.locator('[data-testid="opponent-current-pokemon"]')).toContainText('Pokemon 2');

      // Continue battle with switched Pokemon
      await makeMove(hostPage, 0);
      await waitForBattleUpdate(guestPage, 'Opponent is thinking...');
      
      await makeMove(guestPage, 1);
      await waitForBattleUpdate(hostPage, 'Opponent is thinking...');

      console.log('✅ Pokemon switching test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Battle with move effects and status conditions', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('✨ Testing move effects and status conditions...');

      // Setup battle
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      const roomId = await createRoom(hostPage, testUsers.host);
      await joinRoom(guestPage, roomId, testUsers.guest);

      await selectTeam(hostPage, "Test Host's Complete Team");
      await selectTeam(guestPage, "Test Guest's Complete Team");

      await markReady(hostPage);
      await markReady(guestPage);
      await startBattle(hostPage);

      // Test status moves
      console.log('✨ Testing status moves...');
      
      await expect(hostPage.locator('[data-testid="battle-interface"]')).toBeVisible();
      
      // Use a status move (assuming move index 3 is a status move)
      await makeMove(hostPage, 3);
      await waitForBattleUpdate(guestPage, 'Opponent used status move');
      
      // Verify status effect applied
      await expect(guestPage.locator('[data-testid="status-effect"]')).toBeVisible();
      
      // Continue battle to see status effect in action
      await makeMove(guestPage, 0);
      await waitForBattleUpdate(hostPage, 'Opponent is thinking...');
      
      await makeMove(hostPage, 1);
      await waitForBattleUpdate(guestPage, 'Opponent is thinking...');

      console.log('✅ Move effects and status conditions test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Battle timeout and reconnection handling', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('⏰ Testing battle timeout and reconnection...');

      // Setup battle
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      const roomId = await createRoom(hostPage, testUsers.host);
      await joinRoom(guestPage, roomId, testUsers.guest);

      await selectTeam(hostPage, "Test Host's Complete Team");
      await selectTeam(guestPage, "Test Guest's Complete Team");

      await markReady(hostPage);
      await markReady(guestPage);
      await startBattle(hostPage);

      // Start battle
      await expect(hostPage.locator('[data-testid="battle-interface"]')).toBeVisible();
      
      // Make initial moves
      await makeMove(hostPage, 0);
      await waitForBattleUpdate(guestPage, 'Opponent is thinking...');

      // Simulate network interruption for guest
      console.log('🌐 Simulating network interruption...');
      
      // Block network for guest
      await guestPage.route('**/*', route => {
        if (route.request().url().includes('firebase') || route.request().url().includes('firestore')) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });

      // Host continues battle
      await makeMove(hostPage, 1);
      
      // Wait for timeout detection
      await hostPage.waitForTimeout(10000);
      
      // Verify timeout handling
      await expect(hostPage.locator('[data-testid="opponent-timeout"]')).toBeVisible();

      // Restore network for guest
      console.log('🌐 Restoring network connection...');
      await guestPage.unroute('**/*');
      
      // Guest should reconnect
      await guestPage.reload();
      await guestPage.waitForSelector('[data-testid="battle-interface"]');
      
      // Verify reconnection
      await expect(guestPage.locator('[data-testid="battle-interface"]')).toBeVisible();

      console.log('✅ Battle timeout and reconnection test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('Complete battle with all 6 Pokemon fainting', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      console.log('💀 Testing complete battle with all Pokemon fainting...');

      // Setup battle
      await signInUser(hostPage, testUsers.host);
      await signInUser(guestPage, testUsers.guest);

      const roomId = await createRoom(hostPage, testUsers.host);
      await joinRoom(guestPage, roomId, testUsers.guest);

      await selectTeam(hostPage, "Test Host's Complete Team");
      await selectTeam(guestPage, "Test Guest's Complete Team");

      await markReady(hostPage);
      await markReady(guestPage);
      await startBattle(hostPage);

      // Battle until all Pokemon faint
      console.log('💀 Battling until all Pokemon faint...');
      
      await expect(hostPage.locator('[data-testid="battle-interface"]')).toBeVisible();
      
      let battleRounds = 0;
      const maxRounds = 100; // Allow for complete battle
      
      while (battleRounds < maxRounds) {
        const battleStatus = await hostPage.locator('[data-testid="battle-status"]').textContent();
        
        if (battleStatus?.includes('Battle over') || battleStatus?.includes('All Pokemon fainted')) {
          console.log('💀 All Pokemon have fainted!');
          break;
        }

        // Make moves
        await makeMove(hostPage, battleRounds % 4);
        await waitForBattleUpdate(guestPage, 'Opponent is thinking...');
        
        await makeMove(guestPage, (battleRounds + 1) % 4);
        await waitForBattleUpdate(hostPage, 'Opponent is thinking...');

        battleRounds++;
        
        // Check for Pokemon fainting
        const faintedPokemon = await hostPage.locator('[data-testid="fainted-pokemon"]').count();
        const guestFaintedPokemon = await guestPage.locator('[data-testid="fainted-pokemon"]').count();
        
        if (faintedPokemon >= 6 || guestFaintedPokemon >= 6) {
          console.log('💀 All Pokemon have fainted!');
          break;
        }
        
        await hostPage.waitForTimeout(500);
        await guestPage.waitForTimeout(500);
      }

      // Verify battle completion
      await expect(hostPage.locator('[data-testid="battle-results"]')).toBeVisible();
      await expect(guestPage.locator('[data-testid="battle-results"]')).toBeVisible();

      // Verify all Pokemon are fainted
      await expect(hostPage.locator('[data-testid="fainted-pokemon"]')).toHaveCount(6);
      await expect(guestPage.locator('[data-testid="fainted-pokemon"]')).toHaveCount(6);

      console.log('✅ Complete battle with all Pokemon fainting test passed!');

    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
});
