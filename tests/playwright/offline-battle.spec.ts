import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3002';

test.describe('Offline AI Battle', () => {
  test('full offline battle against champion works end-to-end', async ({ page }) => {
    // Seed a player team in localStorage before navigating
    const teamData = [
      { id: 6, level: 50, moves: [{ name: 'flamethrower' }, { name: 'air-slash' }, { name: 'dragon-pulse' }, { name: 'roost' }], nature: 'timid' },
      { id: 9, level: 50, moves: [{ name: 'surf' }, { name: 'ice-beam' }, { name: 'rapid-spin' }, { name: 'toxic' }], nature: 'bold' },
      { id: 3, level: 50, moves: [{ name: 'giga-drain' }, { name: 'sludge-bomb' }, { name: 'sleep-powder' }, { name: 'leech-seed' }], nature: 'calm' },
    ];

    // Navigate to a dummy page first so we can set localStorage
    await page.goto(`${BASE}/battle`);
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate((team) => {
      localStorage.setItem('pokemon-current-team', JSON.stringify(team));
    }, teamData);

    console.log('1. Team seeded in localStorage');

    // Capture console logs to debug errors
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
    });
    page.on('pageerror', err => {
      consoleLogs.push(`[pageerror] ${err.message}\n${err.stack}`);
      console.log('PAGE ERROR:', err.message, '\n', err.stack);
    });

    // Navigate directly to the battle runtime with AI battle parameters
    const battleUrl = `${BASE}/battle/runtime?battleId=offline-test-001&player=test-team&opponentKind=champion&opponentId=brock-kanto`;
    await page.goto(battleUrl);
    console.log('2. Navigated to battle runtime URL');

    // Wait for the battle UI to load - needs time for PokeAPI hydration
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Turn') || 
             document.body.innerText.includes('Preparing battle') ||
             document.body.innerText.includes('Battle error') ||
             document.body.innerText.includes('Loading battle');
    }, { timeout: 15_000 });

    // If still loading, wait for the actual battle UI
    const bodyNow = await page.locator('body').textContent();
    if (bodyNow?.includes('Loading battle') || bodyNow?.includes('Preparing battle')) {
      await page.waitForFunction(() => {
        return document.body.innerText.includes('Turn') || 
               document.body.innerText.includes('Battle error');
      }, { timeout: 90_000 });
    }

    // Check if there was an error
    const bodyText1 = await page.locator('body').textContent();
    if (bodyText1?.includes('Battle error')) {
      console.log('Battle error detected on page:', bodyText1);
      console.log('Console logs:', consoleLogs.join('\n'));
    }

    console.log('3. Battle page loaded');

    // Wait for actual battle UI (move buttons should appear)
    const moveButton = page.locator('button[data-testid^="move-"]').first();
    await moveButton.waitFor({ state: 'visible', timeout: 60_000 });

    console.log('4. Move buttons visible');

    // Check that we can see both Pokemon (text should include pokemon names)
    const bodyText = await page.locator('body').textContent();
    const hasTurnCounter = bodyText?.includes('Turn');
    console.log(`5. Turn counter visible: ${hasTurnCounter}`);
    expect(hasTurnCounter).toBe(true);

    // Check that "Your Pokemon" and opponent sections exist
    const hasYourPokemon = bodyText?.includes('Your Pokemon');
    console.log(`6. Your Pokemon section: ${hasYourPokemon}`);
    expect(hasYourPokemon).toBe(true);

    // Check HP bars are present
    const playerHpText = await page.locator('body').textContent();
    const hpPattern = /\d+\s*\/\s*\d+/;
    console.log(`7. HP values present: ${hpPattern.test(playerHpText || '')}`);

    // Take screenshot before first move
    await page.screenshot({ path: 'test-results/offline-battle-before-move.png' });

    // Click the first available move
    const firstMove = page.locator('button[data-testid^="move-"]').first();
    const moveName = await firstMove.getAttribute('data-testid');
    console.log(`8. Clicking move: ${moveName}`);
    await firstMove.click({ force: true });

    // Wait for the turn to resolve (turn counter should increment)
    await page.waitForFunction(() => {
      const body = document.body.innerText;
      return body.includes('Turn 2') || body.includes('Battle Over');
    }, { timeout: 30_000 });

    console.log('9. Turn resolved successfully!');

    // Take screenshot after first move
    await page.screenshot({ path: 'test-results/offline-battle-after-move.png' });

    // Verify the battle log has messages
    const bodyAfter = await page.locator('body').textContent();
    const hasUsedMessage = bodyAfter?.toLowerCase().includes('used') || bodyAfter?.toLowerCase().includes('turn 2');
    console.log(`10. Battle log has messages: ${hasUsedMessage}`);
    expect(hasUsedMessage).toBe(true);

    // Play a few more turns
    for (let turn = 0; turn < 3; turn++) {
      const btn = page.locator('button[data-testid^="move-"]').first();
      const isVisible = await btn.isVisible().catch(() => false);
      if (!isVisible) {
        console.log(`Turn ${turn + 3}: Battle ended, no more moves to pick`);
        break;
      }
      await btn.click({ force: true });
      await page.waitForTimeout(2_000);
      console.log(`Turn ${turn + 3}: Move executed`);
    }

    // Take final screenshot
    await page.screenshot({ path: 'test-results/offline-battle-final.png' });

    // The battle should still be running or completed
    const finalBody = await page.locator('body').textContent();
    const battleActive = finalBody?.includes('Turn') || finalBody?.includes('Battle Over') || finalBody?.includes('won');
    console.log(`11. Battle still active or completed: ${battleActive}`);
    expect(battleActive).toBe(true);

    console.log('✅ Offline AI battle test complete');
  });
});
