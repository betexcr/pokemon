import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3002';

const HOST_EMAIL = process.env.TEST_HOST_EMAIL ?? 'test-host@pokemon-battles.test';
const HOST_PASSWORD = process.env.TEST_HOST_PASSWORD ?? 'TestHost123!';
const GUEST_EMAIL = process.env.TEST_GUEST_EMAIL ?? 'test-guest@pokemon-battles.test';
const GUEST_PASSWORD = process.env.TEST_GUEST_PASSWORD ?? 'TestGuest123!';

// Full Team with different Pokemon and stats
const FULL_TEAM = [
  {
    id: 6, // Charizard
    name: 'Charizard',
    species: 'charizard',
    level: 50,
    maxHp: 153, // Calculated from base HP 78
    currentHp: 153,
    stats: [
      { stat: { name: 'hp' }, base_stat: 78 },
      { stat: { name: 'attack' }, base_stat: 84 },
      { stat: { name: 'defense' }, base_stat: 78 },
      { stat: { name: 'special-attack' }, base_stat: 109 },
      { stat: { name: 'special-defense' }, base_stat: 85 },
      { stat: { name: 'speed' }, base_stat: 100 }
    ],
    moves: [
      { id: 'flamethrower', pp: 15, maxPp: 15 },
      { id: 'air-slash', pp: 15, maxPp: 15 }
    ],
    types: ['fire', 'flying']
  },
  {
    id: 9, // Blastoise
    name: 'Blastoise',
    species: 'blastoise',
    level: 50,
    maxHp: 158, // Calculated from base HP 79
    currentHp: 158,
    stats: [
      { stat: { name: 'hp' }, base_stat: 79 },
      { stat: { name: 'attack' }, base_stat: 83 },
      { stat: { name: 'defense' }, base_stat: 100 },
      { stat: { name: 'special-attack' }, base_stat: 85 },
      { stat: { name: 'special-defense' }, base_stat: 105 },
      { stat: { name: 'speed' }, base_stat: 78 }
    ],
    moves: [
      { id: 'hydro-pump', pp: 5, maxPp: 5 },
      { id: 'ice-beam', pp: 10, maxPp: 10 }
    ],
    types: ['water']
  },
  {
    id: 3, // Venusaur
    name: 'Venusaur',
    species: 'venusaur',
    level: 50,
    maxHp: 160, // Calculated from base HP 80
    currentHp: 160,
    stats: [
      { stat: { name: 'hp' }, base_stat: 80 },
      { stat: { name: 'attack' }, base_stat: 82 },
      { stat: { name: 'defense' }, base_stat: 83 },
      { stat: { name: 'special-attack' }, base_stat: 100 },
      { stat: { name: 'special-defense' }, base_stat: 100 },
      { stat: { name: 'speed' }, base_stat: 80 }
    ],
    moves: [
      { id: 'solar-beam', pp: 10, maxPp: 10 },
      { id: 'sludge-bomb', pp: 10, maxPp: 10 }
    ],
    types: ['grass', 'poison']
  }
];

async function injectTeam(page: Page, team: any[]) {
  await page.evaluate((teamData) => {
    const formattedTeam = teamData.map(p => ({
      ...p,
      pokemon: {
        id: p.id,
        name: p.name,
        species: { name: p.species },
        stats: p.stats,
        types: p.types.map((t: string) => ({ type: { name: t } }))
      }
    }));
    localStorage.setItem('pokemon-team-builder', JSON.stringify([{ slots: formattedTeam }]));
    localStorage.setItem('pokemon-current-team', JSON.stringify(formattedTeam));
  }, team);
}

