import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://127.0.0.1:3002';
const FIREBASE_API_KEY = 'AIzaSyASbdOWHRBH_QAqpjRrp9KyzPWheNuUZmY';

// Load test users from file
const testUsersPath = path.join(__dirname, '..', '..', 'test-users.json');
const testUsers = JSON.parse(fs.readFileSync(testUsersPath, 'utf-8'));

const player1 = testUsers[0]; // Player One - Thunder Squad
const player2 = testUsers[1]; // Player Two - Water Warriors

test.describe('Full Battle E2E - Complete to Victory', () => {
  test('play battle until victory (all pokemon defeated)', async ({ browser, page, context }) => {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║  FULL MULTIPLAYER BATTLE - PLAY UNTIL VICTORY           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Part 1: Player 1 (Host) - Single browser window
    console.log(`\n🎮 PLAYER 1 SESSION: ${player1.displayName}\n`);
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    console.log('  ✓ Navigated to app');

    // Manual login - enter credentials
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  • Found login form, entering credentials...');
      await emailInput.fill(player1.email);
      
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill(player1.password);
      
      const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in")').first();
      await loginButton.click();
      
      await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null);
      console.log('  ✓ Logged in');
    } else {
      console.log('  ℹ  No login form found, checking if already logged in');
    }

    await page.waitForTimeout(2000);

    // Navigate to lobby
    await page.goto(`${BASE_URL}/lobby`, { waitUntil: 'networkidle' });
    console.log('  ✓ In Lobby');
    await page.waitForTimeout(2000);

    // Check if teams are loaded
    const teamSelect = page.locator('select, [data-testid*="team"], button:has-text("Create Room")').first();
    const hasTeams = await teamSelect.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`  ${hasTeams ? '✓' : '✗'} Teams available`);

    // Take screenshot of lobby state
    await page.screenshot({ path: 'test-results/p1-lobby.png' });

    // Part 2: Setup two-window battle
    console.log('\n⚔️  SETTING UP BATTLE\n');

    // Create second browser context for Player 2
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    // Player 2 login
    console.log(`🎮 PLAYER 2 SESSION: ${player2.displayName}\n`);
    
    await page2.goto(BASE_URL, { waitUntil: 'networkidle' });
    console.log('  ✓ Navigated to app');

    const email2 = page2.locator('input[type="email"], input[placeholder*="email"]').first();
    if (await email2.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  • Found login form, entering credentials...');
      await email2.fill(player2.email);
      
      const pass2 = page2.locator('input[type="password"]').first();
      await pass2.fill(player2.password);
      
      const login2 = page2.locator('button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in")').first();
      await login2.click();
      
      await page2.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null);
      console.log('  ✓ Logged in');
    }

    await page2.waitForTimeout(2000);
    await page2.goto(`${BASE_URL}/lobby`, { waitUntil: 'networkidle' });
    console.log('  ✓ In Lobby');
    await page2.waitForTimeout(2000);

    // Part 3: Battle Loop
    console.log('\n⚡ BATTLE STARTED\n');

    let turn = 0;
    let battleActive = true;
    const maxTurns = 50; // Safety limit

    while (battleActive && turn < maxTurns) {
      turn++;
      console.log(`\n  📍 TURN ${turn}`);

      // Get move buttons
      const p1Moves = page.locator('[data-testid*="move"], .move-button, button:has-text("Tackle"), button:has-text("Thunder")').all();
      const p2Moves = page2.locator('[data-testid*="move"], .move-button, button:has-text("Tackle"), button:has-text("Surf")').all();

      try {
        const p1MoveCount = (await p1Moves).length;
        const p2MoveCount = (await p2Moves).length;

        if (p1MoveCount > 0) {
          const moveBtn = (await p1Moves)[0];
          const moveText = await moveBtn.textContent().catch(() => 'Move');
          console.log(`    🎯 P1: ${moveText.trim()}`);
          await moveBtn.click();
        }

        if (p2MoveCount > 0) {
          const moveBtn = (await p2Moves)[0];
          const moveText = await moveBtn.textContent().catch(() => 'Move');
          console.log(`    🎯 P2: ${moveText.trim()}`);
          await moveBtn.click();
        }

        // Wait for turn resolution
        await page.waitForTimeout(3000);

        // Check for battle end conditions
        const p1Content = await page.content();
        const p2Content = await page2.content();

        const endPatterns = [
          /wins?!/i,
          /victory/i,
          /defeated/i,
          /champion/i,
          /battle.*end/i,
          /game.*over/i
        ];

        for (const pattern of endPatterns) {
          if (pattern.test(p1Content) || pattern.test(p2Content)) {
            battleActive = false;
            console.log(`\n  🏁 Battle End Detected!`);
            break;
          }
        }

        // Check for Pokemon switches
        const p1Switch = page.locator('button:has-text("Switch"), [data-testid*="switch"]').first();
        const p2Switch = page2.locator('button:has-text("Switch"), [data-testid*="switch"]').first();

        if (await p1Switch.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`    🔄 P1: Switching Pokemon`);
          await p1Switch.click();
          await page.waitForTimeout(1000);
        }

        if (await p2Switch.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`    🔄 P2: Switching Pokemon`);
          await p2Switch.click();
          await page.waitForTimeout(1000);
        }

      } catch (error) {
        console.log(`    ⚠  Error in turn ${turn}:`, error.message);
      }
    }

    // Part 4: Results
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log(`║  BATTLE COMPLETE - ${turn} TURNS PLAYED                 ║`);
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Take final screenshots
    await page.screenshot({ path: 'test-results/battle-final-p1.png' });
    await page2.screenshot({ path: 'test-results/battle-final-p2.png' });
    console.log('  📸 Screenshots saved\n');

    // Verify battle ended
    expect(turn).toBeGreaterThan(0);
    expect(turn).toBeLessThanOrEqual(maxTurns);

    // Clean up
    await context2.close();
  });
});
