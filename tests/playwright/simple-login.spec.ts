import { test, expect } from '@playwright/test';

test('simple login test', async ({ page }) => {
  // Navigate to home
  await page.goto('http://127.0.0.1:3002/', { waitUntil: 'networkidle' });
  
  // Try to find and click profile dropdown
  const profileButton = page.locator('.user-dropdown-container').first();
  await profileButton.hover();
  console.log('✅ Hovered profile button');
  
  // Wait for dropdown
  await page.waitForTimeout(500);
  
  // Check what's visible
  const dropdown = page.locator('[data-testid="user-dropdown-menu"]');
  const isVisible = await dropdown.isVisible().catch(() => false);
  console.log(`Dropdown visible: ${isVisible}`);
  
  // Try to find sign in button
  const signInButton = page.locator('button:has-text("Sign In / Sign Up")').first();
  const signInVisible = await signInButton.isVisible().catch(() => false);
  console.log(`Sign In button visible: ${signInVisible}`);
  
  if (signInVisible) {
    await signInButton.click({ force: true });
    console.log('✅ Clicked Sign In button');
  }
  
  // Take screenshot
  await page.screenshot({ path: 'test-screenshot.png' });
  console.log('✅ Screenshot saved');
});
