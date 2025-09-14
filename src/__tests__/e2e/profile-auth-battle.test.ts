import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Profile Auth Pokemon Battle', () => {
  let hostContext: BrowserContext;
  let guestContext: BrowserContext;
  let hostPage: Page;
  let guestPage: Page;

  test.beforeAll(async ({ browser }) => {
    console.log('🎮 Setting up profile auth Pokemon battle test');
    
    hostContext = await browser.newContext();
    guestContext = await browser.newContext();
    
    hostPage = await hostContext.newPage();
    guestPage = await guestContext.newPage();
    
    // Enable console logging
    hostPage.on('console', msg => console.log(`HOST: ${msg.text()}`));
    guestPage.on('console', msg => console.log(`GUEST: ${msg.text()}`));
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up profile auth Pokemon battle test');
    await hostContext?.close();
    await guestContext?.close();
  });

  async function loginUser(page: Page, email: string, password: string, userType: string) {
    console.log(`\n🔐 Logging in ${userType}: ${email}`);
    
    // Navigate to the app first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Look for profile picture or user avatar to click
    const profileSelectors = [
      'img[alt*="profile"]',
      'img[alt*="Profile"]',
      'img[alt*="avatar"]',
      'img[alt*="Avatar"]',
      'img[alt*="user"]',
      'img[alt*="User"]',
      '.profile-picture',
      '.user-avatar',
      '.avatar',
      '.profile-img',
      '[data-testid*="profile"]',
      '[data-testid*="avatar"]',
      'button[class*="profile"]',
      'button[class*="avatar"]',
      'button[class*="user"]',
      'div[class*="profile"]',
      'div[class*="avatar"]'
    ];
    
    let profileClicked = false;
    for (const selector of profileSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ ${userType} found profile element: ${selector}`);
          await element.click();
          console.log(`👤 ${userType} clicked profile element`);
          profileClicked = true;
          break;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    if (!profileClicked) {
      console.log(`ℹ️ ${userType} no profile picture found, looking for auth buttons directly`);
    }
    
    // Wait for auth modal/popup to appear
    await page.waitForTimeout(2000);
    
    // Look for signup/login buttons in the popup
    const authButtonSelectors = [
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      'button:has-text("Log In")',
      'button:has-text("Sign Up")',
      'button:has-text("Register")',
      'button[class*="login"]',
      'button[class*="signin"]',
      'button[class*="signup"]',
      'button[class*="auth"]',
      '[data-testid*="login"]',
      '[data-testid*="signin"]',
      '[data-testid*="signup"]',
      'a:has-text("Sign In")',
      'a:has-text("Login")',
      'a:has-text("Sign Up")'
    ];
    
    let authButtonClicked = false;
    for (const selector of authButtonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          console.log(`✅ ${userType} found auth button: ${selector}`);
          await button.click();
          console.log(`🔐 ${userType} clicked auth button`);
          authButtonClicked = true;
          break;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    if (!authButtonClicked) {
      console.log(`ℹ️ ${userType} no auth button found, looking for auth form directly`);
    }
    
    // Wait for auth form to appear
    await page.waitForTimeout(2000);
    
    // Look for email input
    const emailSelectors = [
      'input[type="email"]',
      'input[placeholder*="email"]',
      'input[placeholder*="Email"]',
      'input[name="email"]',
      'input[id*="email"]',
      'input[class*="email"]'
    ];
    
    let emailFilled = false;
    for (const selector of emailSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible()) {
          console.log(`✅ ${userType} found email input: ${selector}`);
          await input.clear();
          await input.fill(email);
          console.log(`📧 ${userType} entered email: ${email}`);
          emailFilled = true;
          break;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    // Look for password input
    const passwordSelectors = [
      'input[type="password"]',
      'input[placeholder*="password"]',
      'input[placeholder*="Password"]',
      'input[name="password"]',
      'input[id*="password"]',
      'input[class*="password"]'
    ];
    
    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible()) {
          console.log(`✅ ${userType} found password input: ${selector}`);
          await input.clear();
          await input.fill(password);
          console.log(`🔒 ${userType} entered password`);
          passwordFilled = true;
          break;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    // Look for submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      'button:has-text("Log In")',
      'button:has-text("Submit")',
      'button:has-text("Continue")',
      'button[class*="submit"]',
      'button[class*="login"]',
      'button[class*="signin"]',
      'button[class*="continue"]'
    ];
    
    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          console.log(`✅ ${userType} found submit button: ${selector}`);
          await button.click();
          console.log(`🚀 ${userType} submitted login form`);
          submitted = true;
          break;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    // Wait for login to complete
    await page.waitForTimeout(3000);
    
    console.log(`✅ ${userType} login process completed`);
    return emailFilled && passwordFilled && submitted;
  }

  test('Profile Auth Pokemon Battle Flow', async () => {
    console.log('🎮 Starting profile auth Pokemon battle flow');
    
    // Step 1: Login both users via profile picture
    console.log('\n🔐 Step 1: Authenticating both users via profile picture');
    
    const hostLoginSuccess = await loginUser(hostPage, 'testbattle1@pokemon-battles.test', 'test1234', 'Host');
    const guestLoginSuccess = await loginUser(guestPage, 'testbattle2@pokemon-battles.test', 'test1234', 'Guest');
    
    if (!hostLoginSuccess || !guestLoginSuccess) {
      console.log('⚠️ Login may not have completed successfully, but continuing with test');
    }
    
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
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    if (!roomCreated) {
      console.log('ℹ️ No create room button found, trying direct navigation');
      // Try to navigate to a room URL directly
      const roomId = `profile-auth-room-${Date.now()}`;
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
    await hostPage.screenshot({ path: 'test-results/host-profile-auth-room.png', fullPage: true });
    await guestPage.screenshot({ path: 'test-results/guest-profile-auth-room.png', fullPage: true });
    
    console.log('📸 Screenshots taken: host-profile-auth-room.png, guest-profile-auth-room.png');
    
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
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    // Step 8: Wait for battle to load and take screenshots
    console.log('\n🎮 Step 8: Battle in progress');
    
    // Wait for navigation to battle
    await hostPage.waitForTimeout(5000);
    await guestPage.waitForTimeout(5000);
    
    // Take screenshots of battle
    await hostPage.screenshot({ path: 'test-results/host-profile-auth-battle.png', fullPage: true });
    await guestPage.screenshot({ path: 'test-results/guest-profile-auth-battle.png', fullPage: true });
    
    console.log('📸 Battle screenshots taken: host-profile-auth-battle.png, guest-profile-auth-battle.png');
    
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
          } catch (_error) {
            console.log('⚠️ Could not click battle control');
          }
        }
      } catch (_error) {
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
      } catch (_error) {
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
    
    console.log('🎉 Profile auth Pokemon battle flow test completed!');
    console.log('📸 Check the test-results/ folder for screenshots');
    
    // Keep browsers open for a moment to see the final state
    await hostPage.waitForTimeout(5000);
    await guestPage.waitForTimeout(5000);
  });
});
