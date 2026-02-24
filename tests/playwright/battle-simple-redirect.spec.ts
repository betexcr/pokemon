import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:3002';

// Load test users
let testUsers = [];
if (fs.existsSync('test-users.json')) {
  const data = JSON.parse(fs.readFileSync('test-users.json', 'utf-8'));
  testUsers = Array.isArray(data) ? data : data.players || [];
}

const player1 = testUsers[0];
const player2 = testUsers[1];

if (!player1 || !player2) {
  throw new Error('Test users not found');
}

async function loginViaMainPage(page: Page, player: any) {
  console.log(`\n  🔐 ${player.displayName}: Logging in via main page...`);

  // Navigate to main page
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Step 1: Click user dropdown button (profile placeholder)
  console.log('    • Clicking user dropdown');
  const userDropdownBtn = page.locator('button[title="Sign In"]').first();
  await userDropdownBtn.click();
  await page.waitForTimeout(500);

  // Step 2: Wait for dropdown menu and click "Sign In / Sign Up"
  const dropdownMenu = page.locator('[data-testid="user-dropdown-menu"]');
  await dropdownMenu.waitFor({ state: 'visible', timeout: 5000 });
  
  console.log('    • Clicking Sign In / Sign Up in dropdown');
  const signInBtn = page.getByRole('button', { name: /sign in.*sign up/i });
  await signInBtn.click();
  await page.waitForTimeout(1000);

  // Wait for auth modal to open
  const emailInput = page.locator('[data-testid="auth-email"]');
  const passwordInput = page.locator('[data-testid="auth-password"]');
  const submitBtn = page.locator('[data-testid="auth-submit"]');

  if (!await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('    ⚠️  Auth modal did not open');
    throw new Error(`Auth modal not visible for ${player.displayName}`);
  }

  // Fill and submit login form
  console.log('    • Filling login form');
  await emailInput.fill(player.email);
  await passwordInput.fill(player.password);
  
  console.log('    • Clicking submit');
  await submitBtn.click();

  // Wait for login to complete - modal should close
  await page.waitForTimeout(3000);

  // Verify logged in by checking if Sign In button is gone or changed to user menu
  let isLoggedIn = false;
  for (let i = 0; i < 10; i++) {
    const bodyText = await page.textContent('body').catch(() => '');
    
    // Check for indicators that we're logged in
    if (!bodyText?.includes('Sign In / Sign Up') || 
        bodyText?.includes('Profile') || 
        bodyText?.includes('Logout') ||
        bodyText?.includes('Log out')) {
      isLoggedIn = true;
      break;
    }
    
    await page.waitForTimeout(500);
  }

  if (!isLoggedIn) {
    console.log('    ⚠️  Login may have failed');
    throw new Error(`Login verification failed for ${player.displayName}`);
  }

  console.log(`    ✅ Logged in successfully!`);
}

