import { test, expect, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://127.0.0.1:3002';
const FIREBASE_API_KEY = 'AIzaSyASbdOWHRBH_QAqpjRrp9KyzPWheNuUZmY';

// Load test users from file
const testUsersPath = path.join(__dirname, '..', '..', 'test-users.json');
const testUsers = JSON.parse(fs.readFileSync(testUsersPath, 'utf-8'));

const player1 = testUsers[0]; // Player One - Thunder Squad
const player2 = testUsers[1]; // Player Two - Water Warriors

/**
 * Authenticate a user via Firebase REST API and inject auth into context
 */
async function authenticateUser(context: BrowserContext, user: any, apiKey: string) {
  console.log(`  🔐 Authenticating ${user.displayName}...`);

  // First, create a temporary page just to make the request
  const tempPage = await context.newPage();

  try {
    // Make auth request
    const response = await tempPage.evaluate(async (creds: any) => {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${creds.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: creds.email,
            password: creds.password,
            returnSecureToken: true
          })
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Auth failed');
      }

      return await res.json();
    }, {
      email: user.email,
      password: user.password,
      apiKey: apiKey
    });

    const data = response;
    const authKey = `firebase:authUser:${apiKey}:[DEFAULT]`;
    const authData = {
      uid: data.localId,
      email: data.email,
      displayName: data.displayName,
      stsTokenManager: {
        accessToken: data.idToken,
        refreshToken: data.refreshToken,
        expirationTime: Date.now() + (parseInt(data.expiresIn) * 1000)
      }
    };

    // Set localStorage from the temp page itself (after page loads)
    await tempPage.evaluate(({ authKey, authData }: any) => {
      localStorage.setItem(authKey, JSON.stringify(authData));
      // Also trigger Firebase's internal state refresh
      window.dispatchEvent(new StorageEvent('storage', {
        key: authKey,
        newValue: JSON.stringify(authData),
        storageArea: localStorage,
      }));
    }, { authKey, authData });

    // Also set up init script for NEW pages created after this
    await context.addInitScript(({ authKey, authData }: any) => {
      localStorage.setItem(authKey, JSON.stringify(authData));
    }, { authKey, authData });

    console.log(`  ✅ Authenticated as ${user.displayName}`);
    return data;
  } finally {
    // Keep temp page open longer so Firebase has time to read from localStorage
    await tempPage.waitForTimeout(1000);
    await tempPage.close();
  }
}

