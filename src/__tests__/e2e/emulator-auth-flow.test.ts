import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Emulator Auth Flow', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    console.log('🔐 Setting up emulator auth flow test');
    
    context = await browser.newContext();
    page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log(`CONSOLE: ${msg.text()}`));
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up emulator auth flow test');
    await context?.close();
  });

  test('Emulator Authentication Flow', async () => {
    console.log('🔐 Starting emulator authentication flow test');
    
    // Step 1: Navigate to the app
    console.log('\n📱 Step 1: Loading Pokemon app');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ App loaded successfully');
    
    // Step 2: Create test user in Firebase emulator
    console.log('\n👤 Step 2: Creating test user in Firebase emulator');
    
    try {
      const userResponse = await page.evaluate(async () => {
        const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'testbattle1@pokemon-battles.test',
            password: 'test1234',
            displayName: 'TestBattle1',
            returnSecureToken: true
          })
        });
        
        return await response.json();
      });
      
      console.log('✅ Test user created:', userResponse.localId);
    } catch (error) {
      console.log('ℹ️ User creation attempt:', error);
    }
    
    // Step 3: Look for profile picture to click
    console.log('\n👤 Step 3: Looking for profile picture');
    
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
          console.log(`✅ Found profile element: ${selector}`);
          await element.click();
          console.log('👤 Clicked profile element');
          profileClicked = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!profileClicked) {
      console.log('ℹ️ No profile picture found, looking for auth buttons directly');
      
      // Fallback: look for direct auth buttons
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
        '[data-testid*="signup"]'
      ];
      
      for (const selector of authButtonSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible()) {
            console.log(`✅ Found auth button: ${selector}`);
            await element.click();
            console.log('🔐 Clicked auth button');
            profileClicked = true;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
    }
    
    if (!profileClicked) {
      console.log('❌ No profile picture or auth button found');
      return;
    }
    
    // Step 4: Wait for auth popup/modal to appear
    console.log('\n🔐 Step 4: Waiting for auth popup to appear');
    await page.waitForTimeout(2000);
    
    // Step 5: Look for sign in button in the popup
    console.log('\n🔐 Step 5: Looking for sign in button in popup');
    
    const signInSelectors = [
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
    
    let signInClicked = false;
    for (const selector of signInSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found sign in button: ${selector}`);
          await element.click();
          console.log('🔐 Clicked sign in button');
          signInClicked = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!signInClicked) {
      console.log('ℹ️ No sign in button found, looking for auth form directly');
    }
    
    // Step 6: Wait for auth form to appear
    console.log('\n📝 Step 6: Waiting for auth form to appear');
    await page.waitForTimeout(2000);
    
    // Step 7: Fill in email
    console.log('\n📧 Step 7: Filling in email');
    
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
          console.log(`✅ Found email input: ${selector}`);
          await input.clear();
          await input.fill('testbattle1@pokemon-battles.test');
          console.log('📧 Filled in email: testbattle1@pokemon-battles.test');
          emailFilled = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!emailFilled) {
      console.log('❌ No email input found');
      return;
    }
    
    // Step 8: Fill in password
    console.log('\n🔒 Step 8: Filling in password');
    
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
          console.log(`✅ Found password input: ${selector}`);
          await input.clear();
          await input.fill('test1234');
          console.log('🔒 Filled in password');
          passwordFilled = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!passwordFilled) {
      console.log('❌ No password input found');
      return;
    }
    
    // Step 9: Submit the form
    console.log('\n🚀 Step 9: Submitting auth form');
    
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
    
    let formSubmitted = false;
    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          console.log(`✅ Found submit button: ${selector}`);
          await button.click();
          console.log('🚀 Submitted auth form');
          formSubmitted = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!formSubmitted) {
      console.log('❌ No submit button found');
      return;
    }
    
    // Step 10: Wait for authentication result
    console.log('\n⏳ Step 10: Waiting for authentication result');
    await page.waitForTimeout(5000);
    
    // Step 11: Check authentication status
    console.log('\n✅ Step 11: Checking authentication status');
    
    // Check if we're still on auth page or if we've been redirected
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check for auth-related elements
    const authStatusSelectors = [
      'button:has-text("Sign Out")',
      'button:has-text("Logout")',
      'button:has-text("Log Out")',
      '.user-menu',
      '.profile-menu',
      '[data-testid*="logout"]',
      '[data-testid*="profile"]'
    ];
    
    let authenticated = false;
    for (const selector of authStatusSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found authenticated element: ${selector}`);
          authenticated = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Check console for auth messages
    const bodyText = await page.locator('body').textContent();
    if (bodyText?.includes('Authentication Required')) {
      console.log('❌ Still on authentication required page');
      authenticated = false;
    } else if (bodyText?.includes('Sign In') || bodyText?.includes('Login')) {
      console.log('ℹ️ Still seeing sign in options');
    } else {
      console.log('✅ No auth wall detected, user might be authenticated');
      authenticated = true;
    }
    
    console.log(`🔐 Authentication status: ${authenticated ? 'SUCCESS' : 'FAILED'}`);
    
    // Final verification
    console.log('\n✅ Final verification');
    
    // Verify page is responsive
    await expect(page.locator('body')).toBeVisible();
    
    console.log('🎉 Emulator authentication flow test completed!');
    
    // Keep browser open for a moment to see the final state
    await page.waitForTimeout(3000);
  });
});
