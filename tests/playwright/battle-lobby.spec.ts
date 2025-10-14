import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

const HOST_EMAIL = process.env.TEST_HOST_EMAIL ?? 'test-host@pokemon-battles.test';
const HOST_PASSWORD = process.env.TEST_HOST_PASSWORD ?? 'TestHost123!';
const GUEST_EMAIL = process.env.TEST_GUEST_EMAIL ?? 'test-guest@pokemon-battles.test';
const GUEST_PASSWORD = process.env.TEST_GUEST_PASSWORD ?? 'TestGuest123!';

async function loginThroughProfile(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

  const profileButton = page.locator('.user-dropdown-container button').first();
  await profileButton.waitFor({ state: 'visible' });
  await profileButton.click();

  const authModal = page.getByTestId('auth-modal');
  if (!(await authModal.isVisible({ timeout: 5000 }).catch(() => false))) {
    const signInButton = page.getByRole('button', { name: /sign in/i, exact: false }).first();
    await signInButton.click();
    await expect(authModal).toBeVisible();
  }

  const authError = authModal.getByText(/authentication service is currently unavailable/i);
  if (await authError.isVisible().catch(() => false)) {
    throw new Error('Authentication service unavailable; cannot continue login flow.');
  }

  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);

  await Promise.all([
    authModal.waitFor({ state: 'detached' }),
    page.getByTestId('auth-submit').click()
  ]);
}

async function login(page: Page, email: string, password: string) {
  await loginThroughProfile(page, email, password);
  await page.goto(`${BASE_URL}/lobby`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('button', { name: /create room/i })).toBeVisible({ timeout: 20000 });
}

test('host creates battle room and guest joins', async ({ browser }) => {
  test.setTimeout(120_000);
  test.skip(process.env.CI, 'E2E test is experimental and requires local environment');

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  try {
    // Host login
    await login(hostPage, HOST_EMAIL, HOST_PASSWORD);

    // Navigate to lobby and create room
    await hostPage.goto(`${BASE_URL}/lobby`, { waitUntil: 'networkidle' });
    await hostPage.getByRole('button', { name: /create room/i }).click();

    // Wait for room card
    const roomCard = hostPage.locator('[data-testid="battle-room-card"]').first();
    await expect(roomCard).toBeVisible();

    // Capture room link/id
    const roomLink = await roomCard.getByRole('button', { name: /join battle/i }).getAttribute('data-room-id');
    let roomId = roomLink;
    if (!roomId) {
      const linkHref = await roomCard.locator('a[href*="/lobby/"]').first().getAttribute('href');
      if (linkHref) {
        roomId = linkHref.split('/').pop() ?? null;
      }
    }
    if (!roomId) {
      throw new Error('Failed to determine room ID after creation');
    }

    // Guest login and join room
    await login(guestPage, GUEST_EMAIL, GUEST_PASSWORD);
    await guestPage.goto(`${BASE_URL}/lobby/${roomId}`, { waitUntil: 'networkidle' });
    await expect(guestPage.getByText(/battle room/i)).toBeVisible();

    // Guest marks ready (requires team) - for now just ensure page loads
    await expect(guestPage.getByRole('button', { name: /leave room/i })).toBeVisible();

    // Host sees guest presence
    await expect(roomCard.locator('text=ready').first()).toBeVisible({ timeout: 60_000 });
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});

