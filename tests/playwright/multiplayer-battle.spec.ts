import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3002';

const HOST_EMAIL = process.env.TEST_HOST_EMAIL ?? 'test-host@pokemon-battles.test';
const HOST_PASSWORD = process.env.TEST_HOST_PASSWORD ?? 'TestHost123!';
const GUEST_EMAIL = process.env.TEST_GUEST_EMAIL ?? 'test-guest@pokemon-battles.test';
const GUEST_PASSWORD = process.env.TEST_GUEST_PASSWORD ?? 'TestGuest123!';

// Full Team with Charizard as lead
const FULL_TEAM = [
  {
    id: 6, // Charizard
    name: 'Charizard',
    species: 'charizard',
    level: 50,
    hp: { cur: 150, max: 150 },
    stats: { hp: 150, atk: 100, def: 100, spa: 150, spd: 100, spe: 120 },
    moves: ['flamethrower', 'air-slash'],
    types: ['fire', 'flying']
  },
  {
    id: 9, // Blastoise
    name: 'Blastoise',
    species: 'blastoise',
    level: 50,
    hp: { cur: 160, max: 160 },
    stats: { hp: 160, atk: 100, def: 120, spa: 100, spd: 120, spe: 90 },
    moves: ['hydro-pump', 'skull-bash'],
    types: ['water']
  },
  {
    id: 3, // Venusaur
    name: 'Venusaur',
    species: 'venusaur',
    level: 50,
    hp: { cur: 160, max: 160 },
    stats: { hp: 160, atk: 100, def: 100, spa: 120, spd: 120, spe: 80 },
    moves: ['solar-beam', 'sludge-bomb'],
    types: ['grass', 'poison']
  }
];

async function injectTeam(page: Page, team: any[]) {
  // Inject into localStorage
  await page.evaluate((teamData) => {
    localStorage.setItem('pokemon-team-builder', JSON.stringify([teamData])); // Set preferred key
    localStorage.setItem('pokemon-current-team', JSON.stringify(teamData));
  }, team);
}

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  
  // Fill in credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait for redirect to home
  await expect(page).toHaveURL(`${BASE_URL}/`, { timeout: 10000 });
}

async function switchPokemon(page: Page, pokemonName: string, side: 'host' | 'guest') {
  // Assuming there's a switch button with data-testid=\"switch-{pokemonName}\"
  // The actual selector might differ based on your UI implementation.
  // Let's try to find a switch button containing \"Charizard\"
  
  const switchBtn = page.locator(`button[data-testid^=\"switch-${pokemonName.toLowerCase()}\"]`);
  if (await switchBtn.isVisible()) {
    await switchBtn.click();
    // Wait for switch to resolve (if this was a turn action)
    // But here we might be in the \"selection\" phase where we just click it to queue the switch?
    // Or if this is start of battle, we can't switch immediately unless we select \"Switch\" as an action.
    
    // If we are in the battle loop, clicking switch queues the action.
    // We need to verify if this function is called during a turn or setup.
    // For now, let's assume we call this during the turn selection.
  } else {
    throw new Error(`Could not find switch button for ${pokemonName} on ${side} side.`);
  }
}

