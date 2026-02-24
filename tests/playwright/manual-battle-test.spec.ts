import { test, expect} from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3002';

test.describe('Direct Battle Test', () => {
  test('manually create and test battle', async ({ page }) => {
    console.log('\n=== Testing Battle Mechanics ===\n');

    // Navigate to home
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Wait a bit for page to settle
    await page.waitForTimeout(2000);
    
    console.log('Page loaded. Please manually:');
    console.log('1. Login with your credentials');
    console.log('2. Create teams via Team Builder');
    console.log('3. Go to Lobby and create/join a battle');
    console.log('4. Select moves and complete the battle');
    console.log('\nWaiting 5 minutes for manual testing...');
    
    // Wait a reasonable time for manual testing
    await page.waitForTimeout(300000); // 5 minutes
    
    console.log('Manual testing time complete');
  });
});
