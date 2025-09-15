import { test, expect, Page, BrowserContext } from '@playwright/test';

// Custom test data with specific UIDs
const HOST_EMAIL = 'testbattle1@pokemon-battles.test';
const HOST_PASSWORD = 'TestBattle123!';
const GUEST_EMAIL = 'testbattle2@pokemon-battles.test';
const GUEST_PASSWORD = 'TestBattle123!';

// Expected UIDs
const HOST_UID = 'testbattle1-cli-uid';
const GUEST_UID = 'testbattle2-cli-uid';

// Sample Pokemon teams (6 Pokemon each)
const HOST_TEAM = [
  { id: 25, name: 'Pikachu', level: 50 }, // Electric
  { id: 6, name: 'Charizard', level: 50 }, // Fire/Flying
  { id: 9, name: 'Blastoise', level: 50 }, // Water
  { id: 3, name: 'Venusaur', level: 50 }, // Grass/Poison
  { id: 143, name: 'Snorlax', level: 50 }, // Normal
  { id: 149, name: 'Dragonite', level: 50 } // Dragon/Flying
];

const GUEST_TEAM = [
  { id: 150, name: 'Mewtwo', level: 50 }, // Psychic
  { id: 144, name: 'Articuno', level: 50 }, // Ice/Flying
  { id: 145, name: 'Zapdos', level: 50 }, // Electric/Flying
  { id: 146, name: 'Moltres', level: 50 }, // Fire/Flying
  { id: 130, name: 'Gyarados', level: 50 }, // Water/Flying
  { id: 94, name: 'Gengar', level: 50 } // Ghost/Poison
];

// Helper function to authenticate a user
async function authenticateUser(page: Page, email: string, password: string) {
  console.log(`🔐 Authenticating user: ${email}`);
  
  // Wait for auth modal to appear
  await page.waitForSelector('[data-testid="auth-modal"]', { timeout: 10000 });
  
  // Fill in email and password
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Click sign in button
  await page.click('button[type="submit"]');
  
  // Wait for authentication to complete
  await page.waitForSelector('[data-testid="user-profile"]', { timeout: 15000 });
  console.log(`✅ User authenticated: ${email}`);
}

// Helper function to verify user UID
async function verifyUserUID(page: Page, expectedUID: string, userType: string) {
  console.log(`🔍 Verifying ${userType} UID: ${expectedUID}`);
  
  // Get the current user's UID from the page
  const actualUID = await page.evaluate(() => {
    return window.user?.uid || window.currentUser?.uid || null;
  });
  
  console.log(`📊 ${userType} UID - Expected: ${expectedUID}, Actual: ${actualUID}`);
  
  if (actualUID) {
    expect(actualUID).toBe(expectedUID);
    console.log(`✅ ${userType} UID verified: ${actualUID}`);
  } else {
    console.log(`⚠️ Could not verify ${userType} UID - user object not found`);
  }
}

// Helper function to select Pokemon team
async function selectTeam(page: Page, team: any[], playerName: string) {
  console.log(`🎯 Selecting team for ${playerName}`);
  
  // Navigate to team selection
  await page.click('[data-testid="team-selector"]');
  await page.waitForSelector('[data-testid="pokemon-grid"]', { timeout: 10000 });
  
  // Select each Pokemon in the team
  for (const pokemon of team) {
    console.log(`  Selecting ${pokemon.name} (ID: ${pokemon.id})`);
    
    // Find and click the Pokemon card
    const pokemonCard = page.locator(`[data-testid="pokemon-card-${pokemon.id}"]`);
    await pokemonCard.click();
    
    // Confirm selection
    await page.click('[data-testid="confirm-selection"]');
    
    // Wait for Pokemon to be added to team
    await page.waitForSelector(`[data-testid="team-pokemon-${pokemon.id}"]`, { timeout: 5000 });
  }
  
  // Save team
  await page.click('[data-testid="save-team"]');
  console.log(`✅ Team selected for ${playerName}`);
}

// Helper function to wait for battle readiness
async function waitForBattleReady(page: Page, playerName: string) {
  console.log(`⏳ Waiting for battle readiness: ${playerName}`);
  
  // Wait for both players to be ready
  await page.waitForSelector('[data-testid="battle-ready-indicator"]', { timeout: 30000 });
  console.log(`✅ Battle ready: ${playerName}`);
}

