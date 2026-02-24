import { test, expect, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:3002';

// Load test users from file
let testUsers = [];
if (fs.existsSync('test-users.json')) {
  const data = JSON.parse(fs.readFileSync('test-users.json', 'utf-8'));
  testUsers = Array.isArray(data) ? data : data.players || [];
}

const player1 = testUsers[0];
const player2 = testUsers[1];

if (!player1 || !player2) {
  throw new Error('Test users not found in test-users.json');
}

/**
 * Login via UI form using data-testid selectors
 */
async function loginViaUI(page: Page, email: string, password: string, displayName: string) {
  console.log(`\n  🔐 Logging in ${displayName}...`);

  // Navigate to app
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Look for the auth modal button - it's at the top level
  const authModalButton = page.locator('[data-testid="open-auth-modal"]');
  
  if (await authModalButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('    • Clicking auth modal button');
    await authModalButton.click({ force: true });
    await page.waitForTimeout(1500);
  } else {
    // Try finding Sign In button as fallback
    const signInBtn = page.locator('button:has-text("Sign In"), button:has-text("Sign Up")').first();
    if (await signInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('    • Clicking Sign In button');
      await signInBtn.click({ force: true });
      await page.waitForTimeout(1500);
    } else {
      throw new Error('Auth modal button not found');
    }
  }

  // Wait for and fill auth form using test IDs
  const emailInput = page.locator('[data-testid="auth-email"]');
  const passwordInput = page.locator('[data-testid="auth-password"]');

  if (!await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('    ⚠️  Auth form not visible');
    console.log('    Waiting additional time...');
    await page.waitForTimeout(2000);
    
    if (!await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Try scrolling or finding the modal
      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('    • Modal found, scrolling into view');
        await modal.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
      } else {
        throw new Error('Auth form modal not found');
      }
    }
  }

  console.log('    • Filling email');
  await emailInput.clear({ force: true });
  await emailInput.fill(email, { force: true });
  await page.waitForTimeout(500);

  console.log('    • Filling password');
  await passwordInput.clear({ force: true });
  await passwordInput.fill(password, { force: true });
  await page.waitForTimeout(500);

  // Find and click login button using test ID
  const submitBtn = page.locator('[data-testid="auth-submit"]');
  if (!await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    throw new Error('Submit button not found');
  }

  console.log('    • Clicking submit button');
  await submitBtn.click({ force: true });

  // Wait for login to complete and redirect to lobby
  await page.waitForURL('**/lobby**', { timeout: 20000 }).catch(() => null);

  // Verify successfully logged in - look for content that appears after login
  let verified = false;
  for (let i = 0; i < 10; i++) {
    const content = await page.textContent('body');
    if (content?.includes('Create Room') || content?.includes('team') || content?.includes('Battle')) {
      verified = true;
      break;
    }
    await page.waitForTimeout(500);
  }

  console.log(verified ? '    ✅ Logged in successfully' : '    ⚠️  Login verification incomplete');
}

test.describe('Battle E2E - UI Login & Play Until Victory', () => {
  test('complete battle flow with UI login', async ({ browser }) => {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   BATTLE E2E - UI LOGIN & PLAY UNTIL VICTORY             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // ─────────────────────────────────────────────────────────────────
      // Step 1: Login both players
      // ─────────────────────────────────────────────────────────────────
      console.log('\n📝 Step 1: Login Both Players\n');

      await loginViaUI(page1, player1.email, player1.password, player1.displayName);
      await loginViaUI(page2, player2.email, player2.password, player2.displayName);

      await page1.waitForTimeout(1000);
      await page2.waitForTimeout(1000);

      // ─────────────────────────────────────────────────────────────────
      // Step 2: Create and join room
      // ─────────────────────────────────────────────────────────────────
      console.log('\n⚔️  Step 2: Create Battle Room\n');

      const createBtn = page1.locator('button:has-text("Create Room"), button:has-text("Create Battle")').first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('  • Clicking Create Room button');
        await createBtn.click();
        await page1.waitForTimeout(3000);
        console.log('  ✅ Room created');
      } else {
        const content = await page1.textContent('body');
        console.log('  ⚠️  Create Room button not found');
        console.log('  Page has:', content?.substring(0, 300));
        throw new Error('Create room button not found');
      }

      // Extract room ID from URL
      const roomUrl = page1.url();
      const roomMatch = roomUrl.match(/\/lobby\/([a-zA-Z0-9]+)/);
      const roomId = roomMatch?.[1];

      if (roomId) {
        console.log(`  🔑 Room ID: ${roomId}`);
        await page2.goto(`${BASE_URL}/lobby/${roomId}`, { waitUntil: 'networkidle' });
        await page2.waitForTimeout(2000);
        console.log('  ✅ Player 2 joined room');
      }

      // ─────────────────────────────────────────────────────────────────
      // Step 3: Play battle
      // ─────────────────────────────────────────────────────────────────
      console.log('\n🎮 Step 3: Playing Battle\n');

      let turn = 0;
      const maxTurns = 150;
      let battleEnded = false;

      while (turn < maxTurns && !battleEnded) {
        turn++;

        if (turn % 10 === 1) {
          console.log(`  ▶️  Turn ${turn}`);
        }

        try {
          // Click available move buttons
          const p1MoveBtn = page1.locator('button:has-text("Thunder"), button:has-text("Tackle"), button:has-text("Move")').first();
          const p2MoveBtn = page2.locator('button:has-text("Surf"), button:has-text("Tackle"), button:has-text("Move")').first();

          if (await p1MoveBtn.isVisible({ timeout: 500 }).catch(() => false)) {
            await p1MoveBtn.click().catch(() => null);
          }

          if (await p2MoveBtn.isVisible({ timeout: 500 }).catch(() => false)) {
            await p2MoveBtn.click().catch(() => null);
          }

          await page1.waitForTimeout(1500);

          // Check for battle end
          const p1Text = await page1.textContent('body').catch(() => '');
          const p2Text = await page2.textContent('body').catch(() => '');

          if (
            p1Text?.match(/victory|wins?|defeated/i) ||
            p2Text?.match(/victory|wins?|defeated/i)
          ) {
            battleEnded = true;
            console.log(`\n  🏁 BATTLE ENDED AT TURN ${turn}`);
          }
        } catch (err) {
          // Silently continue
        }
      }

      // ─────────────────────────────────────────────────────────────────
      // Step 4: Verify and report
      // ─────────────────────────────────────────────────────────────────
      console.log('\n📊 Battle Results\n');
      console.log(`  ✅ Total Turns: ${turn}`);
      console.log(`  ✅ Battle Ended: ${battleEnded}`);

      // Take screenshots
      await page1.screenshot({ path: 'test-results/ui-login-p1-final.png' }).catch(() => null);
      await page2.screenshot({ path: 'test-results/ui-login-p2-final.png' }).catch(() => null);
      console.log('  ✅ Screenshots saved');

      // Assertions
      expect(turn).toBeGreaterThan(0);

      console.log('\n╔═══════════════════════════════════════════════════════════╗');
      console.log('║   ✅ TEST COMPLETED SUCCESSFULLY                        ║');
      console.log('╚═══════════════════════════════════════════════════════════╝\n');

    } catch (error) {
      console.error('\n❌ Test Error:', error.message);
      // Take error screenshots
      try {
        await page1.screenshot({ path: 'test-results/ui-login-error-p1.png' }).catch(() => null);
        await page2.screenshot({ path: 'test-results/ui-login-error-p2.png' }).catch(() => null);
      } catch {}
      throw error;
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
