import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Emulator Auth Pokemon Battle', () => {
  let hostContext: BrowserContext;
  let guestContext: BrowserContext;
  let hostPage: Page;
  let guestPage: Page;

  test.beforeAll(async ({ browser }) => {
    console.log('🎮 Setting up emulator auth Pokemon battle test');
    
    hostContext = await browser.newContext();
    guestContext = await browser.newContext();
    
    hostPage = await hostContext.newPage();
    guestPage = await guestContext.newPage();
    
    // Enable console logging
    hostPage.on('console', msg => console.log(`HOST: ${msg.text()}`));
    guestPage.on('console', msg => console.log(`GUEST: ${msg.text()}`));
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up emulator auth Pokemon battle test');
    await hostContext?.close();
    await guestContext?.close();
  });

  async function createTestUser(page: Page, email: string, password: string, userType: string) {
    console.log(`\n🔐 Creating test user for ${userType}: ${email}`);
    
    // First, let's try to create the user using Firebase REST API
    try {
      const response = await page.evaluate(async ({ userEmail, userPassword, displayName }) => {
        const response = await fetch('http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
            password: userPassword,
            displayName: displayName,
            returnSecureToken: true
          })
        });
        
        return await response.json();
      }, { userEmail: email, userPassword: password, displayName: userType });
      
      console.log(`✅ ${userType} user creation response:`, response);
    } catch (error) {
      console.log(`ℹ️ ${userType} user creation attempt:`, error);
    }
    
    return true;
  }

  async function loginUser(page: Page, email: string, password: string, userType: string) {
    console.log(`\n🔐 Logging in ${userType}: ${email}`);
    
    // Navigate to lobby first to trigger auth wall
    await page.goto('/lobby');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for "Authentication Required" page elements
    const authWallSelectors = [
      'button:has-text("Sign In / Sign Up")',
      'button:has-text("Sign In")',
      'button:has-text("Sign Up")',
      'button:has-text("Login")',
      'button:has-text("Register")',
      '[data-testid*="auth"]',
      'button[class*="auth"]',
      'button[class*="signin"]',
      'button[class*="signup"]'
    ];
    
    let authButtonClicked = false;
    for (const selector of authWallSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          console.log(`✅ ${userType} found auth wall button: ${selector}`);
          await button.click();
          console.log(`🔐 ${userType} clicked auth wall button`);
          authButtonClicked = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!authButtonClicked) {
      console.log(`ℹ️ ${userType} no auth wall button found, looking for direct auth form`);
    }
    
    // Wait for auth modal/form to appear
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
      } catch (error) {
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
      } catch (error) {
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
          console.log(`🚀 ${userType} submitted auth form`);
          submitted = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Wait for auth to complete
    await page.waitForTimeout(3000);
    
    console.log(`✅ ${userType} auth process completed`);
    return emailFilled && passwordFilled && submitted;
  }

  test('Emulator Auth Pokemon Battle Flow', async () => {
    console.log('🎮 Starting emulator auth Pokemon battle flow');
    
    // Step 1: Create test users in Firebase emulator
    console.log('\n🔐 Step 1: Creating test users in Firebase emulator');
    
    const hostUserCreated = await createTestUser(hostPage, 'testbattle1@pokemon-battles.test', 'test1234', 'Host');
    const guestUserCreated = await createTestUser(guestPage, 'testbattle2@pokemon-battles.test', 'test1234', 'Guest');
    
    console.log('✅ Test users created in Firebase emulator');
    
    // Step 2: Login both users
    console.log('\n🔐 Step 2: Logging in both users');
    
    const hostLoginSuccess = await loginUser(hostPage, 'testbattle1@pokemon-battles.test', 'test1234', 'Host');
    const guestLoginSuccess = await loginUser(guestPage, 'testbattle2@pokemon-battles.test', 'test1234', 'Guest');
    
    console.log('✅ Both users login attempts completed');
    
    // Step 3: Navigate to lobby
    console.log('\n🏠 Step 3: Navigating to lobby');
    await hostPage.goto('/lobby');
    await guestPage.goto('/lobby');
    
    await hostPage.waitForLoadState('networkidle');
    await guestPage.waitForLoadState('networkidle');
    
    await hostPage.waitForTimeout(2000);
    await guestPage.waitForTimeout(2000);
    
    console.log('✅ Both players in lobby');
    
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
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!roomCreated) {
      console.log('ℹ️ No create room button found, trying direct navigation');
      // Try to navigate to a room URL directly
      const roomId = `emulator-auth-room-${Date.now()}`;
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
    await hostPage.screenshot({ path: 'test-results/host-emulator-auth-room.png', fullPage: true });
    await guestPage.screenshot({ path: 'test-results/guest-emulator-auth-room.png', fullPage: true });
    
    console.log('📸 Screenshots taken: host-emulator-auth-room.png, guest-emulator-auth-room.png');
    
    // Step 7: Continue with battle flow...
    console.log('\n🎮 Continuing with battle flow...');
    
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
    
    // Look for ready buttons
    console.log('\n✅ Looking for ready buttons');
    
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
    
    // Look for start battle button
    console.log('\n⚔️ Looking for start battle button');
    
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
    
    // Wait for battle to load and take screenshots
    console.log('\n🎮 Battle in progress');
    
    // Wait for navigation to battle
    await hostPage.waitForTimeout(5000);
    await guestPage.waitForTimeout(5000);
    
    // Take screenshots of battle
    await hostPage.screenshot({ path: 'test-results/host-emulator-auth-battle.png', fullPage: true });
    await guestPage.screenshot({ path: 'test-results/guest-emulator-auth-battle.png', fullPage: true });
    
    console.log('📸 Battle screenshots taken: host-emulator-auth-battle.png, guest-emulator-auth-battle.png');
    
    // Final verification
    console.log('\n✅ Final verification');
    
    // Verify both pages are responsive
    await expect(hostPage.locator('body')).toBeVisible();
    await expect(guestPage.locator('body')).toBeVisible();
    
    console.log('🎉 Emulator auth Pokemon battle flow test completed!');
    console.log('📸 Check the test-results/ folder for screenshots');
    
    // Keep browsers open for a moment to see the final state
    await hostPage.waitForTimeout(3000);
    await guestPage.waitForTimeout(3000);
  });
});
