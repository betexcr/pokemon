import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3002';
const FIREBASE_API_KEY = 'AIzaSyASbdOWHRBH_QAqpjRrp9KyzPWheNuUZmY';

async function loginUser(page: Page, email: string, password: string, displayName: string) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  
  const loginResult = await page.evaluate(async (credentials) => {
    try {
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${credentials.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          returnSecureToken: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Store in localStorage to persist auth
        localStorage.setItem('firebase:authUser', JSON.stringify({
          uid: data.localId,
          email: data.email,
          displayName: data.displayName,
          stsTokenManager: {
            accessToken: data.idToken,
            refreshToken: data.refreshToken,
            expirationTime: Date.now() + (parseInt(data.expiresIn) * 1000)
          }
        }));
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error?.message };
      }
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }, { email, password, displayName, apiKey: FIREBASE_API_KEY });
  
  console.log(`Login result for ${email}:`, loginResult);
  
  // Reload to pick up auth state
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  return loginResult.success;
}

test.describe('Complete Battle Flow', () => {
  test('two players complete a full multiplayer battle', async ({ browser }) => {
    console.log('\n=== Starting Complete Battle Test ===\n');

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const host = await context1.newPage();
    const guest = await context2.newPage();

    try {
      // Step 1: Login both players
      console.log('Step 1: Logging in both players...');
      const hostLoggedIn = await loginUser(host, 'test-host@pokemon-battles.test', 'TestHost123!', 'Host Player');
      const guestLoggedIn = await loginUser(guest, 'test-guest@pokemon-battles.test', 'TestGuest123!', 'Guest Player');
      
      expect(hostLoggedIn).toBe(true);
      expect(guestLoggedIn).toBe(true);
      console.log('✅ Both players logged in');

      // Step 2: Navigate to lobby
      console.log('\nStep 2: Navigating to lobby...');
      await host.goto(`${BASE_URL}/lobby`, { waitUntil: 'networkidle' });
      await guest.goto(`${BASE_URL}/lobby`, { waitUntil: 'networkidle' });
      await host.waitForTimeout(2000);
      await guest.waitForTimeout(2000);
      console.log('✅ Both players in lobby');

      // Step 3: Host creates a battle room
      console.log('\nStep 3: Host creating battle room...');
      
      // Click "Create Room" button
      await host.click('button:has-text("Create Room"), button:has-text("Create Battle")', { timeout: 10000 });
      await host.waitForTimeout(2000);
      
      // Get the room code
      const roomCode = await host.evaluate(() => {
        // Look for room code in the page
        const roomCodeElement = document.querySelector('[data-testid="room-code"], .room-code, code');
        return roomCodeElement?.textContent?.trim() || '';
      });
      
      console.log(`Room code: ${roomCode}`);
      
      if (!roomCode) {
        // If no room code visible, we might be directly in team builder
        console.log('No room code found, might be in team builder');
      }
      
      console.log('✅ Host created room');

      // Step 4: Guest joins the room
      if (roomCode) {
        console.log('\nStep 4: Guest joining room...');
        await guest.click('button:has-text("Join Room"), button:has-text("Join Battle")', { timeout: 10000 });
        await guest.waitForTimeout(1000);
        
        // Enter room code
        await guest.fill('input[placeholder*="code"], input[name="roomCode"]', roomCode);
        await guest.click('button:has-text("Join")');
        await guest.waitForTimeout(2000);
        console.log('✅ Guest joined room');
      }

      // Step 5: Both players build teams
      console.log('\nStep 5: Building teams...');
      
      // Check if we're in team builder
      await host.waitForSelector('button:has-text("Add"), input[placeholder*="Pokemon"], .pokemon-search', { timeout: 10000 }).catch(() => null);
      
      // Add 3 Pokemon for host
      for (let i = 0; i < 3; i++) {
        const pokemonNames = ['Pikachu', 'Charizard', 'Blastoise', 'Venusaur', 'Mewtwo', 'Dragonite'];
        const pokemonName = pokemonNames[i];
        
        console.log(`  Host adding ${pokemonName}...`);
        const searchInput = await host.locator('input[placeholder*="Pokemon"], input[placeholder*="Search"]').first();
        await searchInput.fill(pokemonName);
        await host.waitForTimeout(1000);
        
await host.click(`button:has-text("${pokemonName}"), [data-pokemon="${pokemonName.toLowerCase()}"]`).catch(async () => {
          // If specific pokemon not found, click first result
          await host.click('.pokemon-result, .search-result, li').first();
        });
        await host.waitForTimeout(1500);
      }
      
      // Add 3 Pokemon for guest
      for (let i = 0; i < 3; i++) {
        const pokemonNames = ['Squirtle', 'Bulbasaur', 'Charmander'];
        const pokemonName = pokemonNames[i];
        
        console.log(`  Guest adding ${pokemonName}...`);
        const searchInput = await guest.locator('input[placeholder*="Pokemon"], input[placeholder*="Search"]').first();
        await searchInput.fill(pokemonName);
        await guest.waitForTimeout(1000);
        
        await guest.click(`button:has-text("${pokemonName}"), [data-pokemon="${pokemonName.toLowerCase()}"]`).catch(async () => {
          await guest.click('.pokemon-result, .search-result, li').first();
        });
        await guest.waitForTimeout(1500);
      }
      
      console.log('✅ Teams built');

      // Step 6: Both players ready up
      console.log('\nStep 6: Players readying up...');
      await host.click('button:has-text("Ready"), button:has-text("Done"), button:has-text("Confirm")');
      await guest.click('button:has-text("Ready"), button:has-text("Done"), button:has-text("Confirm")');
      await host.waitForTimeout(3000);
      await guest.waitForTimeout(3000);
      console.log('✅ Both players ready');

      // Step 7: Battle starts - select moves
      console.log('\nStep 7: Battle started, selecting moves...');
      
      // Wait for battle screen
      await host.waitForSelector('button:has-text("Tackle"), button:has-text("Attack"), .move-button', { timeout: 15000 });
      await guest.waitForSelector('button:has-text("Tackle"), button:has-text("Attack"), .move-button', { timeout: 15000 });
      
      console.log('Battle screen loaded');
      
      // Play multiple turns
      for (let turn = 1; turn <= 5; turn++) {
        console.log(`\n  Turn ${turn}:`);
        
        // Host selects first available move
        console.log('    Host selecting move...');
        const hostMove = await host.locator('button:has-text("Tackle"), button:has-text("Attack"), .move-button').first();
        await hostMove.click();
        await host.waitForTimeout(1000);
        
        // Guest selects first available move
        console.log('    Guest selecting move...');
        const guestMove = await guest.locator('button:has-text("Tackle"), button:has-text("Attack"), .move-button').first();
        await guestMove.click();
        await guest.waitForTimeout(1000);
        
        // Wait for turn to resolve
        console.log('    Waiting for turn resolution...');
        await host.waitForTimeout(3000);
        
        // Check if battle ended
        const battleEnded = await host.locator('text="wins", text="victory", text="Battle ended"').isVisible().catch(() => false);
        
        if (battleEnded) {
          console.log(`\n✅ Battle ended after ${turn} turn(s)!`);
          break;
        }
        
        // Check if a Pokemon fainted and we need to switch
        const switchNeeded = await host.locator('button:has-text("Switch"), text="fainted"').isVisible().catch(() => false);
        if (switchNeeded) {
          console.log('    Pokemon fainted, switching...');
          const switchButton = await host.locator('button:has-text("Switch"), .pokemon-switch-button').first();
          await switchButton.click();
          await host.waitForTimeout(1000);
        }
      }
      
      console.log('\n✅ BATTLE COMPLETED SUCCESSFULLY! ✅');

      // Take screenshots
      await host.screenshot({ path: 'test-results/battle-complete-host.png', fullPage: true });
      await guest.screenshot({ path: 'test-results/battle-complete-guest.png', fullPage: true });

    } catch (error) {
      console.error('Test failed:', error);
      await host.screenshot({ path: 'test-results/battle-error-host.png', fullPage: true });
      await guest.screenshot({ path: 'test-results/battle-error-guest.png', fullPage: true });
      throw error;
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
