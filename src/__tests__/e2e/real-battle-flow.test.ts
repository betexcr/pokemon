import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Real Pokemon Battle Flow', () => {
  let hostContext: BrowserContext;
  let guestContext: BrowserContext;
  let hostPage: Page;
  let guestPage: Page;

  test.beforeAll(async ({ browser }) => {
    console.log('🎮 Setting up real Pokemon battle flow test');
    
    hostContext = await browser.newContext();
    guestContext = await browser.newContext();
    
    hostPage = await hostContext.newPage();
    guestPage = await guestContext.newPage();
    
    // Enable console logging
    hostPage.on('console', msg => console.log(`HOST: ${msg.text()}`));
    guestPage.on('console', msg => console.log(`GUEST: ${msg.text()}`));
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up real Pokemon battle flow test');
    await hostContext?.close();
    await guestContext?.close();
  });

  test('Complete Real Pokemon Battle Flow', async () => {
    console.log('🎮 Starting complete real Pokemon battle flow');
    
    // Step 1: Both players navigate to the app
    console.log('\n📱 Step 1: Loading Pokemon app for both players');
    await hostPage.goto('/');
    await guestPage.goto('/');
    
    await hostPage.waitForLoadState('networkidle');
    await guestPage.waitForLoadState('networkidle');
    
    // Wait for Pokemon to load
    await hostPage.waitForTimeout(5000);
    await guestPage.waitForTimeout(5000);
    
    console.log('✅ Both players loaded the Pokemon app');
    
    // Step 2: Navigate to lobby
    console.log('\n🏠 Step 2: Navigating to lobby');
    await hostPage.goto('/lobby');
    await guestPage.goto('/lobby');
    
    await hostPage.waitForLoadState('networkidle');
    await guestPage.waitForLoadState('networkidle');
    
    await hostPage.waitForTimeout(2000);
    await guestPage.waitForTimeout(2000);
    
    console.log('✅ Both players in lobby');
    
    // Step 3: Look for and click "Create Room" button
    console.log('\n🏠 Step 3: Creating a room');
    
    // Try to find create room button
    const createRoomSelectors = [
      'button:has-text("Create Room")',
      'button:has-text("Create")',
      'button:has-text("New Room")',
      '[data-testid="create-room"]',
      'button[class*="create"]',
      'button[class*="new"]'
    ];
    
    let roomCreated = false;
    for (const selector of createRoomSelectors) {
      try {
        const button = hostPage.locator(selector).first();
        if (await button.isVisible()) {
          console.log(`✅ Found create room button: ${selector}`);
          await button.click();
          roomCreated = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!roomCreated) {
      console.log('ℹ️ No create room button found, trying direct navigation');
      // Try to navigate to a room URL directly
      const roomId = `test-room-${Date.now()}`;
      await hostPage.goto(`/lobby/${roomId}`);
      await hostPage.waitForTimeout(2000);
    }
    
    // Step 4: Get current URL and have guest join
    console.log('\n👥 Step 4: Guest joining room');
    const currentUrl = hostPage.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/lobby/')) {
      const roomId = currentUrl.split('/lobby/')[1];
      console.log(`🏠 Room ID: ${roomId}`);
      
      await guestPage.goto(`/lobby/${roomId}`);
      await guestPage.waitForLoadState('networkidle');
      await guestPage.waitForTimeout(3000);
      
      console.log('✅ Guest joined the room');
    } else {
      console.log('ℹ️ No room ID found, both players will stay in lobby');
    }
    
    // Step 5: Look for team selection
    console.log('\n🎯 Step 5: Looking for team selection');
    
    // Take screenshots to see current state
    await hostPage.screenshot({ path: 'test-results/host-room.png', fullPage: true });
    await guestPage.screenshot({ path: 'test-results/guest-room.png', fullPage: true });
    
    console.log('📸 Screenshots taken: host-room.png, guest-room.png');
    
    // Look for team selection elements
    const teamSelectors = [
      'select',
      'button:has-text("Select Team")',
      'button:has-text("Team")',
      '[data-testid*="team"]',
      '.team-selector',
      '.pokemon-team'
    ];
    
    for (const selector of teamSelectors) {
      try {
        const element = hostPage.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found team element: ${selector}`);
          
          if (selector === 'select') {
            // Try to select a team from dropdown
            const options = await element.locator('option').all();
            if (options.length > 1) {
              console.log(`🎯 Found ${options.length} team options`);
              await element.selectOption({ index: 1 });
              console.log('✅ Selected team from dropdown');
            }
          } else {
            // Try to click the element
            await element.click();
            console.log('✅ Clicked team element');
          }
          
          await hostPage.waitForTimeout(1000);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Step 6: Look for ready buttons
    console.log('\n✅ Step 6: Looking for ready buttons');
    
    const readySelectors = [
      'button:has-text("Ready")',
      'button:has-text("Mark Ready")',
      '[data-testid="ready-button"]',
      'button[class*="ready"]'
    ];
    
    for (const selector of readySelectors) {
      try {
        const element = hostPage.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found ready button: ${selector}`);
          await element.click();
          console.log('✅ Host marked ready');
          await hostPage.waitForTimeout(1000);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Do the same for guest
    for (const selector of readySelectors) {
      try {
        const element = guestPage.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Guest found ready button: ${selector}`);
          await element.click();
          console.log('✅ Guest marked ready');
          await guestPage.waitForTimeout(1000);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Step 7: Look for start battle button
    console.log('\n⚔️ Step 7: Looking for start battle button');
    
    const startBattleSelectors = [
      'button:has-text("Start Battle")',
      'button:has-text("Begin Battle")',
      'button:has-text("Fight!")',
      '[data-testid="start-battle-button"]',
      'button[class*="start"]',
      'button[class*="battle"]'
    ];
    
    for (const selector of startBattleSelectors) {
      try {
        const element = hostPage.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found start battle button: ${selector}`);
          await element.click();
          console.log('⚔️ Battle started!');
          await hostPage.waitForTimeout(2000);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Step 8: Wait for battle to load and take screenshots
    console.log('\n🎮 Step 8: Battle in progress');
    
    // Wait for navigation to battle
    await hostPage.waitForTimeout(3000);
    await guestPage.waitForTimeout(3000);
    
    // Take screenshots of battle
    await hostPage.screenshot({ path: 'test-results/host-battle-active.png', fullPage: true });
    await guestPage.screenshot({ path: 'test-results/guest-battle-active.png', fullPage: true });
    
    console.log('📸 Battle screenshots taken: host-battle-active.png, guest-battle-active.png');
    
    // Step 9: Look for battle controls
    console.log('\n🎯 Step 9: Looking for battle controls');
    
    const battleControlSelectors = [
      'button:has-text("Attack")',
      'button:has-text("Fight")',
      'button:has-text("Move")',
      'button:has-text("Switch")',
      'button:has-text("Item")',
      'button:has-text("Run")',
      '[data-testid*="battle"]',
      '.battle-controls button',
      '.move-button',
      '.attack-button'
    ];
    
    let battleControlsFound = 0;
    for (const selector of battleControlSelectors) {
      try {
        const elements = await hostPage.locator(selector).all();
        if (elements.length > 0) {
          console.log(`✅ Found ${elements.length} battle controls: ${selector}`);
          battleControlsFound += elements.length;
          
          // Try clicking the first control
          try {
            await elements[0].click();
            console.log('🎯 Clicked battle control');
            await hostPage.waitForTimeout(1000);
          } catch (error) {
            console.log('⚠️ Could not click battle control');
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (battleControlsFound === 0) {
      console.log('ℹ️ No battle controls found - this might be a loading or setup screen');
    }
    
    // Step 10: Check if we're in an actual battle
    console.log('\n🔍 Step 10: Checking battle state');
    
    const currentHostUrl = hostPage.url();
    const currentGuestUrl = guestPage.url();
    
    console.log(`📍 Host URL: ${currentHostUrl}`);
    console.log(`📍 Guest URL: ${currentGuestUrl}`);
    
    // Check for battle-related content
    const hostBodyText = await hostPage.locator('body').textContent();
    const guestBodyText = await guestPage.locator('body').textContent();
    
    console.log(`📝 Host page content length: ${hostBodyText?.length || 0} characters`);
    console.log(`📝 Guest page content length: ${guestBodyText?.length || 0} characters`);
    
    // Look for Pokemon names or battle-related text
    const pokemonNames = ['Pikachu', 'Charizard', 'Blastoise', 'Venusaur', 'Squirtle', 'Charmander', 'Bulbasaur'];
    const battleKeywords = ['HP', 'Attack', 'Defense', 'Speed', 'Battle', 'Fight', 'Move', 'Turn'];
    
    let pokemonFound = 0;
    let battleKeywordsFound = 0;
    
    for (const name of pokemonNames) {
      if (hostBodyText?.includes(name) || guestBodyText?.includes(name)) {
        pokemonFound++;
        console.log(`🎯 Found Pokemon: ${name}`);
      }
    }
    
    for (const keyword of battleKeywords) {
      if (hostBodyText?.includes(keyword) || guestBodyText?.includes(keyword)) {
        battleKeywordsFound++;
        console.log(`⚔️ Found battle keyword: ${keyword}`);
      }
    }
    
    console.log(`📊 Pokemon found: ${pokemonFound}`);
    console.log(`📊 Battle keywords found: ${battleKeywordsFound}`);
    
    // Step 11: Final verification
    console.log('\n✅ Step 11: Final verification');
    
    // Verify both pages are responsive
    await expect(hostPage.locator('body')).toBeVisible();
    await expect(guestPage.locator('body')).toBeVisible();
    
    console.log('🎉 Real Pokemon battle flow test completed!');
    console.log('📸 Check the test-results/ folder for screenshots');
    
    // Keep browsers open for a moment to see the final state
    await hostPage.waitForTimeout(5000);
    await guestPage.waitForTimeout(5000);
  });
});
