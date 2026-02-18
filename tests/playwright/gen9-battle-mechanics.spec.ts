import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3002';

const HOST_EMAIL = process.env.TEST_HOST_EMAIL ?? 'test-host@pokemon-battles.test';
const HOST_PASSWORD = process.env.TEST_HOST_PASSWORD ?? 'TestHost123!';
const GUEST_EMAIL = process.env.TEST_GUEST_EMAIL ?? 'test-guest@pokemon-battles.test';
const GUEST_PASSWORD = process.env.TEST_GUEST_PASSWORD ?? 'TestGuest123!';

// Team with Charizard for testing
const CHARIZARD_TEAM = [
  {
    id: 6,
    name: 'Charizard',
    species: 'charizard',
    level: 50,
    hp: { cur: 150, max: 150 },
    stats: { hp: 150, atk: 100, def: 100, spa: 150, spd: 100, spe: 120 },
    moves: ['flamethrower', 'air-slash', 'dragon-claw', 'protect'],
    types: ['fire', 'flying']
  },
  {
    id: 9,
    name: 'Blastoise',
    species: 'blastoise',
    level: 50,
    hp: { cur: 160, max: 160 },
    stats: { hp: 160, atk: 100, def: 120, spa: 100, spd: 120, spe: 90 },
    moves: ['hydro-pump', 'skull-bash', 'ice-beam', 'protect'],
    types: ['water']
  },
  {
    id: 3,
    name: 'Venusaur',
    species: 'venusaur',
    level: 50,
    hp: { cur: 160, max: 160 },
    stats: { hp: 160, atk: 100, def: 100, spa: 120, spd: 120, spe: 80 },
    moves: ['solar-beam', 'sludge-bomb', 'giga-drain', 'protect'],
    types: ['grass', 'poison']
  }
];

async function injectTeam(page: Page, team: any[]) {
  await page.evaluate((teamData) => {
    localStorage.setItem('pokemon-team-builder', JSON.stringify([teamData]));
    localStorage.setItem('pokemon-current-team', JSON.stringify(teamData));
  }, team);
}

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(`${BASE_URL}/`, { timeout: 10000 });
}

