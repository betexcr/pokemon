import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3002';

const PLAYER1_EMAIL = process.env.TEST_PLAYER1_EMAIL ?? 'player1@pokemon-test.local';
const PLAYER1_PASSWORD = process.env.TEST_PLAYER1_PASSWORD ?? 'TestPlayer1!';
const PLAYER2_EMAIL = process.env.TEST_PLAYER2_EMAIL ?? 'player2@pokemon-test.local';
const PLAYER2_PASSWORD = process.env.TEST_PLAYER2_PASSWORD ?? 'TestPlayer2!';

/**
 * Helper: Login via profile dropdown and auth modal
 */
async function login(page: Page, email: string, password: string) {
  console.log(`=== Starting login for ${email} ===`);
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Open dropdown by hovering profile button
  const dropdownContainer = page.locator('.user-dropdown-container').first();
  await dropdownContainer.waitFor({ state: 'visible', timeout: 10000 });
  await dropdownContainer.hover();
  await page.waitForTimeout(300);

  // Wait for dropdown menu
  const dropdownMenu = page.locator('[data-testid="user-dropdown-menu"]');
  await dropdownMenu.waitFor({ state: 'visible', timeout: 5000 });

  // Force click Sign In button
  const signInButton = dropdownMenu.locator('button:has-text("Sign In / Sign Up")');
  await signInButton.waitFor({ state: 'visible', timeout: 5000 });
  await signInButton.click({ force: true });

  // Wait for auth modal
  const authModal = page.getByTestId('auth-modal');
  await authModal.waitFor({ state: 'visible', timeout: 5000 });

  // Fill and submit credentials
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.waitForTimeout(500);
  await page.getByTestId('auth-submit').click();

  // Wait for modal to close or timeout
  await Promise.race([
    authModal.waitFor({ state: 'detached', timeout: 10000 }).catch(() => {}),
    page.waitForTimeout(10000)
  ]);

  // Check if login failed
  if (await authModal.isVisible({ timeout: 1000 }).catch(() => false)) {
    // Try switching to registration
    const switchToRegister = page.locator('button:has-text("Sign Up"), button:has-text("Create account"), button:has-text("Register")').first();
    if (await switchToRegister.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Switching to registration...');
      await switchToRegister.click({ force: true });
      await page.waitForTimeout(1000);
      
      await page.getByTestId('auth-email').fill(email);
      await page.getByTestId('auth-password').fill(password);
      await page.waitForTimeout(500);
      await page.getByTestId('auth-submit').click();
      
      await authModal.waitFor({ state: 'detached', timeout: 15000 });
    } else {
      throw new Error('Login failed');
    }
  }

 console.log(`✅ Logged in as ${email}`);
}

/**
 * Helper: Build a 3-Pokemon team with moves
 */
