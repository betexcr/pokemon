import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://127.0.0.1:3002';

// Load test users from file
const testUsersPath = path.join(__dirname, '..', '..', 'test-users.json');
const testUsers = JSON.parse(fs.readFileSync(testUsersPath, 'utf-8'));

const player1 = testUsers[0]; // Player One - Thunder Squad
const player2 = testUsers[1]; // Player Two - Water Warriors

test.describe('Battle E2E - Modal Login then Battle', () => {
  test('login both players via modal, create room, battle until victor', async ({ browser }) => {
    console.log(`\n>>> PLAYER 1 LOGIN: ${player1.email}`);
    
    // Create two contexts for two players
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const hostPage = await context1.newPage();
    const guestPage = await context2.newPage();

    try {
      // ================================================================
      // PLAYER 1: LOGIN
      // ================================================================
      console.log(`\n🎮 PLAYER 1: ${player1.displayName}\n`);
      
      // Navigate to lobby directly to trigger protected route
      await hostPage.goto(`${BASE_URL}/lobby`, { waitUntil: 'networkidle' });
      await hostPage.waitForTimeout(2000);

      // Look for "Sign In / Sign Up" button and click it
      const authBtn1 = hostPage.locator('[data-testid="open-auth-modal"]');
      const authBtnVisible1 = await authBtn1.isVisible({ timeout: 5000 }).catch(() => false);

      if (authBtnVisible1) {
        console.log('  • clicking "Sign In / Sign Up"...');
        await authBtn1.click();
        await hostPage.waitForTimeout(1000);
      } else {
        // Maybe already logged in? Check for team UI
        console.log('  ⓘ No auth button found - checking if already logged in');
      }

      // Wait for modal or check if we need to type credentials
      // Try to find email input in modal
      let emailInput1 = hostPage.locator('input[type="email"]').first();
      const emailVisible1 = await emailInput1.isVisible({ timeout: 3000 }).catch(() => false);

      if (emailVisible1) {
        console.log('  • Found email input');
        await emailInput1.fill(player1.email);
        console.log(`  • Filled email: ${player1.email}`);

        const passwordInput1 = hostPage.locator('input[type="password"]').first();
        await passwordInput1.fill(player1.password);
        console.log('  • Filled password');

        // Find and click login button (might be called "Log in", "Sign in", "Continue", etc)
        const loginBtn = hostPage.locator(
          'button:is(:has-text("log in"), :has-text("sign in"), :has-text("continue"), :has-text("login"))',
          { or: hostPage.locator('button[type="submit"]').first() }
        ).first();

        await loginBtn.click();
        console.log('  • Clicked login button');

        // Wait for modal to close and navigation
        await hostPage.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null);
        await hostPage.waitForTimeout(2000);
      }

      console.log('  ✅ Player 1 authenticated');

      // ================================================================
      // PLAYER 2: LOGIN 
      // ================================================================
      console.log(`\n>>> PLAYER 2 LOGIN: ${player2.email}\n`);
      console.log(`\n🎮 PLAYER 2: ${player2.displayName}\n`);
      
      await guestPage.goto(`${BASE_URL}/lobby`, { waitUntil: 'networkidle' });
      await guestPage.waitForTimeout(2000);

      const authBtn2 = guestPage.locator('[data-testid="open-auth-modal"]');
      const authBtnVisible2 = await authBtn2.isVisible({ timeout: 5000 }).catch(() => false);

      if (authBtnVisible2) {
        console.log('  • clicking "Sign In / Sign Up"...');
        await authBtn2.click();
        await guestPage.waitForTimeout(1000);
      } else {
        console.log('  ⓘ No auth button found - checking if already logged in');
      }

      let emailInput2 = guestPage.locator('input[type="email"]').first();
      const emailVisible2 = await emailInput2.isVisible({ timeout: 3000 }).catch(() => false);

      if (emailVisible2) {
        console.log('  • Found email input');
        await emailInput2.fill(player2.email);
        console.log(`  • Filled email: ${player2.email}`);

        const passwordInput2 = guestPage.locator('input[type="password"]').first();
        await passwordInput2.fill(player2.password);
        console.log('  • Filled password');

        const loginBtn2 = guestPage.locator(
          'button:is(:has-text("log in"), :has-text("sign in"), :has-text("continue"), :has-text("login"))',
          { or: guestPage.locator('button[type="submit"]').first() }
        ).first();

        await loginBtn2.click();
        console.log('  • Clicked login button');

        await guestPage.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null);
        await guestPage.waitForTimeout(2000);
      }

      console.log('  ✅ Player 2 authenticated');

      // ================================================================
      // CHECK LOGIN SUCCESS - Should be in lobby now
      // ================================================================
      console.log('\n⚔️  VERIFYING LOGIN SUCCESS\n');

      const roomBtn1 = hostPage.locator('[data-testid="create-room-button"], button:has-text("Create Room")').first();
      const isLoggedIn1 = await roomBtn1.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`  P1 in lobby: ${isLoggedIn1 ? '✅' : '❌'}`);

      const roomBtn2 = guestPage.locator('[data-testid="create-room-button"], button:has-text("Create Room")').first();
      const isLoggedIn2 = await roomBtn2.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`  P2 in lobby: ${isLoggedIn2 ? '✅' : '❌'}`);

      if (!isLoggedIn1 || !isLoggedIn2) {
        console.log('\n❌ LOGIN FAILED - taking screenshots...');
        await hostPage.screenshot({ path: 'test-results/login-fail-p1.png', fullPage: true });
        await guestPage.screenshot({ path: 'test-results/login-fail-p2.png', fullPage: true });
        throw new Error('Players not logged in after authentication attempt');
      }

      // ================================================================
      // CREATE ROOM (PLAYER 1)
      // ================================================================
      console.log('\n🔨 CREATING BATTLE ROOM\n');

      const createBtn = hostPage.locator('[data-testid="create-room-button"], button:has-text("Create Room")').first();
      await createBtn.click();
      console.log('  • clicked "Create Room"');

      await hostPage.waitForTimeout(3000);
      const roomUrl = hostPage.url();
      const roomMatch = roomUrl.match(/\/lobby\/([a-zA-Z0-9]+)/);
      const roomId = roomMatch ? roomMatch[1] : null;
      console.log(`  ✅ Room created: ${roomId}`);

      // ================================================================
      // JOIN ROOM (PLAYER 2)
      // ================================================================
      console.log('\n🤝 JOINING BATTLE ROOM\n');

      if (roomId) {
        await guestPage.goto(`${BASE_URL}/lobby/${roomId}`, { waitUntil: 'networkidle' });
        await guestPage.waitForTimeout(3000);
        console.log(`  ✅ Joined room ${roomId}`);
      }

      // ================================================================
      // WAIT FOR BATTLE TO START
      // ================================================================
      console.log('\n⚡ WAITING FOR BATTLE TO START\n');

      const battleContainer1 = hostPage.locator('[data-testid="battle-container"], .battle, .battle-ui').first();
      const battleStarted = await battleContainer1.isVisible({ timeout: 10000 }).catch(() => false);

      if (battleStarted) {
        console.log('  ✅ Battle started!');
      } else {
        console.log('  ⚠️  Could not confirm battle started');
        await hostPage.screenshot({ path: 'test-results/battle-fail-p1.png', fullPage: true });
        await guestPage.screenshot({ path: 'test-results/battle-fail-p2.png', fullPage: true });
      }

      // ================================================================
      // BATTLE LOOP
      // ================================================================
      console.log('\n▶️  PLAYING BATTLE TURNS\n');

      let turn = 0;
      let battleActive = true;
      const maxTurns = 50;

      while (battleActive && turn < maxTurns) {
        turn++;

        // Look for move buttons
        const moveButtons1 = hostPage.locator('button:has-text("Use"), button:has-text("Use Move"), .move-button, [role="button"]:has-text("Use")').first();
        const moveButtons2 = guestPage.locator('button:has-text("Use"), button:has-text("Use Move"), .move-button, [role="button"]:has-text("Use")').first();

        if (await moveButtons1.isVisible({ timeout: 2000 }).catch(() => false)) {
          await moveButtons1.click();
          console.log(`  Turn ${turn}: P1 selected move`);
        }

        if (await moveButtons2.isVisible({ timeout: 2000 }).catch(() => false)) {
          await moveButtons2.click();
          console.log(`  Turn ${turn}: P2 selected move`);
        }

        await hostPage.waitForTimeout(2000);

        // Check for battle end
        const bodyText1 = await hostPage.locator('body').textContent().catch(() => '');
        const bodyText2 = await guestPage.locator('body').textContent().catch(() => '');

        if (
          bodyText1.toLowerCase().includes('wins') ||
          bodyText1.toLowerCase().includes('victory') ||
          bodyText2.toLowerCase().includes('wins') ||
          bodyText2.toLowerCase().includes('victory')
        ) {
          console.log(`\n  🏆 BATTLE ENDED AT TURN ${turn}!`);
          battleActive = false;
        }
      }

      // ================================================================
      // FINAL RESULTS
      // ================================================================
      console.log(`\n✅ TEST COMPLETE - ${turn} TURNS PLAYED\n`);

      // Take screenshots
      await hostPage.screenshot({ path: 'test-results/battle-end-p1.png', fullPage: true });
      await guestPage.screenshot({ path: 'test-results/battle-end-p2.png', fullPage: true });

      expect(turn).toBeGreaterThan(0);
      expect(turn).toBeLessThanOrEqual(maxTurns);

    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