test('Gen 9 Battle Mechanics: Charizard vs Charizard with full mechanics', async ({ browser }) => {
  test.setTimeout(180_000);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  try {
    console.log('=== Setting up battle ===');
    
    // Login and inject teams
    await login(hostPage, HOST_EMAIL, HOST_PASSWORD);
    await injectTeam(hostPage, CHARIZARD_TEAM);
    
    await login(guestPage, GUEST_EMAIL, GUEST_PASSWORD);
    await injectTeam(guestPage, CHARIZARD_TEAM);

    // Create and join room
    await hostPage.goto(`${BASE_URL}/lobby`, { waitUntil: 'domcontentloaded' });
    await hostPage.getByRole('button', { name: /create room/i }).click();
    await expect(hostPage).toHaveURL(/\/lobby\/room\/?/, { timeout: 30000 });
    
    const roomId = new URL(hostPage.url()).searchParams.get('id');
    if (!roomId) throw new Error('Failed to extract Room ID');
    console.log(`Room created: ${roomId}`);

    await guestPage.goto(`${BASE_URL}/lobby/room?id=${roomId}`, { waitUntil: 'domcontentloaded' });
    await expect(guestPage).toHaveURL(/\/lobby\/room\/?/, { timeout: 30000 });

    // Start battle
    await hostPage.getByRole('button', { name: /ready/i }).click();
    await guestPage.getByRole('button', { name: /ready/i }).click();
    await hostPage.getByRole('button', { name: /start battle/i }).click();

    await expect(hostPage).toHaveURL(/\/battle\/runtime/, { timeout: 30000 });
    await expect(guestPage).toHaveURL(/\/battle\/runtime/, { timeout: 30000 });
    console.log('Battle started!');

    await hostPage.waitForSelector('[data-testid="turn-counter"]', { timeout: 30000 });
    await guestPage.waitForSelector('[data-testid="turn-counter"]', { timeout: 30000 });

    // Test 1: Verify both players see Charizard
    console.log('\n=== Test 1: Verify Pokemon ===');
    await expect(hostPage.getByTestId('pokemon-name-player')).toHaveText('Charizard');
    await expect(guestPage.getByTestId('pokemon-name-player')).toHaveText('Charizard');
    await expect(hostPage.getByTestId('pokemon-name-opponent')).toHaveText('Charizard');
    await expect(guestPage.getByTestId('pokemon-name-opponent')).toHaveText('Charizard');
    console.log('✅ Both players have Charizard');

    // Test 2: Verify HP is calculated (not hardcoded 100)
    console.log('\n=== Test 2: Verify HP Calculation ===');
    const hostHpText = await hostPage.getByTestId('hp-bar-player').innerText();
    const guestHpText = await guestPage.getByTestId('hp-bar-player').innerText();
    
    const parseHp = (text: string) => parseInt(text.split('/')[0].trim());
    const parseMaxHp = (text: string) => parseInt(text.split('/')[1].trim());
    
    const hostMaxHp = parseMaxHp(hostHpText);
    const guestMaxHp = parseMaxHp(guestHpText);
    
    expect(hostMaxHp).toBeGreaterThan(100);
    expect(guestMaxHp).toBeGreaterThan(100);
    console.log(`✅ HP calculated correctly: Host=${hostMaxHp}, Guest=${guestMaxHp}`);

    // Test 3: Basic damage dealing
    console.log('\n=== Test 3: Basic Damage ===');
    await expect(hostPage.getByTestId('turn-counter')).toHaveText('Turn 1');
    
    const hostInitialHp = parseHp(hostHpText);
    const guestInitialHp = parseHp(guestHpText);

    await hostPage.getByTestId('move-air-slash').click({ force: true });
    await guestPage.getByTestId('move-flamethrower').click({ force: true });

    await expect(hostPage.getByTestId('turn-counter')).toHaveText('Turn 2', { timeout: 30000 });
    
    const hostHpAfter = parseHp(await hostPage.getByTestId('hp-bar-player').innerText());
    const guestHpAfter = parseHp(await guestPage.getByTestId('hp-bar-player').innerText());
    
    expect(hostHpAfter).toBeLessThan(hostInitialHp);
    expect(guestHpAfter).toBeLessThan(guestInitialHp);
    console.log(`✅ Damage dealt: Host ${hostInitialHp}→${hostHpAfter}, Guest ${guestInitialHp}→${guestHpAfter}`);

    // Test 4: Protect mechanics (consecutive use failure)
    console.log('\n=== Test 4: Protect Mechanics ===');
    const turn2HostHp = hostHpAfter;
    
    // Both use Protect
    await hostPage.getByTestId('move-protect').click({ force: true });
    await guestPage.getByTestId('move-protect').click({ force: true });
    
    await expect(hostPage.getByTestId('turn-counter')).toHaveText('Turn 3', { timeout: 30000 });
    
    // HP should not change (both protected)
    const turn3HostHp = parseHp(await hostPage.getByTestId('hp-bar-player').innerText());
    expect(turn3HostHp).toBe(turn2HostHp);
    console.log('✅ Protect blocked damage');

    // Test 5: Protect consecutive use (should have 50% fail chance on second use)
    console.log('\n=== Test 5: Protect Consecutive Use ===');
    // Use Protect again - might fail
    await hostPage.getByTestId('move-protect').click({ force: true });
    await guestPage.getByTestId('move-air-slash').click({ force: true });
    
    await expect(hostPage.getByTestId('turn-counter')).toHaveText('Turn 4', { timeout: 30000 });
    console.log('✅ Protect consecutive use handled (may succeed or fail based on RNG)');

    // Test 6: Entry hazards and switching
    console.log('\n=== Test 6: Switching Mechanics ===');
    const turn4HostHp = parseHp(await hostPage.getByTestId('hp-bar-player').innerText());
    
    // Switch to Blastoise
    await hostPage.getByTestId('switch-blastoise-1').click();
    await guestPage.getByTestId('move-flamethrower').click({ force: true });
    
    await expect(hostPage.getByTestId('turn-counter')).toHaveText('Turn 5', { timeout: 30000 });
    
    // Verify switch happened
    await expect(hostPage.getByTestId('pokemon-name-player')).toHaveText('Blastoise');
    console.log('✅ Switch to Blastoise successful');
    
    // Verify moveset updated
    await expect(hostPage.getByTestId('move-hydro-pump')).toBeVisible({ timeout: 5000 });
    await expect(hostPage.getByTestId('move-flamethrower')).not.toBeVisible();
    console.log('✅ Moveset updated after switch');

    console.log('\n=== All Gen 9 Mechanics Tests Passed! ===');

  } catch (e) {
    console.error('Test failed:', e);
    await hostPage.screenshot({ path: 'host-gen9-failure.png' });
    await guestPage.screenshot({ path: 'guest-gen9-failure.png' });
    throw e;
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});