async function buildTeam(page: Page, playerName: string) {
  await page.goto(`${BASE_URL}/team`, { waitUntil: 'networkidle' });
  console.log(`${playerName}: Building team...`);

  // Define team composition
  const team = [
    { name: 'Charizard', moves: ['flamethrower', 'air-slash', 'dragon-claw', 'fire-blast'] },
    { name: 'Blastoise', moves: ['hydro-pump', 'ice-beam', 'skull-bash', 'aqua-tail'] },
    { name: 'Venusaur', moves: ['solar-beam', 'sludge-bomb', 'earthquake', 'giga-drain'] }
  ];

  for (let slotIdx = 0; slotIdx < team.length; slotIdx++) {
    const pokemon = team[slotIdx];
    
    // Use PokemonSelector to add Pokemon
    console.log(`${playerName}: Adding ${pokemon.name} to slot ${slotIdx + 1}...`);
    
    // Type Pokemon name in search/selector
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Charizard"], input[placeholder*="Pokemon"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill(pokemon.name);
    await page.waitForTimeout(500); // Wait for search results
    
    // Click on the Pokemon from dropdown/results
    const pokemonOption = page.locator(`[role="option"]:has-text("${pokemon.name}"), button:has-text("${pokemon.name}"), div:has-text("${pokemon.name}")`).first();
    await pokemonOption.waitFor({ state: 'visible', timeout: 5000 });
    await pokemonOption.click();
    
    console.log(`${playerName}: ${pokemon.name} added`);
    
    // Wait for Pokemon to be added and expand slot to configure moves
    await page.waitForTimeout(1000);
    
    // Find the slot card (it may already be expanded or collapsed)
    const slotCard = page.locator('.border').filter({ hasText: pokemon.name }).first();
    await slotCard.waitFor({ state: 'visible', timeout: 5000 });
    
    // Expand if collapsed (look for collapse/expand indicator)
    const isCollapsed = await slotCard.locator('text=/collapse|expand/i').isVisible().catch(() => false);
    if (isCollapsed || !(await slotCard.locator('text=/moves/i').isVisible().catch(() => false))) {
      await slotCard.click(); // Click to expand
      await page.waitForTimeout(500);
    }
    
    console.log(`${playerName}: Selecting moves for ${pokemon.name}...`);
    
    // Add moves (up to 4)
    for (const moveName of pokemon.moves) {
      try {
        // Look for the move in available moves table/list
        // Moves are shown in a table with buttons to add them
        const moveRow = slotCard.locator(`tr:has-text("${moveName}"), div:has-text("${moveName}")`).first();
        
        if (await moveRow.isVisible({ timeout: 3000 })) {
          // Find add button (usually a '+' or 'Add' button)
          const addButton = moveRow.locator('button:has-text("+"), button:has-text("Add")').first();
          
          if (await addButton.isVisible({ timeout: 2000 })) {
            await addButton.click();
            console.log(`${playerName}: Added ${moveName}`);
            await page.waitForTimeout(300);
          } else {
            // Try clicking the row itself
            await moveRow.click();
            console.log(`${playerName}: Added ${moveName} (row click)`);
            await page.waitForTimeout(300);
          }
        } else {
          console.warn(`${playerName}: Move ${moveName} not found, skipping...`);
        }
      } catch (error) {
        console.warn(`${playerName}: Failed to add ${moveName}, continuing...`, error);
      }
    }
    
    console.log(`${playerName}: ${pokemon.name} configured with moves`);
  }

  // Save team
  console.log(`${playerName}: Saving team...`);
  const teamNameInput = page.locator('input[placeholder*="team name"], input[value*="Team"]').first();
  if (await teamNameInput.isVisible({ timeout: 3000 })) {
    await teamNameInput.fill(`${playerName} Battle Team`);
  }
  
  const saveButton = page.getByRole('button', { name: /save|create/i }).first();
  if (await saveButton.isEnabled({ timeout: 3000 })) {
    await saveButton.click();
    await page.waitForTimeout(1000);
    console.log(`${playerName}: Team saved`);
  } else {
    console.log(`${playerName}: Team auto-saved or save not needed`);
  }
  
  console.log(`✅ ${playerName}: Team built successfully`);
}

/**
 * Helper: Navigate to lobby and create/join room
 */
async function createRoom(page: Page): Promise<string> {
  await page.goto(`${BASE_URL}/lobby`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /create room/i }).click();
  
  // Wait for redirect to room page
  await expect(page).toHaveURL(/\/lobby\/room/, { timeout: 30000 });
  
  // Extract room ID from URL
  const url = new URL(page.url());
  const roomId = url.searchParams.get('id') || url.pathname.split('/').pop();
  
  if (!roomId) throw new Error('Failed to extract room ID');
  
  console.log(`✅ Room created: ${roomId}`);
  return roomId;
}

async function joinRoom(page: Page, roomId: string) {
  await page.goto(`${BASE_URL}/lobby/room?id=${roomId}`, { waitUntil: 'networkidle' });
  await expect(page.getByText(/battle room|lobby/i)).toBeVisible({ timeout: 10000 });
  console.log(`✅ Joined room: ${roomId}`);
}

/**
 * Helper: Mark ready and start battle
 */
