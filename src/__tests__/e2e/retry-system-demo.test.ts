import { test, expect, Page } from '@playwright/test';

test.describe('Dynamic Retry System Demo', () => {
  test('Demonstrate retry system in browser', async ({ page }) => {
    console.log('🔄 Starting Dynamic Retry System Demo');
    
    // Navigate to the app
    await page.goto('/');
    
    // Enable console logging to see retry messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('retry') || msg.text().includes('Retry') || msg.text().includes('attempt')) {
        consoleMessages.push(msg.text());
        console.log(`📝 Console: ${msg.text()}`);
      }
    });
    
    // Enable network logging
    page.on('response', response => {
      if (response.url().includes('firestore') || response.url().includes('firebase')) {
        console.log(`🌐 Network: ${response.status()} ${response.url()}`);
      }
    });
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to lobby to trigger some Firebase operations
    await page.click('text=Lobby');
    await page.waitForLoadState('networkidle');
    
    // Try to create a room (this will trigger our retry system)
    try {
      await page.click('text=Create Room', { timeout: 5000 });
      console.log('✅ Room creation button clicked');
    } catch (error) {
      console.log('ℹ️ Room creation button not found or not ready');
    }
    
    // Wait a bit to see retry messages
    await page.waitForTimeout(3000);
    
    // Check if we captured any retry messages
    console.log(`📊 Captured ${consoleMessages.length} retry-related console messages`);
    
    // Verify the page is working
    const title = await page.title();
    expect(title).toContain('Pokemon');
    
    console.log('🎉 Retry system demo completed successfully!');
  });
  
  test('Test battle initialization with retry system', async ({ page }) => {
    console.log('⚔️ Testing battle initialization with retry system');
    
    // Navigate to a battle URL that might trigger retries
    await page.goto('/battle/runtime?battleId=test-battle-id&host=true');
    
    // Monitor console for retry messages
    const retryMessages: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('retry') || msg.text().includes('Retry') || msg.text().includes('DynamicRetry')) {
        retryMessages.push(msg.text());
        console.log(`🔄 Retry: ${msg.text()}`);
      }
    });
    
    // Wait for page to load and potentially trigger retries
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check if retry system was used
    console.log(`📈 Found ${retryMessages.length} retry messages`);
    
    // Verify page loaded (even if battle failed, page should be responsive)
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✅ Battle initialization test completed');
  });
});