test('multiplayer battle flow: full team charizard verification', async ({ browser }) => {
  test.setTimeout(180_000); // 3 minutes for full flow

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  try {
    console.log('Logging in host...');
    await login(hostPage, HOST_EMAIL, HOST_PASSWORD);
    // Inject team AFTER login to ensure it persists
    await injectTeam(hostPage, FULL_TEAM);
    
    console.log('Logging in guest...');
    await login(guestPage, GUEST_EMAIL, GUEST_PASSWORD);
    // Inject team AFTER login
    await injectTeam(guestPage, FULL_TEAM);

    // Host creates room
    console.log('Host creating room...');
    await hostPage.goto(`${BASE_URL}/lobby`, { waitUntil: 'domcontentloaded' });
    await hostPage.getByRole('button', { name: /create room/i }).click();

    // Wait for redirection to room page
    await expect(hostPage).toHaveURL(/\/lobby\/room\/?\\?id=/, { timeout: 30000 });
    
    // Extract Room ID from URL
    const hostUrl = hostPage.url();
    const urlObj = new URL(hostUrl);
    const roomId = urlObj.searchParams.get('id');
    
    if (!roomId) throw new Error('Failed to extract Room ID from URL');
    console.log(`Room created with ID: ${roomId}`);

    // Guest joins room
    console.log('Guest joining room...');
    await guestPage.goto(`${BASE_URL}/lobby/room?id=${roomId}`, { waitUntil: 'domcontentloaded' });
    await expect(guestPage).toHaveURL(/\/lobby\/room\/?\\?id=/, { timeout: 30000 });
    console.log('Guest joined room.');

    // Both mark ready
    console.log('Marking ready...');
    await hostPage.getByRole('button', { name: /ready/i }).click();
    await guestPage.getByRole('button', { name: /ready/i }).click();

    // Host starts battle
    console.log('Starting battle...');
    await hostPage.getByRole('button', { name: /start battle/i }).click();

    // Wait for battle runtime to load
    await expect(hostPage).toHaveURL(/\/battle\/runtime/, { timeout: 30000 });
    await expect(guestPage).toHaveURL(/\/battle\/runtime/, { timeout: 30000 });
    console.log('Battle started.');

    // Wait for battle UI to fully load
    await hostPage.waitForSelector('[data-testid=\"turn-counter\"]', { timeout: 30000 });
    await guestPage.waitForSelector('[data-testid=\"turn-counter\"]', { timeout: 30000 });

    // 1. Verify Both Players See Charizard
    console.log('Verifying Host Player Pokemon...');
    await expect(hostPage.getByTestId('pokemon-name-player')).toHaveText('Charizard');
    
    console.log('Verifying Guest Player Pokemon...');
    await expect(guestPage.getByTestId('pokemon-name-player')).toHaveText('Charizard');

    // 2. Verify Opponent is also Charizard (since both have same team)
    console.log('Verifying Host Opponent...');
    await expect(hostPage.getByTestId('pokemon-name-opponent')).toHaveText('Charizard');
    
    console.log('Verifying Guest Opponent...');
    await expect(guestPage.getByTestId('pokemon-name-opponent')).toHaveText('Charizard');

    // 3. Verify Initial HP (NOT hardcoded 100)
    console.log('Verifying Initial HP...');
    const hostHpTextInitial = await hostPage.getByTestId('hp-bar-player').innerText();
    const guestHpTextInitial = await guestPage.getByTestId('hp-bar-player').innerText();
    
    console.log(`Host Initial HP: ${hostHpTextInitial}`);
    console.log(`Guest Initial HP: ${guestHpTextInitial}`);

    expect(hostHpTextInitial).toMatch(/\\d+\\s\\/\\s\\d+/);
    expect(guestHpTextInitial).toMatch(/\\d+\\s\\/\\s\\d+/);

    const parseHp = (text: string) => parseInt(text.split('/')[0].trim());
    const hostMaxHp = parseInt(hostHpTextInitial.split('/')[1].trim());
    const guestMaxHp = parseInt(guestHpTextInitial.split('/')[1].trim());

    // Verify HP is NOT 100 (old hardcoded value)
    console.log(`Host Max HP: ${hostMaxHp}`);
    console.log(`Guest Max HP: ${guestMaxHp}`);
    expect(hostMaxHp).toBeGreaterThan(100); // Should be calculated from stats
    expect(guestMaxHp).toBeGreaterThan(100);

    // 4. Execute Turn & Verify Damage
    console.log('Executing Turn...');
    
    // Add console listener to debug browser errors
    hostPage.on('console', msg => console.log('HOST PAGE LOG:', msg.text()));
    guestPage.on('console', msg => console.log('GUEST PAGE LOG:', msg.text()));

    // Verify we are on Turn 1
    await expect(hostPage.getByTestId('turn-counter')).toHaveText('Turn 1');
    await expect(guestPage.getByTestId('turn-counter')).toHaveText('Turn 1');

    // Host uses Air Slash (Flying) vs Charizard (Fire/Flying) -> Normal effectiveness
    const hostMoveBtn = hostPage.getByTestId('move-air-slash');
    await expect(hostMoveBtn).toBeVisible();
    console.log('Host clicking Air Slash...');
    await hostMoveBtn.click({ force: true });

    // Guest uses Flamethrower (Fire) vs Charizard (Fire/Flying) -> Not very effective
    const guestMoveBtn = guestPage.getByTestId('move-flamethrower');
    await expect(guestMoveBtn).toBeVisible();
    console.log('Guest clicking Flamethrower...');
    await guestMoveBtn.click({ force: true });

    // Wait for Turn 2 (Resolution complete)
    console.log('Waiting for Turn 2...');
    await expect(hostPage.getByTestId('turn-counter')).toHaveText('Turn 2', { timeout: 30000 });
    await expect(guestPage.getByTestId('turn-counter')).toHaveText('Turn 2', { timeout: 30000 });
    console.log('Turn resolved (Turn 2 reached).');

    // Verify Damage
    console.log('Verifying Damage...');
    
    // Host (Charizard) took Flamethrower
    const hostHpTextAfter = await hostPage.getByTestId('hp-bar-player').innerText();
    const hostCurrentHp = parseHp(hostHpTextAfter);
    console.log(`Host HP after turn: ${hostCurrentHp} (was ${parseHp(hostHpTextInitial)})`);
    expect(hostCurrentHp).toBeLessThan(parseHp(hostHpTextInitial));

    // Guest (Charizard) took Air Slash
    const guestHpTextAfter = await guestPage.getByTestId('hp-bar-player').innerText();
    const guestCurrentHp = parseHp(guestHpTextAfter);
    console.log(`Guest HP after turn: ${guestCurrentHp} (was ${parseHp(guestHpTextInitial)})`);
    expect(guestCurrentHp).toBeLessThan(parseHp(guestHpTextInitial));
    
    console.log('✅ Deep verification successful!');

  } catch (e) {
    console.error('Test failed:', e);
    await hostPage.screenshot({ path: 'host-failure-deep-full.png' });
    await guestPage.screenshot({ path: 'guest-failure-deep-full.png' });
    throw e;
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});

test('validates switch persistence and moveset updates', async ({ browser }) => {
  test.setTimeout(180_000);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  try {
    // Setup
    await login(hostPage, HOST_EMAIL, HOST_PASSWORD);
    await injectTeam(hostPage, FULL_TEAM);
    await login(guestPage, GUEST_EMAIL, GUEST_PASSWORD);
    await injectTeam(guestPage, FULL_TEAM);

    // Create and join room
    await hostPage.goto(`${BASE_URL}/lobby`);
    await hostPage.getByRole('button', { name: /create room/i }).click();
    await expect(hostPage).toHaveURL(/\/lobby\/room/, { timeout: 30000 });
    
    const roomId = new URL(hostPage.url()).searchParams.get('id');
    await guestPage.goto(`${BASE_URL}/lobby/room?id=${roomId}`);
    
    // Start battle
    await hostPage.getByRole('button', { name: /ready/i }).click();
    await guestPage.getByRole('button', { name: /ready/i }).click();
    await hostPage.getByRole('button', { name: /start battle/i }).click();
    
    await hostPage.waitForSelector('[data-testid="turn-counter"]', { timeout: 30000 });

    // Verify initial moves (Charizard)
    await expect(hostPage.getByTestId('move-flamethrower')).toBeVisible();
    await expect(hostPage.getByTestId('move-air-slash')).toBeVisible();
    console.log('✅ Initial moveset verified (Charizard)');

    // Both players switch to Blastoise
    await hostPage.getByTestId('switch-blastoise-1').click();
    await guestPage.getByTestId('switch-blastoise-1').click();

    // Wait for turn to resolve
    await expect(hostPage.getByTestId('turn-counter')).toHaveText('Turn 2', { timeout: 30000 });
    console.log('✅ Switch completed without freezing');

    // Verify moveset updated to Blastoise's moves
    await expect(hostPage.getByTestId('move-hydro-pump')).toBeVisible({ timeout: 5000 });
    await expect(hostPage.getByTestId('move-skull-bash')).toBeVisible();
    console.log('✅ Moveset updated after switch');

    // Verify old moves are gone
    await expect(hostPage.getByTestId('move-flamethrower')).not.toBeVisible();
    console.log('✅ Old moves removed');

  } catch (e) {
    console.error('Switch test failed:', e);
    await hostPage.screenshot({ path: 'host-switch-failure.png' });
    throw e;
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});
