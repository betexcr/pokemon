import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://127.0.0.1:3002';

const testUsersPath = path.join(__dirname, '..', '..', 'test-users.json');
const testUsers = JSON.parse(fs.readFileSync(testUsersPath, 'utf-8'));
const player1 = testUsers[0];

test('Simple auth modal test', async ({ page }) => {
  console.log('\n🔐 Testing Auth Modal...');
  
  await page.goto(`${BASE_URL}/lobby`, { waitUntil: 'domcontentloaded' });
  console.log('✓ Navigated to /lobby');

  // Screenshot before auth
  await page.screenshot({ path: 'test-results/auth-before.png', fullPage: true });
  console.log('✓ Screenshot: auth-before.png');

  // Click auth button
  const authBtn = page.locator('[data-testid="open-auth-modal"]');
  const visible = await authBtn.isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`Auth button visible: ${visible}`);
  
  if (visible) {
    await authBtn.click();
    console.log('✓ Clicked auth button');
    await page.waitForTimeout(1000);
  }

  // Check for email input
  const emailInput = page.locator('input[type="email"]');
  const emailVisible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);
  console.log(`Email input visible: ${emailVisible}`);

  if (emailVisible) {
    await page.screenshot({ path: 'test-results/auth-modal-open.png', fullPage: true });
    console.log('✓ Screenshot: auth-modal-open.png');
    
    await emailInput.fill(player1.email);
    console.log(`✓ Filled email: ${player1.email}`);

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(player1.password);
    console.log('✓ Filled password');

    // Find submit button
    const submitBtn = page.locator('button[type="submit"], button:has-text("log in"), button:has-text("sign in")').first();
    await submitBtn.click();
    console.log('✓ Clicked submit');

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => null);
    await page.waitForTimeout(3000);
  }

  // Screenshot after auth
  await page.screenshot({ path: 'test-results/auth-after.png', fullPage: true });
  console.log('✓ Screenshot: auth-after.png');

  // Check if we're authenticated
  const createRoomBtn = page.locator('[data-testid="create-room-button"], button:has-text("Create Room")');
  const isAuth = await createRoomBtn.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`\nAuthenticated: ${isAuth ? '✅' : '❌'}`);

  expect(isAuth).toBeTruthy();
});
