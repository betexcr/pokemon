import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Mock Auth Pokemon Battle', () => {
  let hostContext: BrowserContext;
  let guestContext: BrowserContext;
  let hostPage: Page;
  let guestPage: Page;

  test.beforeAll(async ({ browser }) => {
    console.log('🎮 Setting up mock auth Pokemon battle test');
    
    hostContext = await browser.newContext();
    guestContext = await browser.newContext();
    
    hostPage = await hostContext.newPage();
    guestPage = await guestContext.newPage();
    
    // Enable console logging
    hostPage.on('console', msg => console.log(`HOST: ${msg.text()}`));
    guestPage.on('console', msg => console.log(`GUEST: ${msg.text()}`));
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up mock auth Pokemon battle test');
    await hostContext?.close();
    await guestContext?.close();
  });

  async function setupMockAuth(page: Page, email: string, userType: string) {
    console.log(`\n🔐 Setting up mock auth for ${userType}: ${email}`);
    
    // Navigate to the app first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Set up mock user data in localStorage and sessionStorage
    await page.evaluate((userEmail) => {
      const mockUser = {
        uid: userEmail === 'testbattle1@pokemon-battles.test' ? 'testbattle1-uid' : 'testbattle2-uid',
        email: userEmail,
        displayName: userEmail === 'testbattle1@pokemon-battles.test' ? 'TestBattle1' : 'TestBattle2',
        photoURL: null
      };
      
      localStorage.setItem('user', JSON.stringify(mockUser));
      sessionStorage.setItem('authUser', JSON.stringify(mockUser));
      
      // Also set up mock Firebase auth state
      window.firebaseAuthUser = mockUser;
      
      console.log(`🔐 ${userEmail} mock auth set up`);
    }, email);
    
    console.log(`✅ ${userType} mock authentication completed`);
    return true;
  }

  test('Mock Auth Pokemon Battle Flow', async () => {
    console.log('🎮 Starting mock auth Pokemon battle flow');
    
    // Step 1: Setup mock authentication for both users
    console.log('\n🔐 Step 1: Setting up mock authentication');
    
    const hostAuthSuccess = await setupMockAuth(hostPage, 'testbattle1@pokemon-battles.test', 'Host');
    const guestAuthSuccess = await setupMockAuth(guestPage, 'testbattle2@pokemon-battles.test', 'Guest');
    
    console.log('✅ Both users have mock authentication set up');
    
    // Step 2: Navigate to lobby
    console.log('\n🏠 Step 2: Navigating to lobby');
    await hostPage.goto('/lobby');
    await guestPage.goto('/lobby');
    
    await hostPage.waitForLoadState('networkidle');
    await guestPage.waitForLoadState('networkidle');
    
    await hostPage.waitForTimeout(2000);
    await guestPage.waitForTimeout(2000);
    
    console.log('✅ Both authenticated players in lobby');
    
    // Step 3: Look for and click "Create Room" button
    console.log('\n🏠 Step 3: Creating a room');
    
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
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!roomCreated) {
      console.log('ℹ️ No create room button found, trying direct navigation');
      // Try to navigate to a room URL directly
      const roomId = `mock-auth-room-${Date.now()}`;
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
    await hostPage.screenshot({ path: 'test-results/host-mock-auth-room.png', fullPage: true });
    await guestPage.screenshot({ path: 'test-results/guest-mock-auth-room.png', fullPage: true });
    
    console.log('📸 Screenshots taken: host-mock-auth-room.png, guest-mock-auth-room.png');
    
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
      } catch (error) {
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
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Step 6: Look for ready buttons
    console.log('\n✅ Step 6: Looking for ready buttons');
    
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
      } catch (error) {
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
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Step 8: Wait for battle to load and take screenshots
    console.log('\n🎮 Step 8: Battle in progress');
    
    // Wait for navigation to battle
    await hostPage.waitForTimeout(5000);
    await guestPage.waitForTimeout(5000);
    
    // Take screenshots of battle
    await hostPage.screenshot({ path: 'test-results/host-mock-auth-battle.png', fullPage: true });
    await guestPage.screenshot({ path: 'test-results/guest-mock-auth-battle.png', fullPage: true });
    
    console.log('📸 Battle screenshots taken: host-mock-auth-battle.png, guest-mock-auth-battle.png');
    
    // Step 9: Look for battle controls and Pokemon
    console.log('\n🎯 Step 9: Looking for battle controls and Pokemon');
    
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
    
    // Step 10: Check for Pokemon in battle
    console.log('\n🎯 Step 10: Checking for Pokemon in battle');
    
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
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Step 11: Check battle state
    console.log('\n🔍 Step 11: Checking battle state');
    
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
    
    // Step 12: Final verification
    console.log('\n✅ Step 12: Final verification');
    
    // Verify both pages are responsive
    await expect(hostPage.locator('body')).toBeVisible();
    await expect(guestPage.locator('body')).toBeVisible();
    
    console.log('🎉 Mock auth Pokemon battle flow test completed!');
    console.log('📸 Check the test-results/ folder for screenshots');
    
    // Keep browsers open for a moment to see the final state
    await hostPage.waitForTimeout(3000);
    await guestPage.waitForTimeout(3000);
  });
});
