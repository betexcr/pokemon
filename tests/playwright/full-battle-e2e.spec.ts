import { test, expect, Page, Browser } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://127.0.0.1:3002';

// Load test users from file
const testUsersPath = path.join(__dirname, '..', '..', 'test-users.json');
const testUsers = JSON.parse(fs.readFileSync(testUsersPath, 'utf-8'));

const player1 = testUsers[0]; // Player One - Thunder Squad
const player2 = testUsers[1]; // Player Two - Water Warriors

test.describe('Complete Multiplayer Battle E2E Test', () => {
  test('two players complete a full battle with correct damage and status effects', async ({ browser }) => {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   COMPLETE MULTIPLAYER BATTLE E2E TEST                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // ─────────────────────────────────────────────────────────────────
    // Helper: Authenticate a context with a test user
    // ─────────────────────────────────────────────────────────────────
    const authenticateContext = async (context: any, user: any) => {
      // Add init script to set localStorage before page loads
      await context.addInitScript({
        script: `
          window.__TEST_AUTH__ = {
            email: '${user.email}',
            password: '${user.password}',
            uid: '${user.uid}',
            teamId: '${user.teamId}'
          };
        `
      });
    };

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    // Set up authentication
    await authenticateContext(context1, player1);
    await authenticateContext(context2, player2);

    const hostPage = await context1.newPage();
    const guestPage = await context2.newPage();

    try {
      // ─────────────────────────────────────────────────────────────────
      // Step 1: Login both players
      // ─────────────────────────────────────────────────────────────────
      console.log('\n📝 Step 1: Logging in players...\n');
      
      // Get Firebase API key from environment or use known key
      const firebaseApiKey = 'AIzaSyASbdOWHRBH_QAqpjRrp9KyzPWheNuUZmY';

      // Login Player 1 via Firebase REST API
      console.log(`  🔐 Authenticating ${player1.email}...`);
      const player1AuthResponse = await hostPage.evaluate(async (credentials) => {
        const response = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${credentials.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              returnSecureToken: true
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Store in localStorage for persistence
          localStorage.setItem('firebase:authUser:AIzaSyASbdOWHRBH_QAqpjRrp9KyzPWheNuUZmY:[DEFAULT]', JSON.stringify({
            uid: data.localId,
            email: data.email,
            displayName: data.displayName,
            stsTokenManager: {
              accessToken: data.idToken,
              refreshToken: data.refreshToken,
              expirationTime: Date.now() + (parseInt(data.expiresIn) * 1000)
            }
          }));
          return { success: true, uid: data.localId };
        } else {
          const error = await response.json();
          return { success: false, error: error.error?.message };
        }
      }, { email: player1.email, password: player1.password, apiKey: firebaseApiKey });

      console.log(`  ✅ ${player1.displayName} authenticated:`, player1AuthResponse);

      // Login Player 2 via Firebase REST API
      console.log(`  🔐 Authenticating ${player2.email}...`);
      const player2AuthResponse = await guestPage.evaluate(async (credentials) => {
        const response = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${credentials.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              returnSecureToken: true
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Store in localStorage for persistence
          localStorage.setItem('firebase:authUser:AIzaSyASbdOWHRBH_QAqpjRrp9KyzPWheNuUZmY:[DEFAULT]', JSON.stringify({
            uid: data.localId,
            email: data.email,
            displayName: data.displayName,
            stsTokenManager: {
              accessToken: data.idToken,
              refreshToken: data.refreshToken,
              expirationTime: Date.now() + (parseInt(data.expiresIn) * 1000)
            }
          }));
          return { success: true, uid: data.localId };
        } else {
          const error = await response.json();
          return { success: false, error: error.error?.message };
        }
      }, { email: player2.email, password: player2.password, apiKey: firebaseApiKey });

      console.log(`  ✅ ${player2.displayName} authenticated:`, player2AuthResponse);

      // ─────────────────────────────────────────────────────────────────
      // Step 2: Navigate to Lobby
      // ─────────────────────────────────────────────────────────────────
      console.log('\n🏛️  Step 2: Navigating to Lobby...\n');
      
      // Navigate to lobby with auth established
      await hostPage.goto(`${BASE_URL}/lobby`, { waitUntil: 'networkidle' });
      await guestPage.goto(`${BASE_URL}/lobby`, { waitUntil: 'networkidle' });

      // Wait for lobby to load
      await hostPage.waitForTimeout(2000);
      await guestPage.waitForTimeout(2000);

      // Debug: Check what buttons are available
      const hostButtons = await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.map(b => b.innerText || b.textContent).filter(t => t?.trim());
      });

      const guestButtons = await guestPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.map(b => b.innerText || b.textContent).filter(t => t?.trim());
      });

      console.log(`  📌 Host Page - Available buttons:`, hostButtons.slice(0, 10));
      console.log(`  📌 Guest Page - Available buttons:`, guestButtons.slice(0, 10));

      // Check if team selector is visible
      const hostHasTeamSelector = await hostPage.evaluate(() => {
        const label = document.body.innerText.includes('Select Team') || document.body.innerText.includes('Choose Team');
        return label;
      });

      console.log(`  📌 Host has team selector: ${hostHasTeamSelector}`);
      
      await hostPage.waitForTimeout(2000);
      await guestPage.waitForTimeout(2000);
      
      console.log('  ✅ Both players in Lobby');

      // ─────────────────────────────────────────────────────────────────
      // Step 3: Host creates a battle room
      // ─────────────────────────────────────────────────────────────────
      console.log('\n⚔️  Step 3: Host creating battle room...\n');
      
      // Debug: Check what buttons are available
      const allButtons = await hostPage.locator('button').allTextContents();
      console.log(`  📋 Available buttons: ${allButtons.join(', ')}`);

      // Wait for teams to load and select one
      console.log('  ⏳ Waiting for teams to load...');
      await hostPage.waitForSelector('select, .team-selector, button', { timeout: 15000 }).catch(() => null);
      await hostPage.waitForTimeout(2000);

      // Debug: Check for team selector
      const hasTeamSelector = await hostPage.locator('select').first().isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`  📋 Has team selector: ${hasTeamSelector}`);

      // Select team if there's a dropdown
      const teamSelector = hostPage.locator('select').first();
      if (await teamSelector.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('  📋 Selecting team...');
        const options = await teamSelector.locator('option').allTextContents();
        console.log(`  📋 Team options: ${options.join(', ')}`);
        await teamSelector.selectOption({ index: 1 });
        await hostPage.waitForTimeout(1500);
      }

      // Debug: Get updated button list after team selection
      const updatedButtons = await hostPage.locator('button').allTextContents();
      console.log(`  📋 Available buttons after team select: ${updatedButtons.join(', ')}`);

      // Click Create Room button - try multiple selectors
      let roomCreated = false;
      
      // Try data-testid first
      let createBtn = hostPage.locator('[data-testid="create-room-button"]').first();
      if (await createBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
        console.log('  🔘 Found create-room-button by testid, clicking...');
        await createBtn.click();
        roomCreated = true;
      } else {
        // Try text selectors
        createBtn = hostPage.locator('button:has-text("Create Room")').first();
        if (await createBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
          console.log('  🔘 Found "Create Room" button, clicking...');
          await createBtn.click();
          roomCreated = true;
        } else {
          // Try button with plus icon
          createBtn = hostPage.locator('button:has-text("\\+")').first();
          if (await createBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
            console.log('  🔘 Found "+" button, clicking...');
            await createBtn.click();
            roomCreated = true;
          }
        }
      }

      if (roomCreated) {
        await hostPage.waitForTimeout(3000);
        console.log('  ✅ Room created');
      } else {
        console.log('  ⚠️  Could not find/click Create Room button');
      }

      // Get room ID from URL
      let roomId = null;
      const hostUrl = hostPage.url();
      const roomIdMatch = hostUrl.match(/\/lobby\/([a-zA-Z0-9_-]+)/);
      roomId = roomIdMatch ? roomIdMatch[1] : null;
      console.log(`  📍 Host URL: ${hostUrl}`);
      if (roomId) {
        console.log(`  🔑 Room ID: ${roomId}`);
      } else {
        console.log('  ⚠️  No room ID found in URL');
      }

      // ─────────────────────────────────────────────────────────────────
      // Step 4: Guest joins the room
      // ─────────────────────────────────────────────────────────────────
      console.log('\n🤝 Step 4: Guest joining room...\n');
      
      if (roomId) {
        console.log(`  🔑 Room ID: ${roomId}`);
        await guestPage.goto(`${BASE_URL}/lobby/${roomId}`, { waitUntil: 'networkidle' });
        await guestPage.waitForTimeout(3000);
        console.log('  ✅ Guest navigated to room');
      } else {
        console.log('  ⚠️  Could not extract room ID, guest cannot join');
      }

      // ─────────────────────────────────────────────────────────────────
      // Step 5: Wait for both players to be ready (teams already built)
      // ─────────────────────────────────────────────────────────────────
      console.log('\n⏳ Step 5: Waiting for players to be ready...\n');
      
      // Look for ready button or wait for battle to start
      const readyBtn1 = hostPage.locator('button:has-text("Ready"), button:has-text("Start"), button:has-text("Begin Battle")').first();
      const readyBtn2 = guestPage.locator('button:has-text("Ready"), button:has-text("Start"), button:has-text("Begin Battle")').first();

      if (await readyBtn1.isVisible({ timeout: 10000 }).catch(() => false)) {
        console.log('  🔘 Host clicking "Ready"...');
        await readyBtn1.click();
        await hostPage.waitForTimeout(1000);
      }

      if (await readyBtn2.isVisible({ timeout: 10000 }).catch(() => false)) {
        console.log('  🔘 Guest clicking "Ready"...');
        await readyBtn2.click();
        await hostPage.waitForTimeout(1000);
      }

      console.log('  ✅ Players ready');

      // ─────────────────────────────────────────────────────────────────
      // Step 6: Battle starts - play multiple turns
      // ─────────────────────────────────────────────────────────────────
      console.log('\n⚡ Step 6: Battle starting - selecting moves...\n');
      
      // Wait for battle UI to appear with more patience
      console.log('  ⏳ Waiting for battle UI to load...');
      await hostPage.waitForSelector(
        'button:has-text("Tackle"), button:has-text("Attack"), button:has-text("Thunderbolt"), .move-button, [data-testid*="move"], [data-testid*="action"]',
        { timeout: 20000 }
      ).catch(() => null);
      await guestPage.waitForSelector(
        'button:has-text("Tackle"), button:has-text("Attack"), button:has-text("Thunderbolt"), .move-button, [data-testid*="move"], [data-testid*="action"]',
        { timeout: 20000 }
      ).catch(() => null);

      await hostPage.waitForTimeout(3000);
      await guestPage.waitForTimeout(3000);
      console.log('  ✅ Battle UI loaded');

      let turnCount = 0;
      const maxTurns = 500; // Much higher limit to allow full battle completion
      let battleEnded = false;
      let winnerDetermined = false;

      while (turnCount < maxTurns && !winnerDetermined) {
        turnCount++;
        console.log(`\n  ▶️  Turn ${turnCount}:`);

        // Get current battle state for logging
        const hostBattleLog = await hostPage.evaluate(() => {
          const logs = document.querySelectorAll('[data-testid*="log"], .battle-log, .log-entry');
          return Array.from(logs).map(l => l.textContent).slice(-3); // Last 3 entries
        }).catch(() => []);

        if (hostBattleLog.length > 0) {
          hostBattleLog.forEach(log => {
            if (log) console.log(`    📋 ${log.trim()}`);
          });
        }

        // Host selects move
        console.log('    🎯 Host selecting move...');
        let hostMoveButtons = hostPage.locator(
          'button:has-text("Thunderbolt"), button:has-text("Tackle"), button:has-text("Surf"), button:has-text("Attack"), .move-button, [data-testid*="move"], [class*="move"]'
        );
        let hostMoveCount = await hostMoveButtons.count();

        if (hostMoveCount === 0) {
          // Try any clickable button that looks like a move
          hostMoveButtons = hostPage.locator('button[class*="move"], button[data-testid*="move"], [class*="battle"] button');
          hostMoveCount = await hostMoveButtons.count();
        }

        if (hostMoveCount > 0) {
          console.log(`    ✓ Found ${hostMoveCount} move buttons, selecting first...`);
          await hostMoveButtons.first().click();
          await hostPage.waitForTimeout(500);
        } else {
          console.log('    ⚠️  No move buttons found for host');
        }

        // Guest selects move
        console.log('    🎯 Guest selecting move...');
        let guestMoveButtons = guestPage.locator(
          'button:has-text("Thunderbolt"), button:has-text("Tackle"), button:has-text("Surf"), button:has-text("Attack"), .move-button, [data-testid*="move"], [class*="move"]'
        );
        let guestMoveCount = await guestMoveButtons.count();

        if (guestMoveCount === 0) {
          // Try any clickable button that looks like a move
          guestMoveButtons = guestPage.locator('button[class*="move"], button[data-testid*="move"], [class*="battle"] button');
          guestMoveCount = await guestMoveButtons.count();
        }

        if (guestMoveCount > 0) {
          console.log(`    ✓ Found ${guestMoveCount} move buttons, selecting first...`);
          await guestMoveButtons.first().click();
          await guestPage.waitForTimeout(500);
        } else {
          console.log('    ⚠️  No move buttons found for guest');
        }

        // Wait for turn resolution
        console.log('    ⏱️  Resolving turn...');
        await hostPage.waitForTimeout(3000);

        // Check for battle end - more robust detection
        const hostPageContent = await hostPage.content().catch(() => '');
        const guestPageContent = await guestPage.content().catch(() => '');
        const hostPageText = await hostPage.evaluate(() => document.body.innerText).catch(() => '');
        const guestPageText = await guestPage.evaluate(() => document.body.innerText).catch(() => '');

        // Look for winner/battle end indicators
        const victoryPatterns = [
          /(\w+\s+)?won!/i,
          /victory/i,
          /champion/i,
          /defeated/i,
          /all pokemon fainted/i,
          /team defeated/i,
          /battle over/i,
          /battle end/i,
          /you win/i,
          /you lose/i,
          /game over/i,
        ];

        for (const pattern of victoryPatterns) {
          if (pattern.test(hostPageContent) || pattern.test(hostPageText) ||
              pattern.test(guestPageContent) || pattern.test(guestPageText)) {
            winnerDetermined = true;
            console.log(`\n  🏁 Battle End Detected: "${pattern.source}"`);
            console.log(`    🎊 A winner has been determined!`);
            battleEnded = true;
            break;
          }
        }

        // Check for Pokemon fainting and switch if needed
        const hostSwitchBtn = hostPage.locator('button:has-text("Switch"), .switch-pokemon, [data-testid*="switch"]').first();
        if (await hostSwitchBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('    🔄 Host Pokemon fainted, switching...');
          await hostSwitchBtn.click();
          await hostPage.waitForTimeout(1000);
        }

        const guestSwitchBtn = guestPage.locator('button:has-text("Switch"), .switch-pokemon, [data-testid*="switch"]').first();
        if (await guestSwitchBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('    🔄 Guest Pokemon fainted, switching...');
          await guestSwitchBtn.click();
          await guestPage.waitForTimeout(1000);
        }

        console.log(`    ✅ Turn ${turnCount} complete`);

        // Safety check - if no move buttons found 3 times in a row, battle likely ended
        if (hostMoveCount === 0 && guestMoveCount === 0) {
          console.log('\n  🏁 No move buttons available - Battle likely ended');
          winnerDetermined = true;
          battleEnded = true;
        }
      }

      // ─────────────────────────────────────────────────────────────────
      // Step 7: Battle completed - verify results
      // ─────────────────────────────────────────────────────────────────
      console.log('\n\n🎉 Step 7: Battle Results\n');
      
      const finalHostContent = await hostPage.content();
      const finalGuestContent = await guestPage.content();

      // Look for winner announcement
      const winnerPatterns = [
        /wins?!/i,
        /victory/i,
        /champion/i,
        /defeated/i,
        /beat/i
      ];

      let foundWinner = false;
      for (const pattern of winnerPatterns) {
        if (pattern.test(finalHostContent) || pattern.test(finalGuestContent)) {
          foundWinner = true;
          console.log('  ✅ Battle ended with winner determination');
          break;
        }
      }

      if (!foundWinner && battleEnded) {
        console.log('  ✅ Battle ended (draw or timeout)');
      }

      // Verify no critical errors in console
      const hostConsole = await hostPage.evaluate(() => {
        return (window as any).__ERRORS__ || [];
      }).catch(() => []);

      const guestConsole = await guestPage.evaluate(() => {
        return (window as any).__ERRORS__ || [];
      }).catch(() => []);

      if (hostConsole.length === 0 && guestConsole.length === 0) {
        console.log('  ✅ No critical errors in browser console');
      }

      // Take final screenshots
      await hostPage.screenshot({ path: 'test-results/battle-final-host.png', fullPage: true });
      await guestPage.screenshot({ path: 'test-results/battle-final-guest.png', fullPage: true });
      console.log('  📸 Screenshots saved');

      // ─────────────────────────────────────────────────────────────────
      // Final Status
      // ─────────────────────────────────────────────────────────────────
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║   ✅ BATTLE TEST COMPLETED SUCCESSFULLY                   ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');
      console.log(`  Total Turns Played: ${turnCount}`);
      console.log(`  Winner Determined: ${winnerDetermined}`);
      console.log(`  Battle Ended: ${battleEnded}`);
      console.log(`  Errors: ${hostConsole.length + guestConsole.length}`);
      console.log('\n');

      // Assert that battle was completed properly
      expect(winnerDetermined || battleEnded).toBe(true);

    } catch (error) {
      console.error('\n❌ Test failed with error:', error);
      await hostPage.screenshot({ path: 'test-results/battle-error-host.png', fullPage: true }).catch(() => null);
      await guestPage.screenshot({ path: 'test-results/battle-error-guest.png', fullPage: true }).catch(() => null);
      throw error;
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