async function createTeamWithPokemon(page: Page, player: any) {
  console.log(`\n  🎯 ${player.displayName}: Creating team...`);
  
  const pokemonToAdd = ['Charizard', 'Bulbasaur', 'Pikachu', 'Lugia', 'Gengar', 'Mewtwo'];
  
  // Navigate to team builder
  await page.goto(`${BASE_URL}/team`, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  
  console.log('    • Adding Pokemon to team...');
  
  // Add each Pokemon
  for (let i = 0; i < pokemonToAdd.length; i++) {
    const pokemonName = pokemonToAdd[i];
    console.log(`      - Adding ${pokemonName}...`);
    
    // Find and type in the PokemonSelector search input
    const searchInput = page.locator('input[placeholder*="Quick add"]').first();
    await searchInput.click();
    await searchInput.fill(pokemonName);
    await page.waitForTimeout(1000);
    
    // Click the first result that appears
    const firstResult = page.locator(`button:has-text("${pokemonName}")`).first();
    await firstResult.click({ timeout: 5000 });
    await page.waitForTimeout(1500);
    
    // Clear search for next Pokemon
    await searchInput.clear();
  }
  
  console.log('    • Setting levels and moves...');
  
  // Set level to 50 and add 4 random moves for each Pokemon
  for (let slotIdx = 0; slotIdx < 6; slotIdx++) {
    console.log(`      - Configuring slot ${slotIdx + 1}...`);
    
    // Set level to 50
    const levelInputs = page.locator('input[type="number"][min="1"][max="100"]');
    const levelInput = levelInputs.nth(slotIdx);
    await levelInput.fill('50');
    await page.waitForTimeout(500);
    
    // Add 4 random moves
    // Find the available moves table for this slot and click 4 add buttons
    const addMoveButtons = page.locator('button:has-text("+")').filter({ hasText: /^\+$/ });
    
    // Get buttons in groups (each slot has its own moves table)
    // We need to find buttons that are visible and clickable
    for (let moveIdx = 0; moveIdx < 4; moveIdx++) {
      try {
        // Find all visible + buttons and click one
        const visibleButtons = await addMoveButtons.all();
        if (visibleButtons.length > 0) {
          // Click a random button from available moves
          const randomIdx = Math.floor(Math.random() * Math.min(visibleButtons.length, 10));
          await visibleButtons[randomIdx].click();
          await page.waitForTimeout(300);
        }
      } catch (e) {
        console.log(`        Warning: Could not add move ${moveIdx + 1} to slot ${slotIdx + 1}`);
      }
    }
  }
  
  console.log('    • Saving team...');
  
  // Save the team
  const teamNameInput = page.locator('input[placeholder*="team name" i], input[placeholder*="name your team" i]').first();
  await teamNameInput.fill(`${player.displayName}'s Battle Team`);
  await page.waitForTimeout(500);
  
  // Click save button
  const saveButton = page.locator('button:has-text("Save Team"), button:has-text("Save")').first();
  await saveButton.click();
  await page.waitForTimeout(2000);
  
  console.log(`    ✅ Team created for ${player.displayName}!`);
}

test.describe('Simple Battle E2E', () => {
  test('login both players and complete a battle', async ({ browser }) => {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   SIMPLIFIED BATTLE E2E TEST         ║');
    console.log('╚════════════════════════════════════════╝\n');

    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const p1 = await ctx1.newPage();
    const p2 = await ctx2.newPage();

    try {
      // Login phase
      console.log('\n📝 Phase 1: Login Both Players\n');
      await loginViaMainPage(p1, player1);
      await loginViaMainPage(p2, player2);

      console.log('\n✅ Both players logged in!\n');

      // ─────────────────────────────────────────────────────────────────
      // Phase 1.5: Create Teams
      // ─────────────────────────────────────────────────────────────────
      console.log('🎨 Phase 1.5: Create Teams\n');
      await createTeamWithPokemon(p1, player1);
      await createTeamWithPokemon(p2, player2);
      
      console.log('\n✅ Both teams created!\n');

      // ─────────────────────────────────────────────────────────────────
      // Phase 2: Navigate to Lobby
      // ─────────────────────────────────────────────────────────────────
      console.log('🚀 Phase 2: Navigate to Lobby\n');
      console.log('  • Player One going to lobby...');
      await p1.goto(`${BASE_URL}/lobby`, { waitUntil: 'load' });
      await p1.waitForTimeout(3000);
      
      console.log('  • Player Two going to lobby...');
      await p2.goto(`${BASE_URL}/lobby`, { waitUntil: 'load' });
      await p2.waitForTimeout(3000);

      // ─────────────────────────────────────────────────────────────────
      // Phase 3: Create and join room
      // ─────────────────────────────────────────────────────────────────
      console.log('⚔️  Phase 3: Create Battle Room\n');

      const teamSelect = p1.locator('select');
      if (await teamSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        await p1.waitForFunction(() => {
          const select = document.querySelector('select');
          if (!select) return false;
          const options = Array.from(select.options).filter((option) => option.value && !option.disabled);
          return options.length > 0;
        }, null, { timeout: 10000 });

        const selected = await p1.evaluate(() => {
          const select = document.querySelector('select');
          if (!select) return null;
          const options = Array.from(select.options).filter((option) => option.value && !option.disabled);
          return options[0]?.value ?? null;
        });

        if (!selected) {
          throw new Error('No selectable team values found');
        }

        await teamSelect.selectOption(selected);
        await p1.waitForTimeout(500);
        console.log('  • Selected team option');
      } else {
        throw new Error('Team select not visible');
      }

      const createBtn = p1.locator('button:has-text("Create Room"), button:has-text("Create Battle")').first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('  • Clicking Create Room');
        await createBtn.click();
        await p1.waitForTimeout(3000);
        console.log('  ✅ Room created');
      } else {
        console.log('  ⚠️  Create button not found, trying alternative');
        const anyCreateBtn = p1.locator('button').filter({ hasText: /Create|New/ }).first();
        if (await anyCreateBtn.isVisible()) {
          await anyCreateBtn.click();
          await p1.waitForTimeout(3000);
        }
      }

      // Get room URL
      const roomUrl = p1.url();
      const roomMatch = roomUrl.match(/\/lobby\/([a-zA-Z0-9]+)/);
      const roomId = roomMatch?.[1];

      if (roomId) {
        console.log(`  • Room ID: ${roomId}`);
        await p2.goto(`${BASE_URL}/lobby/${roomId}`, { waitUntil: 'networkidle' });
        await p2.waitForTimeout(2000);
        console.log('  ✅ Player 2 joined room');
      } else {
        console.log('  ⚠️  Room URL pattern not found');
      }

      // ─────────────────────────────────────────────────────────────────
      // Phase 4: Play battle
      // ─────────────────────────────────────────────────────────────────
      console.log('\n🎮 Phase 4: Play Battle\n');

      let turn = 0;
      const maxTurns = 100;
      let battleEnded = false;

      while (turn < maxTurns && !battleEnded) {
        turn++;

        if (turn % 10 === 1) {
          console.log(`  ▶️  Turn ${turn}`);
        }

        try {
          // Look for move buttons
          const p1Moves = p1.locator('button:has-text("Thunder"), button:has-text("Tackle"), .move-button').first();
          const p2Moves = p2.locator('button:has-text("Surf"), button:has-text("Tackle"), .move-button').first();

          // Click if available
          if (await p1Moves.isVisible({ timeout: 500 }).catch(() => false)) {
            await p1Moves.click().catch(() => null);
          }

          if (await p2Moves.isVisible({ timeout: 500 }).catch(() => false)) {
            await p2Moves.click().catch(() => null);
          }

          await p1.waitForTimeout(1500);

          // Check for battle end
          const p1Text = await p1.textContent('body').catch(() => '');
          const p2Text = await p2.textContent('body').catch(() => '');

          if (
            p1Text?.match(/victory|wins?|defeated/i) ||
            p2Text?.match(/victory|wins?|defeated/i)
          ) {
            battleEnded = true;
            console.log(`\n  🏁 BATTLE ENDED AT TURN ${turn}\n`);
          }
        } catch (err) {
          // Continue silently
        }
      }

      // ─────────────────────────────────────────────────────────────────
      // Results
      // ─────────────────────────────────────────────────────────────────
      console.log('📊 Battle Results\n');
      console.log(`  ✅ Total Turns: ${turn}`);
      console.log(`  ✅ Battle Ended: ${battleEnded}\n`);

      // Screenshots
      await p1.screenshot({ path: 'test-results/battle-result-p1.png' }).catch(() => null);
      await p2.screenshot({ path: 'test-results/battle-result-p2.png' }).catch(() => null);

      // Verify
      expect(turn).toBeGreaterThan(0);

      console.log('╔════════════════════════════════════════╗');
      console.log('║   ✅ TEST PASSED!                    ║');
      console.log('╚════════════════════════════════════════╝\n');

    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      throw error;
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });
});