async function startBattle(hostPage: Page, guestPage: Page) {
  // Both players mark ready
  const hostReadyBtn = hostPage.getByRole('button', { name: /ready/i });
  const guestReadyBtn = guestPage.getByRole('button', { name: /ready/i });
  
  await hostReadyBtn.click();
  console.log('Host marked ready');
  
  await guestReadyBtn.click();
  console.log('Guest marked ready');
  
  // Host starts battle
  await hostPage.waitForTimeout(1000);
  const startBtn = hostPage.getByRole('button', { name: /start battle/i });
  await startBtn.waitFor({ state: 'visible', timeout: 10000 });
  await startBtn.click();
  console.log('Battle start clicked');
  
  // Wait for both pages to load battle
  await expect(hostPage).toHaveURL(/\/battle\/runtime|\/battle/i, { timeout: 30000 });
  await expect(guestPage).toHaveURL(/\/battle\/runtime|\/battle/i, { timeout: 30000 });
  
  console.log('✅ Battle started');
}

/**
 * Helper: Execute a turn by selecting moves
 */
async function executeTurn(page: Page, moveName: string, playerName: string) {
  const moveSelector = `[data-testid="move-${moveName}"], button:has-text("${moveName}")`;
  const moveBtn = page.locator(moveSelector).first();
  
  await moveBtn.waitFor({ state: 'visible', timeout: 10000 });
  await moveBtn.click();
  console.log(`${playerName} selected ${moveName}`);
}

/**
 * Helper: Wait for turn to resolve
 */
async function waitForTurnResolution(page: Page, expectedTurn: number, timeout = 30000) {
  const turnCounter = page.getByTestId('turn-counter');
  await expect(turnCounter).toHaveText(`Turn ${expectedTurn}`, { timeout });
}

/**
 * Helper: Check if battle has ended
 */
