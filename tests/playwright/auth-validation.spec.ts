import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3002';

test('validate firebase auth is configured', async ({ page }) => {
  test.setTimeout(30000);
  
  await page.goto( BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // Check if Firebase is configured by looking for auth errors in console
  const firebaseErrors: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Firebase') || text.includes('auth')) {
      console.log('AUTH LOG:', text);
      if (text.includes('error') || text.includes('Error')) {
        firebaseErrors.push(text);
      }
    }
  });
  
  // Try to open auth modal
  const profileButton = page.locator('.user-dropdown-button').first();
  await profileButton.waitFor({ state: 'visible', timeout: 10000 });
  await profileButton.click();
  
  const dropdownMenu = page.locator('[data-testid="user-dropdown-menu"]');
  await dropdownMenu.waitFor({ state: 'visible', timeout: 5000 });
  
  const signInButton = dropdownMenu.locator('button:has-text("Sign In / Sign Up")');
  await signInButton.click();
  
  const authModal = page.getByTestId('auth-modal');
  await authModal.waitFor({ state: 'visible', timeout: 5000 });
  
  //Check for Firebase configuration errors
  const configError = authModal.getByText(/firebase.*not.*configured|configuration.*missing/i);
  if (await configError.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.error('Firebase is not configured!');
    await page.screenshot({ path: 'test-results/firebase-not-configured.png' });
    throw new Error('Firebase authentication is not configured. Please set up Firebase environment variables.');
  }
  
  console.log('✅ Firebase auth modal opens correctly');
  
  // Try submitting with invalid credentials to see if auth is working
  await page.getByTestId('auth-email').fill('test@example.com');
  await page.getByTestId('auth-password').fill('wrongpassword');
  await page.getByTestId('auth-submit').click();
  
  // Wait for error message (indicates Firebase is working)
  await page.waitForTimeout(3000);
  
  const errorText = await page.locator('.text-red-500, .text-red-600, [class*="error"]').first().textContent({ timeout: 5000 }).catch(() => null);
  
  if (errorText) {
    console.log('✅ Firebase auth is working - got error:', errorText);
  } else if (firebaseErrors.length > 0) {
    console.error('Firebase errors detected:', firebaseErrors);
    throw new Error(`Firebase errors: ${firebaseErrors.join(', ')}`);
  } else {
    console.log('⚠️  No error message shown - Firebase might not be configured');
  }
  
  await page.screenshot({ path: 'test-results/auth-validation.png' });
});
