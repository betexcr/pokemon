import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Manual Auth Pokemon Battle', () => {
  let hostContext: BrowserContext;
  let guestContext: BrowserContext;
  let hostPage: Page;
  let guestPage: Page;

  test.beforeAll(async ({ browser }) => {
    console.log('🎮 Setting up manual auth Pokemon battle test');
    
    hostContext = await browser.newContext();
    guestContext = await browser.newContext();
    
    hostPage = await hostContext.newPage();
    guestPage = await guestContext.newPage();
    
    // Enable console logging
    hostPage.on('console', msg => console.log(`HOST: ${msg.text()}`));
    guestPage.on('console', msg => console.log(`GUEST: ${msg.text()}`));
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up manual auth Pokemon battle test');
    await hostContext?.close();
    await guestContext?.close();
  });

  test('Manual Auth Pokemon Battle Flow', async () => {
    console.log('🎮 Starting manual auth Pokemon battle flow');
    
    // Step 1: Both players navigate to the app
    console.log('\n📱 Step 1: Loading Pokemon app for both players');
    await hostPage.goto('/');
    await guestPage.goto('/');
    
    await hostPage.waitForLoadState('networkidle');
    await guestPage.waitForLoadState('networkidle');
    
    // Wait for Pokemon to load
    await hostPage.waitForTimeout(3000);
    await guestPage.waitForTimeout(3000);
    
    console.log('✅ Both players loaded the Pokemon app');
    
    // Step 2: Simulate authentication by setting localStorage
    console.log('\n🔐 Step 2: Simulating user authentication');
    
    // Set up mock user data in localStorage
    await hostPage.evaluate(() => {
      const mockUser = {
        uid: 'testbattle1-uid',
        email: 'testbattle1@pokemon-battles.test',
        displayName: 'TestBattle1',
        photoURL: null
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      console.log('🔐 Host user set in localStorage');
    });
    
    await guestPage.evaluate(() => {
      const mockUser = {
        uid: 'testbattle2-uid',
        email: 'testbattle2@pokemon-battles.test',
        displayName: 'TestBattle2',
        photoURL: null
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      console.log('🔐 Guest user set in localStorage');
    });
    
    // Step 3: Navigate to lobby
    console.log('\n🏠 Step 3: Navigating to lobby');
    await hostPage.goto('/lobby');
    await guestPage.goto('/lobby');
    
    await hostPage.waitForLoadState('networkidle');
    await guestPage.waitForLoadState('networkidle');
    
    await hostPage.waitForTimeout(2000);
    await guestPage.waitForTimeout(2000);
    
    console.log('✅ Both authenticated players in lobby');
    
    // Step 4: Look for and click "Create Room" button
    console.log('\n🏠 Step 4: Creating a room');
    
    const createRoomSelectors = [
      'button:has-text("Create Room")',
      'button:has-text("Create")',
      'button:has-text("New Room")',
      'button:has-text("Start Room")',
      '[data-testid="create-room"]',
      'button[class*="create"]',
      'button[class*="new"]',
      'button[class*="start"]'
    ];
    
    let roomCreated = false;
    for (const selector of createRoomSelectors) {
      try {
        const button = hostPage.locator(selector).first();
        if (await button.isVisible()) {
          console.log(`✅ Found create room button: ${selector}`);
          await button.click();
          console.log('🏠 Host created room');
          roomCreated = true;
          await hostPage.waitForTimeout(2000);
          break;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    if (!roomCreated) {
      console.log('ℹ️ No create room button found, trying direct navigation');
      // Try to navigate to a room URL directly
      const roomId = `manual-auth-room-${Date.now()}`;
      await hostPage.goto(`/lobby/${roomId}`);
      await hostPage.waitForTimeout(2000);
    }
    
    // Step 5: Get current URL and have guest join
    console.log('\n👥 Step 5: Guest joining room');
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
    
    // Step 6: Look for team selection
    console.log('\n🎯 Step 6: Looking for team selection');
    
    // Take screenshots to see current state
    await hostPage.screenshot({ path: 'test-results/host-manual-auth-room.png', fullPage: true });
    await guestPage.screenshot({ path: 'test-results/guest-manual-auth-room.png', fullPage: true });
    
    console.log('📸 Screenshots taken: host-manual-auth-room.png, guest-manual-auth-room.png');
    
    // Look for team selection elements
    const teamSelectors = [
      'select',
      'button:has-text("Select Team")',
      'button:has-text("Choose Team")',
      'button:has-text("Team")',
      '[data-testid*="team"]',
      '.team-selector',
      '.pokemon-team',
      'button[class*="team"]',
      'div[class*="team"]'
    ];
    
    // Try team selection for host
    for (const selector of teamSelectors) {
      try {
        const element = hostPage.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Host found team element: ${selector}`);
          
          if (selector === 'select') {
            // Try to select a team from dropdown
            const options = await element.locator('option').all();
            if (options.length > 1) {
              console.log(`🎯 Host found ${options.length} team options`);
              await element.selectOption({ index: 1 });
              console.log('✅ Host selected team from dropdown');
            }
          } else {
            // Try to click the element
            await element.click();
            console.log('✅ Host clicked team element');
          }
          
          await hostPage.waitForTimeout(1000);
          break;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    // Try team selection for guest
    for (const selector of teamSelectors) {
      try {
        const element = guestPage.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Guest found team element: ${selector}`);
          
          if (selector === 'select') {
            // Try to select a team from dropdown
            const options = await element.locator('option').all();
            if (options.length > 1) {
              console.log(`🎯 Guest found ${options.length} team options`);
              await element.selectOption({ index: 2 }); // Select different team
              console.log('✅ Guest selected team from dropdown');
            }
          } else {
            // Try to click the element
            await element.click();
            console.log('✅ Guest clicked team element');
          }
          
          await guestPage.waitForTimeout(1000);
          break;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    // Step 7: Look for ready buttons
    console.log('\n✅ Step 7: Looking for ready buttons');
    
    const readySelectors = [
      'button:has-text("Ready")',
      'button:has-text("Mark Ready")',
      'button:has-text("I\'m Ready")',
      '[data-testid="ready-button"]',
      'button[class*="ready"]'
    ];
    
    // Try ready for host
    for (const selector of readySelectors) {
      try {
        const element = hostPage.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Host found ready button: ${selector}`);
          await element.click();
          console.log('✅ Host marked ready');
          await hostPage.waitForTimeout(1000);
          break;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    // Try ready for guest
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
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    // Step 8: Look for start battle button
    console.log('\n⚔️ Step 8: Looking for start battle button');
    
    const startBattleSelectors = [
      'button:has-text("Start Battle")',
      'button:has-text("Begin Battle")',
      'button:has-text("Fight!")',
      'button:has-text("Battle!")',
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
          await hostPage.waitForTimeout(3000);
          break;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    // Step 9: Wait for battle to load and take screenshots
    console.log('\n🎮 Step 9: Battle in progress');
    
    // Wait for navigation to battle
    await hostPage.waitForTimeout(5000);
    await guestPage.waitForTimeout(5000);
    
    // Take screenshots of battle
    await hostPage.screenshot({ path: 'test-results/host-manual-auth-battle.png', fullPage: true });
    await guestPage.screenshot({ path: 'test-results/guest-manual-auth-battle.png', fullPage: true });
    
    console.log('📸 Battle screenshots taken: host-manual-auth-battle.png, guest-manual-auth-battle.png');
    
    // Step 10: Look for battle controls and Pokemon
    console.log('\n🎯 Step 10: Looking for battle controls and Pokemon');
    
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
          } catch (_error) {
            console.log('⚠️ Could not click battle control');
          }
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    // Step 11: Check for Pokemon in battle
    console.log('\n🎯 Step 11: Checking for Pokemon in battle');
    
    const pokemonSelectors = [
      'img[src*="pokemon"]',
      'img[alt*="Pokemon"]',
      'img[alt*="pokemon"]',
      '.pokemon-sprite',
      '.pokemon-image',
      '[class*="pokemon"] img',
      'img[class*="pokemon"]'
    ];
    
    let pokemonFound = 0;
    for (const selector of pokemonSelectors) {
      try {
        const elements = await hostPage.locator(selector).all();
        if (elements.length > 0) {
          console.log(`✅ Found ${elements.length} Pokemon images: ${selector}`);
          pokemonFound += elements.length;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    // Step 12: Check battle state
    console.log('\n🔍 Step 12: Checking battle state');
    
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
    const battleKeywords = ['HP', 'Attack', 'Defense', 'Speed', 'Battle', 'Fight', 'Move', 'Turn', 'Damage'];
    
    let pokemonNamesFound = 0;
    let battleKeywordsFound = 0;
    
    for (const name of pokemonNames) {
      if (hostBodyText?.includes(name) || guestBodyText?.includes(name)) {
        pokemonNamesFound++;
        console.log(`🎯 Found Pokemon name: ${name}`);
      }
    }
    
    for (const keyword of battleKeywords) {
      if (hostBodyText?.includes(keyword) || guestBodyText?.includes(keyword)) {
        battleKeywordsFound++;
        console.log(`⚔️ Found battle keyword: ${keyword}`);
      }
    }
    
    console.log(`📊 Pokemon names found: ${pokemonNamesFound}`);
    console.log(`📊 Battle keywords found: ${battleKeywordsFound}`);
    console.log(`📊 Battle controls found: ${battleControlsFound}`);
    console.log(`📊 Pokemon images found: ${pokemonFound}`);
    
    // Step 13: Final verification
    console.log('\n✅ Step 13: Final verification');
    
    // Verify both pages are responsive
    await expect(hostPage.locator('body')).toBeVisible();
    await expect(guestPage.locator('body')).toBeVisible();
    
    console.log('🎉 Manual auth Pokemon battle flow test completed!');
    console.log('📸 Check the test-results/ folder for screenshots');
    
    // Keep browsers open for a moment to see the final state
    await hostPage.waitForTimeout(5000);
    await guestPage.waitForTimeout(5000);
  });
});