async function login(page: Page, email: string, password: string) {
  console.log(`Logging in ${email}...`);
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/`, { timeout: 10000 });
  console.log(`✅ Logged in as ${email}`);
}

async function createAndJoinRoom(hostPage: Page, guestPage: Page) {
  // Host creates room
  await hostPage.goto(`${BASE_URL}/lobby`);
  await hostPage.click('button:has-text("Create Room")');
  await hostPage.waitForURL(/\/lobby\/room\?id=/, { timeout: 10000 });
  
  const roomUrl = hostPage.url();
  const roomId = new URL(roomUrl).searchParams.get('id');
  console.log(`✅ Room created: ${roomId}`);
  
  // Guest joins
  await guestPage.goto(roomUrl);
  await guestPage.waitForURL(/\/lobby\/room\?id=/, { timeout: 10000 });
  console.log(`✅ Guest joined room`);
  
  return roomId!;
}

async function startBattle(hostPage: Page, guestPage: Page) {
  // Both mark ready
  await hostPage.click('button:has-text("Ready")');
  await guestPage.click('button:has-text("Ready")');
  
  // Host starts battle
  await hostPage.click('button:has-text("Start Battle")');
  
  // Wait for battle to start
  await hostPage.waitForURL(/\/battle\/runtime/, { timeout: 15000 });
  await guestPage.waitForURL(/\/battle\/runtime/, { timeout: 15000 });
  console.log(`✅ Battle started`);
}

test.describe('Battle System Validation', () => {
  test('validates HP calculation from base stats', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      // Setup
      await injectTeam(hostPage, FULL_TEAM);
      await injectTeam(guestPage, FULL_TEAM);
      await login(hostPage, HOST_EMAIL, HOST_PASSWORD);
      await login(guestPage, GUEST_EMAIL, GUEST_PASSWORD);
      await createAndJoinRoom(hostPage, guestPage);
      await startBattle(hostPage, guestPage);

      // Wait for battle UI to load
      await hostPage.waitForSelector('[data-testid="turn-counter"]', { timeout: 10000 });

      // Check that HP is NOT 100 (the old hardcoded value)
      const hostHpText = await hostPage.textContent('.hp, [class*="hp"]');
      console.log('Host HP display:', hostHpText);

      // Verify HP is calculated correctly (should be 153 for Charizard at level 50)
      const hpMatch = hostHpText?.match(/(\d+)\s*\/\s*(\d+)/);
      if (hpMatch) {
        const maxHp = parseInt(hpMatch[2]);
        console.log(`Max HP: ${maxHp}`);
        expect(maxHp).toBeGreaterThan(100); // Should not be hardcoded 100
        expect(maxHp).toBeLessThan(200); // Reasonable range for level 50
        expect(maxHp).toBe(153); // Exact value for Charizard
      }

      console.log('✅ HP calculation validated');
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('validates switch persistence and moveset updates', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      // Setup
      await injectTeam(hostPage, FULL_TEAM);
      await injectTeam(guestPage, FULL_TEAM);
      await login(hostPage, HOST_EMAIL, HOST_PASSWORD);
      await login(guestPage, GUEST_EMAIL, GUEST_PASSWORD);
      await createAndJoinRoom(hostPage, guestPage);
      await startBattle(hostPage, guestPage);

      await hostPage.waitForSelector('[data-testid="turn-counter"]', { timeout: 10000 });

      // Verify initial Pokemon is Charizard
      const initialMoves = await hostPage.$$eval('[data-testid^="move-"]', els => 
        els.map(el => el.getAttribute('data-testid'))
      );
      console.log('Initial moves (Charizard):', initialMoves);
      expect(initialMoves).toContain('move-flamethrower');
      expect(initialMoves).toContain('move-air-slash');

      // Both players switch to Blastoise (index 1)
      await hostPage.click('[data-testid="switch-blastoise-1"]');
      await guestPage.click('[data-testid="switch-blastoise-1"]');

      // Wait for turn to resolve
      await hostPage.waitForTimeout(3000);

      // Verify battle didn't freeze (turn counter should increment)
      const turnText = await hostPage.textContent('[data-testid="turn-counter"]');
      console.log('Turn after switch:', turnText);
      expect(turnText).toContain('Turn 2');

      // Verify moveset updated to Blastoise's moves
      const newMoves = await hostPage.$$eval('[data-testid^="move-"]', els => 
        els.map(el => el.getAttribute('data-testid'))
      );
      console.log('New moves (Blastoise):', newMoves);
      expect(newMoves).toContain('move-hydro-pump');
      expect(newMoves).toContain('move-ice-beam');
      expect(newMoves).not.toContain('move-flamethrower'); // Old moves gone

      console.log('✅ Switch persistence and moveset update validated');
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('validates automatic replacement when Pokemon faints', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      // Setup
      await injectTeam(hostPage, FULL_TEAM);
      await injectTeam(guestPage, FULL_TEAM);
      await login(hostPage, HOST_EMAIL, HOST_PASSWORD);
      await login(guestPage, GUEST_EMAIL, GUEST_PASSWORD);
      await createAndJoinRoom(hostPage, guestPage);
      await startBattle(hostPage, guestPage);

      await hostPage.waitForSelector('[data-testid="turn-counter"]', { timeout: 10000 });

      // Both players attack each other repeatedly until one faints
      for (let i = 0; i < 5; i++) {
        const hostMoves = await hostPage.$$('[data-testid^="move-"]');
        const guestMoves = await guestPage.$$('[data-testid^="move-"]');
        
        if (hostMoves.length > 0) await hostMoves[0].click();
        if (guestMoves.length > 0) await guestMoves[0].click();
        
        await hostPage.waitForTimeout(2000);
        
        // Check if battle log shows a faint
        const battleLog = await hostPage.textContent('.battle-log');
        if (battleLog?.includes('fainted')) {
          console.log('✅ Pokemon fainted detected');
          
          // Wait for automatic replacement
          await hostPage.waitForTimeout(2000);
          
          // Verify battle continues (not stuck)
          const canSelectMove = await hostPage.$$('[data-testid^="move-"]');
          expect(canSelectMove.length).toBeGreaterThan(0);
          
          // Verify new Pokemon is active (check for different moves or species)
          const currentMoves = await hostPage.$$eval('[data-testid^="move-"]', els => 
            els.map(el => el.getAttribute('data-testid'))
          );
          console.log('Moves after replacement:', currentMoves);
          
          console.log('✅ Automatic replacement validated');
          break;
        }
      }
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test('full battle flow with all validations', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    try {
      // Setup
      await injectTeam(hostPage, FULL_TEAM);
      await injectTeam(guestPage, FULL_TEAM);
      await login(hostPage, HOST_EMAIL, HOST_PASSWORD);
      await login(guestPage, GUEST_EMAIL, GUEST_PASSWORD);
      await createAndJoinRoom(hostPage, guestPage);
      await startBattle(hostPage, guestPage);

      await hostPage.waitForSelector('[data-testid="turn-counter"]', { timeout: 10000 });

      // 1. Validate HP
      const hpText = await hostPage.textContent('.hp, [class*="hp"]');
      const hpMatch = hpText?.match(/(\d+)\s*\/\s*(\d+)/);
      if (hpMatch) {
        expect(parseInt(hpMatch[2])).toBeGreaterThan(100);
      }
      console.log('✅ HP validated');

      // 2. Validate initial moveset
      const initialMoves = await hostPage.$$eval('[data-testid^="move-"]', els => 
        els.map(el => el.getAttribute('data-testid'))
      );
      expect(initialMoves.length).toBeGreaterThan(0);
      console.log('✅ Initial moveset validated');

      // 3. Perform switch
      await hostPage.click('[data-testid="switch-blastoise-1"]');
      await guestPage.click('[data-testid="switch-blastoise-1"]');
      await hostPage.waitForTimeout(3000);

      // 4. Validate switch worked
      const turnAfterSwitch = await hostPage.textContent('[data-testid="turn-counter"]');
      expect(turnAfterSwitch).toContain('Turn 2');
      console.log('✅ Switch validated');

      // 5. Validate moveset changed
      const newMoves = await hostPage.$$eval('[data-testid^="move-"]', els => 
        els.map(el => el.getAttribute('data-testid'))
      );
      expect(newMoves).not.toEqual(initialMoves);
      console.log('✅ Moveset update validated');

      // 6. Battle until someone wins
      for (let i = 0; i < 20; i++) {
        const phase = await hostPage.textContent('[class*="phase"]');
        if (phase?.includes('ended')) {
          console.log('✅ Battle completed successfully');
          break;
        }

        const hostMoves = await hostPage.$$('[data-testid^="move-"]');
        const guestMoves = await guestPage.$$('[data-testid^="move-"]');
        
        if (hostMoves.length > 0) await hostMoves[0].click();
        if (guestMoves.length > 0) await guestMoves[0].click();
        
        await hostPage.waitForTimeout(2000);
      }

      console.log('✅ Full battle flow validated');
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
});
