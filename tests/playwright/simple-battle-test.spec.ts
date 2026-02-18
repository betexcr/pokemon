import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3002';
const HOST_EMAIL = 'test-host@pokemon-battles.test';
const HOST_PASSWORD = 'TestHost123!';
const GUEST_EMAIL = 'test-guest@pokemon-battles.test';
const GUEST_PASSWORD = 'TestGuest123!';

test('Simple battle flow test', async ({ browser }) => {
  test.setTimeout(120_000);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  try {
    console.log('Step 1: Login host');
    await hostPage.goto(`${BASE_URL}/login`);
    await hostPage.fill('input[type="email"]', HOST_EMAIL);
    await hostPage.fill('input[type="password"]', HOST_PASSWORD);
    await hostPage.click('button[type="submit"]');
    await hostPage.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
    console.log('✅ Host logged in');

    console.log('Step 2: Login guest');
    await guestPage.goto(`${BASE_URL}/login`);
    await guestPage.fill('input[type="email"]', GUEST_EMAIL);
    await guestPage.fill('input[type="password"]', GUEST_PASSWORD);
    await guestPage.click('button[type="submit"]');
    await guestPage.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
    console.log('✅ Guest logged in');

    console.log('Step 3: Create room');
    await hostPage.goto(`${BASE_URL}/lobby`);
    const createButton = hostPage.getByRole('button', { name: /create room/i });
    await createButton.waitFor({ state: 'visible', timeout: 10000 });
    await createButton.click();
    await hostPage.waitForURL(/\/lobby\/room/, { timeout: 30000 });
    console.log('✅ Room created');

    const roomId = new URL(hostPage.url()).searchParams.get('id');
    console.log(`Room ID: ${roomId}`);

    console.log('Step 4: Guest join room');
    await guestPage.goto(`${BASE_URL}/lobby/room?id=${roomId}`);
    await guestPage.waitForURL(/\/lobby\/room/, { timeout: 30000 });
    console.log('✅ Guest joined');

    console.log('Step 5: Mark ready');
    await hostPage.getByRole('button', { name: /ready/i }).click();
    await guestPage.getByRole('button', { name: /ready/i }).click();
    console.log('✅ Both ready');

    console.log('Step 6: Start battle');
    await hostPage.getByRole('button', { name: /start battle/i }).click();
    await hostPage.waitForURL(/\/battle\/runtime/, { timeout: 30000 });
    await guestPage.waitForURL(/\/battle\/runtime/, { timeout: 30000 });
    console.log('✅ Battle started');

    console.log('Step 7: Wait for battle UI');
    await hostPage.waitForSelector('[data-testid="turn-counter"]', { timeout: 30000 });
    await guestPage.waitForSelector('[data-testid="turn-counter"]', { timeout: 30000 });
    console.log('✅ Battle UI loaded');

    console.log('Step 8: Check turn counter');
    const turnText = await hostPage.getByTestId('turn-counter').textContent();
    console.log(`Turn: ${turnText}`);
    expect(turnText).toContain('Turn');

    console.log('\n✅ ALL STEPS PASSED!');

  } catch (e) {
    console.error('❌ Test failed at step:', e);
    throw e;
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});