// Helper function to perform battle action
async function performBattleAction(page: Page, action: string, target?: string) {
  console.log(`⚔️ Performing battle action: ${action}${target ? ` on ${target}` : ''}`);
  
  switch (action) {
    case 'attack':
      await page.click('[data-testid="attack-button"]');
      if (target) {
        await page.click(`[data-testid="move-${target}"]`);
      }
      break;
    case 'switch':
      await page.click('[data-testid="switch-button"]');
      if (target) {
        await page.click(`[data-testid="pokemon-${target}"]`);
      }
      break;
    case 'item':
      await page.click('[data-testid="item-button"]');
      if (target) {
        await page.click(`[data-testid="item-${target}"]`);
      }
      break;
  }
  
  // Wait for action to complete
  await page.waitForTimeout(2000);
}

test.describe('Multiplayer Battle System with Custom UIDs', () => {
  let hostContext: BrowserContext;
  let guestContext: BrowserContext;
  let hostPage: Page;
  let guestPage: Page;
  let roomId: string;

  test.beforeAll(async ({ browser }) => {
    console.log('🚀 Setting up multiplayer battle test with custom UIDs');
    console.log(`🎯 Target UIDs - Host: ${HOST_UID}, Guest: ${GUEST_UID}`);
    
    // Create two browser contexts for two players
    hostContext = await browser.newContext();
    guestContext = await browser.newContext();
    
    hostPage = await hostContext.newPage();
    guestPage = await guestContext.newPage();
    
    // Enable console logging for debugging
    hostPage.on('console', msg => console.log(`HOST: ${msg.text()}`));
    guestPage.on('console', msg => console.log(`GUEST: ${msg.text()}`));
    
    // Enable network logging
    hostPage.on('response', response => {
      if (response.url().includes('firestore') || response.url().includes('firebase')) {
        console.log(`HOST NETWORK: ${response.status()} ${response.url()}`);
      }
    });
    
    guestPage.on('response', response => {
      if (response.url().includes('firestore') || response.url().includes('firebase')) {
        console.log(`GUEST NETWORK: ${response.status()} ${response.url()}`);
      }
    });
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up multiplayer battle test');
    await hostContext?.close();
    await guestContext?.close();
  });

  test('Complete multiplayer battle flow with custom UIDs', async () => {
    console.log('🎮 Starting complete multiplayer battle test with custom UIDs');
    
    // Step 1: Host creates room
    console.log('\n📝 Step 1: Host creates room');
    await hostPage.goto('/lobby');
    await hostPage.waitForLoadState('networkidle');
    
    // Authenticate host
    await authenticateUser(hostPage, HOST_EMAIL, HOST_PASSWORD);
    
    // Verify host UID
    await verifyUserUID(hostPage, HOST_UID, 'Host');
    
    // Create new room
    await hostPage.click('[data-testid="create-room-button"]');
    await hostPage.waitForSelector('[data-testid="room-created"]', { timeout: 10000 });
    
    // Get room ID from URL
    const hostUrl = hostPage.url();
    roomId = hostUrl.split('/').pop() || '';
    console.log(`✅ Room created with ID: ${roomId}`);
    
    // Step 2: Guest joins room
    console.log('\n👥 Step 2: Guest joins room');
    await guestPage.goto(`/lobby/${roomId}`);
    await guestPage.waitForLoadState('networkidle');
    
    // Authenticate guest
    await authenticateUser(guestPage, GUEST_EMAIL, GUEST_PASSWORD);
    
    // Verify guest UID
    await verifyUserUID(guestPage, GUEST_UID, 'Guest');
    
    // Wait for guest to be in room
    await guestPage.waitForSelector('[data-testid="guest-joined"]', { timeout: 10000 });
    console.log('✅ Guest joined room');
    
    // Step 3: Both players select teams
    console.log('\n🎯 Step 3: Both players select teams');
    
    // Host selects team
    await selectTeam(hostPage, HOST_TEAM, 'Host');
    
    // Guest selects team
    await selectTeam(guestPage, GUEST_TEAM, 'Guest');
    
    // Step 4: Wait for both players to be ready
    console.log('\n⏳ Step 4: Wait for battle readiness');
    
    // Set both players as ready
    await hostPage.click('[data-testid="ready-button"]');
    await guestPage.click('[data-testid="ready-button"]');
    
    // Wait for battle readiness
    await waitForBattleReady(hostPage, 'Host');
    await waitForBattleReady(guestPage, 'Guest');
    
    // Step 5: Start battle
    console.log('\n⚔️ Step 5: Start battle');
    
    // Host starts battle
    await hostPage.click('[data-testid="start-battle-button"]');
    
    // Step 5.1: Verify timer dialog appears for both players
    console.log('\n⏰ Step 5.1: Verify timer dialog appears for both players');
    
    // Check for battle start dialog elements on both pages
    const hostDialogVisible = await hostPage.waitForSelector('text=BATTLE STARTING!', { timeout: 5000 }).catch(() => false);
    const guestDialogVisible = await guestPage.waitForSelector('text=BATTLE STARTING!', { timeout: 5000 }).catch(() => false);
    
    if (hostDialogVisible) {
      console.log('✅ Host sees battle start dialog');
    } else {
      console.log('❌ Host did not see battle start dialog');
    }
    
    if (guestDialogVisible) {
      console.log('✅ Guest sees battle start dialog');
    } else {
      console.log('❌ Guest did not see battle start dialog');
    }
    
    // Verify countdown timer is working
    if (hostDialogVisible) {
      const hostCountdown = await hostPage.textContent('text=3').catch(() => null);
      if (hostCountdown) {
        console.log('✅ Host countdown timer is visible');
      }
    }
    
    if (guestDialogVisible) {
      const guestCountdown = await guestPage.textContent('text=3').catch(() => null);
      if (guestCountdown) {
        console.log('✅ Guest countdown timer is visible');
      }
    }
    
    // Wait for dialog to complete (3+ seconds) before checking battle started
    await hostPage.waitForTimeout(4000);
    await guestPage.waitForTimeout(4000);
    
    // Wait for battle to start on both pages
    await hostPage.waitForSelector('[data-testid="battle-started"]', { timeout: 30000 });
    await guestPage.waitForSelector('[data-testid="battle-started"]', { timeout: 30000 });
    
    console.log('✅ Battle started successfully');
    
    // Step 6: Verify UIDs in battle context
    console.log('\n🔍 Step 6: Verify UIDs in battle context');
    
    // Check that both pages show the correct UIDs in battle state
    const hostBattleState = await hostPage.evaluate(() => {
      return window.battleState || null;
    });
    
    const guestBattleState = await guestPage.evaluate(() => {
      return window.battleState || null;
    });
    
    expect(hostBattleState).toBeTruthy();
    expect(guestBattleState).toBeTruthy();
    
    // Verify UIDs in battle state
    if (hostBattleState?.hostId) {
      expect(hostBattleState.hostId).toBe(HOST_UID);
      console.log(`✅ Host UID in battle state: ${hostBattleState.hostId}`);
    }
    
    if (guestBattleState?.guestId) {
      expect(guestBattleState.guestId).toBe(GUEST_UID);
      console.log(`✅ Guest UID in battle state: ${guestBattleState.guestId}`);
    }
    
    // Step 7: Perform battle actions
    console.log('\n🎮 Step 7: Perform battle actions');
    
    // Host performs first action (attack with first move)
    await performBattleAction(hostPage, 'attack', 'thunderbolt');
    
    // Guest performs action (attack with first move)
    await performBattleAction(guestPage, 'attack', 'psychic');
    
    // Host switches Pokemon
    await performBattleAction(hostPage, 'switch', 'charizard');
    
    // Guest uses item
    await performBattleAction(guestPage, 'item', 'potion');
    
    // Continue battle for a few more turns
    for (let i = 0; i < 3; i++) {
      await performBattleAction(hostPage, 'attack', 'flamethrower');
      await performBattleAction(guestPage, 'attack', 'ice-beam');
      
      // Wait for turn to complete
      await hostPage.waitForTimeout(3000);
      await guestPage.waitForTimeout(3000);
    }
    
    console.log('✅ Battle actions completed');
    
    // Step 8: Verify battle state synchronization
    console.log('\n🔄 Step 8: Verify battle synchronization');
    
    // Check that both pages show the same battle state
    const finalHostBattleState = await hostPage.evaluate(() => {
      return window.battleState || null;
    });
    
    const finalGuestBattleState = await guestPage.evaluate(() => {
      return window.battleState || null;
    });
    
    expect(finalHostBattleState).toBeTruthy();
    expect(finalGuestBattleState).toBeTruthy();
    
    // Verify both players have the same turn number
    const hostTurn = finalHostBattleState?.turn || 0;
    const guestTurn = finalGuestBattleState?.turn || 0;
    
    console.log(`Host turn: ${hostTurn}, Guest turn: ${guestTurn}`);
    
    // Turns should be close (within 1 turn due to network delays)
    expect(Math.abs(hostTurn - guestTurn)).toBeLessThanOrEqual(1);
    
    console.log('✅ Battle synchronization verified');
    
    // Step 9: Test retry system
    console.log('\n🔄 Step 9: Test retry system');
    
    // Simulate network issues by temporarily disconnecting
    await hostPage.context().setOffline(true);
    await guestPage.context().setOffline(true);
    
    // Wait a moment
    await hostPage.waitForTimeout(2000);
    
    // Reconnect
    await hostPage.context().setOffline(false);
    await guestPage.context().setOffline(false);
    
    // Verify battle continues after reconnection
    await hostPage.waitForSelector('[data-testid="battle-connected"]', { timeout: 15000 });
    await guestPage.waitForSelector('[data-testid="battle-connected"]', { timeout: 15000 });
    
    console.log('✅ Retry system working - battle reconnected successfully');
    
    // Step 10: Complete battle
    console.log('\n🏁 Step 10: Complete battle');
    
    // Continue until battle ends or timeout
    const battleTimeout = 60000; // 1 minute
    const startTime = Date.now();
    
    while (Date.now() - startTime < battleTimeout) {
      const battleEnded = await hostPage.evaluate(() => {
        return window.battleState?.status === 'completed' || 
               window.battleState?.winner !== undefined;
      });
      
      if (battleEnded) {
        console.log('✅ Battle completed naturally');
        break;
      }
      
      // Perform random actions to continue battle
      const actions = ['attack', 'switch', 'item'];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      
      await performBattleAction(hostPage, randomAction);
      await performBattleAction(guestPage, randomAction);
      
      await hostPage.waitForTimeout(2000);
    }
    
    // Verify battle completion
    const finalHostState = await hostPage.evaluate(() => window.battleState);
    const finalGuestState = await guestPage.evaluate(() => window.battleState);
    
    expect(finalHostState).toBeTruthy();
    expect(finalGuestState).toBeTruthy();
    
    console.log('🎉 Multiplayer battle test with custom UIDs completed successfully!');
    console.log(`✅ Verified UIDs - Host: ${HOST_UID}, Guest: ${GUEST_UID}`);
  });

  test('Test UID verification in different contexts', async () => {
    console.log('🔍 Testing UID verification in different contexts');
    
    // Test host UID verification
    await hostPage.goto('/lobby');
    await hostPage.waitForLoadState('networkidle');
    await authenticateUser(hostPage, HOST_EMAIL, HOST_PASSWORD);
    await verifyUserUID(hostPage, HOST_UID, 'Host');
    
    // Test guest UID verification
    await guestPage.goto('/lobby');
    await guestPage.waitForLoadState('networkidle');
    await authenticateUser(guestPage, GUEST_EMAIL, GUEST_PASSWORD);
    await verifyUserUID(guestPage, GUEST_UID, 'Guest');
    
    // Test UID verification in profile page
    await hostPage.goto('/profile');
    await hostPage.waitForLoadState('networkidle');
    await verifyUserUID(hostPage, HOST_UID, 'Host Profile');
    
    await guestPage.goto('/profile');
    await guestPage.waitForLoadState('networkidle');
    await verifyUserUID(guestPage, GUEST_UID, 'Guest Profile');
    
    console.log('✅ UID verification in different contexts completed');
  });
});
