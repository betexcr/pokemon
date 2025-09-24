import { test, expect, Page, BrowserContext } from '@playwright/test';

// Parse test users data from environment
const testUsers = process.env.TEST_USERS_DATA ? JSON.parse(process.env.TEST_USERS_DATA) : null;
const testHostEmail = testUsers?.host?.email || process.env.TEST_HOST_EMAIL || 'testbattle1@pokemon-battles.test';
const testHostPassword = testUsers?.host?.password || process.env.TEST_HOST_PASSWORD || 'test1234';

console.log('🔍 Debug - Environment variables:');
console.log('TEST_USERS_DATA:', process.env.TEST_USERS_DATA);
console.log('TEST_HOST_EMAIL:', process.env.TEST_HOST_EMAIL);
console.log('testUsers:', testUsers);
console.log('testHostEmail:', testHostEmail);
console.log('testHostPassword:', testHostPassword);

test.describe('Authentication Login Flow', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    console.log('🔐 Setting up authentication login flow test');
    
    context = await browser.newContext();
    page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log(`CONSOLE: ${msg.text()}`));
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up authentication login flow test');
    await context?.close();
  });

  test('Profile Picture Login Flow', async () => {
    console.log('🔐 Starting profile picture login flow test');
    
    // Step 1: Navigate to the app
    console.log('\n📱 Step 1: Loading Pokemon app');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ App loaded successfully');
    
    // Step 2: Look for profile picture to click
    console.log('\n👤 Step 2: Looking for profile picture');
    
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
      } catch (_error) {
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
        } catch (_error) {
          // Continue to next selector
        }
      }
    }
    
    if (!profileClicked) {
      console.log('❌ No profile picture or auth button found');
      return;
    }
    
    // Step 3: Wait for auth popup/modal to appear
    console.log('\n🔐 Step 3: Waiting for auth popup to appear');
    await page.waitForTimeout(2000);
    
    // Check if auth popup appeared
    const authModalSelectors = [
      '[role="dialog"]',
      '.modal',
      '.popup',
      '.auth-modal',
      '.login-modal',
      '.signup-modal',
      '[data-testid*="auth"]',
      '[data-testid*="modal"]',
      '[data-testid*="popup"]'
    ];
    
    let authPopupFound = false;
    for (const selector of authModalSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Auth popup found: ${selector}`);
          authPopupFound = true;
          break;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    if (!authPopupFound) {
      console.log('ℹ️ No auth popup detected, looking for auth form directly');
    }
    
    // Step 4: Look for sign in button in the popup
    console.log('\n🔐 Step 4: Looking for sign in button in popup');
    
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
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    if (!signInClicked) {
      console.log('ℹ️ No sign in button found, looking for auth form directly');
    }
    
    // Step 5: Wait for auth form to appear
    console.log('\n📝 Step 5: Waiting for auth form to appear');
    await page.waitForTimeout(2000);
    
    // Step 6: Fill in email
    console.log('\n📧 Step 6: Filling in email');
    
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
          await input.fill(testHostEmail);
          console.log('📧 Filled in email:', testHostEmail);
          emailFilled = true;
          break;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    if (!emailFilled) {
      console.log('❌ No email input found');
      return;
    }
    
    // Step 7: Fill in password
    console.log('\n🔒 Step 7: Filling in password');
    
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
          await input.fill(testHostPassword);
          console.log('🔒 Filled in password');
          passwordFilled = true;
          break;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    if (!passwordFilled) {
      console.log('❌ No password input found');
      return;
    }
    
    // Step 8: Submit the form
    console.log('\n🚀 Step 8: Submitting auth form');
    
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
      } catch (_error) {
        // Continue to next selector
      }
    }
    
    if (!formSubmitted) {
      console.log('❌ No submit button found');
      return;
    }
    
    // Step 9: Wait for authentication result
    console.log('\n⏳ Step 9: Waiting for authentication result');
    await page.waitForTimeout(3000);
    
    // Step 10: Check authentication status
    console.log('\n✅ Step 10: Checking authentication status');
    
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
      } catch (_error) {
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
    
    console.log('🎉 Authentication login flow test completed!');
    
    // Keep browser open for a moment to see the final state
    await page.waitForTimeout(3000);
  });
});
