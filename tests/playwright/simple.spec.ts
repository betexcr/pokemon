import { test, expect } from '@playwright/test';

test('simple connectivity check', async ({ page }) => {
  console.log('Navigating to home...');
  await page.goto('http://127.0.0.1:3002', { waitUntil: 'domcontentloaded' });
  console.log('Navigation complete.');
  const title = await page.title();
  console.log(`Page title: "${title}"`);
  // await expect(page).toHaveTitle(/Pokemon/i);
});
