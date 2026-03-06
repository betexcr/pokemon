import { test, expect } from '@playwright/test';

test('diagnose page load and auth', async ({ page }) => {
  test.setTimeout(120_000);

  page.on('console', msg => console.log(`BROWSER [${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('--- Navigating to /lobby ---');
  await page.goto('http://localhost:3002/lobby', { waitUntil: 'commit', timeout: 30_000 });

  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(2_000);
    const bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 300);
    const authBtn = await page.getByTestId('open-auth-modal').isVisible().catch(() => false);
    const lobby = await page.getByTestId('create-room-button').isVisible().catch(() => false);
    console.log(`  Poll ${i}: authBtn=${authBtn}, lobby=${lobby}, body="${bodyText.replace(/\n/g, '|').slice(0, 200)}"`);
    if (authBtn || lobby) {
      console.log('  Found interactive element!');
      break;
    }
  }

  await page.screenshot({ path: 'test-results/diag-lobby.png', fullPage: true });
  console.log('Screenshot saved');
});