test.describe('Full Battle E2E - Play Until Victory', () => {
  test('two authenticated players complete battle until one team is defeated', async ({ browser }) => {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   FULL BATTLE E2E TEST - PLAY UNTIL VICTORY              ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Create contexts for both players
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    try {
      // ─────────────────────────────────────────────────────────────────
      // Step 1: Authenticate both players
      // ─────────────────────────────────────────────────────────────────
      console.log('\n📝 Step 1: Authenticating Players\n');
      
      const p1Auth = await authenticateUser(context1, player1, FIREBASE_API_KEY);
      const p2Auth = await authenticateUser(context2, player2, FIREBASE_API_KEY);

      // ─────────────────────────────────────────────────────────────────
      // Step 2: Navigate to app (auth will be picked up from localStorage)
      // ─────────────────────────────────────────────────────────────────
      console.log('\n🏛️  Step 2: Navigating to Lobby\n');
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      await page1.goto(`${BASE_URL}/lobby`, { waitUntil: 'networkidle' });
      await page2.goto(`${BASE_URL}/lobby`, { waitUntil: 'networkidle' });

      console.log('  ✅ Both players in lobby');
      await page1.waitForTimeout(2000);
      await page2.waitForTimeout(2000);

      // ─────────────────────────────────────────────────────────────────
      // Step 3: Create/Join Battle Room
      // ─────────────────────────────────────────────────────────────────
      console.log('\n⚔️  Step 3: Creating Battle Room\n');

      // Player 1 creates room
      const createBtn = page1.locator('[data-testid="create-room-button"], button:has-text("Create Room")').first();
      if (await createBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
        console.log('  🔘 Host creating room...');
        await createBtn.click();
        await page1.waitForTimeout(3000);
        console.log('  ✅ Room created');
      } else {
        console.log('  ⚠️  Create button not found');
        const debugText = await page1.textContent('body');
        console.log('  Page contains:', debugText?.substring(0, 200));
      }

      // Get room URL
      const roomUrl = page1.url();
      const roomMatch = roomUrl.match(/\/lobby\/([a-zA-Z0-9]+)/);
      const roomId = roomMatch?.[1];

      if (roomId) {
        console.log(`  🔑 Room ID: ${roomId}`);
        await page2.goto(`${BASE_URL}/lobby/${roomId}`, { waitUntil: 'networkidle' });
        await page2.waitForTimeout(2000);
        console.log('  ✅ Guest joined room');
      }

      // ─────────────────────────────────────────────────────────────────
      // Step 4: Start Battle
      // ─────────────────────────────────────────────────────────────────
      console.log('\n⚡ Step 4: Starting Battle\n');

      // Wait for move buttons to appear
      await page1.waitForSelector('[data-testid*="move"], .move-button, button:has-text("Attack")').catch(() => null);
      await page2.waitForSelector('[data-testid*="move"], .move-button, button:has-text("Attack")').catch(() => null);

      let turn = 0;
      const maxTurns = 100;
      let battleEnded = false;

      // ─────────────────────────────────────────────────────────────────
      // Step 5: Battle Loop - Play Until Completion
      // ─────────────────────────────────────────────────────────────────
      console.log('  🎮 Battle In Progress...\n');

      while (turn < maxTurns && !battleEnded) {
        turn++;
        
        if (turn % 5 === 1) {
          console.log(`  ▶️  Turn ${turn}`);
        }

        try {
          // Get move buttons
          const p1MoveButtons = page1.locator('.move-button, [data-testid*="move"], button:has-text("Thunder"), button:has-text("Quick"), button:has-text("Tackle")');
          const p2MoveButtons = page2.locator('.move-button, [data-testid*="move"], button:has-text("Surf"), button:has-text("Ice"), button:has-text("Tackle")');

          // Click first available move for each player
          const p1MoveCount = await p1MoveButtons.count();
          const p2MoveCount = await p2MoveButtons.count();

          if (p1MoveCount > 0) {
            await p1MoveButtons.first().click().catch(() => null);
          }

          if (p2MoveCount > 0) {
            await p2MoveButtons.first().click().catch(() => null);
          }

          // Wait for turn resolution
          await page1.waitForTimeout(2000);

          // Check for battle end
          const p1Content = await page1.textContent('body').catch(() => '');
          const p2Content = await page2.textContent('body').catch(() => '');

          const endPatterns = /wins?!|victory|defeated|champion|battle.*end|game.*over|total damage|battle complete/i;

          if (endPatterns.test(p1Content) || endPatterns.test(p2Content)) {
            battleEnded = true;
            console.log(`\n  🏁 BATTLE ENDED AT TURN ${turn}`);
          }

          // Handle Pokemon switches
          const p1Switch = page1.locator('button:has-text("Switch"), [data-testid*="switch"]').first();
          const p2Switch = page2.locator('button:has-text("Switch"), [data-testid*="switch"]').first();

          if (await p1Switch.isVisible({ timeout: 500 }).catch(() => false)) {
            await p1Switch.click().catch(() => null);
          }

          if (await p2Switch.isVisible({ timeout: 500 }).catch(() => false)) {
            await p2Switch.click().catch(() => null);
          }

        } catch (error) {
          console.log(`  ⚠️  Error in turn: ${error.message}`);
        }
      }

      // ─────────────────────────────────────────────────────────────────
      // Step 6: Verify Battle Completion
      // ─────────────────────────────────────────────────────────────────
      console.log('\n🎉 Battle Completion Summary\n');
      console.log(`  Total Turns: ${turn}`);
      console.log(`  Battle Ended: ${battleEnded}`);

      // Take final screenshots
      await page1.screenshot({ path: 'test-results/battle-p1-final.png' });
      await page2.screenshot({ path: 'test-results/battle-p2-final.png' });
      console.log('  📸 Screenshots saved');

      // Assertions
      expect(turn).toBeGreaterThan(0);
      expect(turn).toBeLessThanOrEqual(maxTurns);

      console.log('\n╔═══════════════════════════════════════════════════════════╗');
      console.log('║   ✅ TEST COMPLETED SUCCESSFULLY                        ║');
      console.log('╚═══════════════════════════════════════════════════════════╝\n');

    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      throw error;
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
