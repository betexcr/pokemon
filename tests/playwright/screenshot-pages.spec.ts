import { test } from '@playwright/test';
import * as path from 'path';

test.describe('Screenshot pages for validation', () => {
  test('homepage, lobby, team', async ({ page }) => {
    const outputDir = path.join(process.cwd(), 'test-results', 'screenshots');
    
    // Homepage
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(outputDir, '01-homepage.png'), fullPage: false });
    
    // Lobby
    await page.goto('http://localhost:3002/lobby');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(outputDir, '02-lobby.png'), fullPage: false });
    
    // Team
    await page.goto('http://localhost:3002/team');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(outputDir, '03-team.png'), fullPage: false });
  });
});