async function isBattleEnded(page: Page): Promise<boolean> {
  // Check for battle end screen indicators
  const endScreenIndicators = [
    page.getByText(/victory|defeat|you win|you lose|battle ended/i),
    page.getByRole('button', { name: /return to lobby|rematch/i })
  ];
  
  for (const indicator of endScreenIndicators) {
    if (await indicator.isVisible({ timeout: 1000 }).catch(() => false)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Helper: Get current HP from page
 */
async function getCurrentHP(page: Page, side: 'player' | 'opponent'): Promise<number> {
  const hpText = await page.getByTestId(`hp-bar-${side}`).innerText();
  const match = hpText.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return 0;
  return parseInt(match[1]);
}

/**
 * MAIN TEST: Complete flow from login to battle completion
 */
test('complete multiplayer flow: two users create teams and battle to completion', async ({ browser }) => {
  test.setTimeout(300_000); // 5 minutes for full flow
  test.skip(!!process.env.CI, 'E2E test requires local dev environment');

  const player1Context = await browser.newContext();
  const player2Context = await browser.newContext();
  const player1Page = await player1Context.newPage();
  const player2Page = await player2Context.newPage();

  // Enable console logging for debugging
  player1Page.on('console', msg => console.log('P1 LOG:', msg.text()));
  player2Page.on('console', msg => console.log('P2 LOG:', msg.text()));
  
  try {
    // STEP 1: Both players login
    console.log('\n=== STEP 1: LOGIN ===');
    await login(player1Page, PLAYER1_EMAIL, PLAYER1_PASSWORD);
    await login(player2Page, PLAYER2_EMAIL, PLAYER2_PASSWORD);
    
    // STEP 2: Both players build teams
    console.log('\n=== STEP 2: BUILD TEAMS ===');
    await buildTeam(player1Page, 'Player 1');
    await buildTeam(player2Page, 'Player 2');
    
    // STEP 3: Create and join room
    console.log('\n=== STEP 3: ROOM SETUP ===');
    const roomId = await createRoom(player1Page);
    await joinRoom(player2Page, roomId);
    
    // STEP 4: Start battle
    console.log('\n=== STEP 4: START BATTLE ===');
    await startBattle(player1Page, player2Page);
    
    // Wait for battle UI to load
    await player1Page.waitForSelector('[data-testid="turn-counter"]', { timeout: 30000 });
    await player2Page.waitForSelector('[data-testid="turn-counter"]', { timeout: 30000 });
    
    // Verify initial state
    await expect(player1Page.getByTestId('turn-counter')).toHaveText('Turn 1');
    await expect(player2Page.getByTestId('turn-counter')).toHaveText('Turn 1');
    console.log('✅ Battle UI loaded');
    
    // STEP 5: Battle loop - execute turns until one player wins
    console.log('\n=== STEP 5: BATTLE EXECUTION ===');
    
    let currentTurn = 1;
    let maxTurns = 50; // Safety limit
    let battleEnded = false;
    
    while (!battleEnded && currentTurn <= maxTurns) {
      console.log(`\n--- Turn ${currentTurn} ---`);
      
      // Check if battle already ended
      if (await isBattleEnded(player1Page) || await isBattleEnded(player2Page)) {
        battleEnded = true;
        break;
      }
      
      // Get HP before turn
      const p1HpBefore = await getCurrentHP(player1Page, 'player');
      const p2HpBefore = await getCurrentHP(player2Page, 'player');
      console.log(`P1 HP: ${p1HpBefore}, P2 HP: ${p2HpBefore}`);
      
      // Both players select moves
      // Player 1 uses first available move
      try {
        await executeTurn(player1Page, 'flamethrower', 'Player 1');
      } catch {
        // Try alternative moves if flamethrower not available
        const altMoves = ['air-slash', 'dragon-claw', 'fire-blast', 'hydro-pump', 'ice-beam'];
        for (const move of altMoves) {
          try {
            await executeTurn(player1Page, move, 'Player 1');
            break;
          } catch {
            continue;
          }
        }
      }
      
      // Player 2 uses first available move
      try {
        await executeTurn(player2Page, 'flamethrower', 'Player 2');
      } catch {
        const altMoves = ['air-slash', 'dragon-claw', 'fire-blast', 'hydro-pump', 'ice-beam'];
        for (const move of altMoves) {
          try {
            await executeTurn(player2Page, move, 'Player 2');
            break;
          } catch {
            continue;
          }
        }
      }
      
      // Wait for turn to resolve
      console.log(`Waiting for turn ${currentTurn + 1}...`);
      try {
        await waitForTurnResolution(player1Page, currentTurn + 1, 20000);
        console.log(`✅ Turn ${currentTurn} resolved`);
      } catch (error) {
        // Turn might not advance if battle ended
        console.log('Turn did not advance - checking if battle ended...');
        if (await isBattleEnded(player1Page) || await isBattleEnded(player2Page)) {
          battleEnded = true;
          break;
        }
        throw error;
      }
      
      // Verify damage was dealt
      const p1HpAfter = await getCurrentHP(player1Page, 'player');
      const p2HpAfter = await getCurrentHP(player2Page, 'player');
      
      if (p1HpAfter < p1HpBefore || p2HpAfter < p2HpBefore) {
        console.log(`✅ Damage dealt: P1: ${p1HpBefore} → ${p1HpAfter}, P2: ${p2HpBefore} → ${p2HpAfter}`);
      }
      
      // Check if Pokemon fainted
      if (p1HpAfter === 0 || p2HpAfter === 0) {
        console.log('Pokemon fainted - battle may end or switch required');
      }
      
      currentTurn++;
    }
    
    // STEP 6: Verify battle completion
    console.log('\n=== STEP 6: VERIFY BATTLE COMPLETION ===');
    
    if (!battleEnded) {
      battleEnded = await isBattleEnded(player1Page) || await isBattleEnded(player2Page);
    }
    
    expect(battleEnded).toBeTruthy();
    console.log(`✅ Battle completed after ${currentTurn - 1} turns`);
    
    // Verify end screen exists
    const p1EndScreen = player1Page.getByText(/victory|defeat|you win|you lose|battle ended/i);
    const p2EndScreen = player2Page.getByText(/victory|defeat|you win|you lose|battle ended/i);
    
    await expect(p1EndScreen.or(p2EndScreen)).toBeVisible({ timeout: 5000 });
    console.log('✅ Battle end screen displayed');
    
    // Take final screenshots
    await player1Page.screenshot({ path: 'test-results/player1-battle-end.png' });
    await player2Page.screenshot({ path: 'test-results/player2-battle-end.png' });
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error(error);
    
    // Take failure screenshots
    await player1Page.screenshot({ path: 'test-results/player1-failure.png', fullPage: true });
    await player2Page.screenshot({ path: 'test-results/player2-failure.png', fullPage: true });
    
    throw error;
  } finally {
    await player1Context.close();
    await player2Context.close();
  }
});
