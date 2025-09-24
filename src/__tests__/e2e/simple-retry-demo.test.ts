import { test, expect, Page } from '@playwright/test';

test.describe('Simple Retry System Demo', () => {
  test('Demonstrate retry system by navigating to battle page', async ({ page }) => {
    console.log('🔄 Starting Simple Retry System Demo');
    
    // Monitor console messages for retry-related logs
    const retryMessages: string[] = [];
    const battleMessages: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('retry') || text.includes('Retry') || text.includes('attempt') || text.includes('DynamicRetry')) {
        retryMessages.push(text);
        console.log(`🔄 Retry: ${text}`);
      }
      if (text.includes('battle') || text.includes('Battle')) {
        battleMessages.push(text);
        console.log(`⚔️ Battle: ${text}`);
      }
    });
    
    // Navigate to battle runtime page (this should trigger our retry system)
    console.log('🌐 Navigating to battle runtime page...');
    await page.goto('/battle/runtime?battleId=test-battle-123&host=true');
    
    // Wait for page to load and potentially trigger retries
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more to capture any retry messages
    await page.waitForTimeout(5000);
    
    // Check what we captured
    console.log(`📊 Captured ${retryMessages.length} retry messages:`);
    retryMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
    
    console.log(`📊 Captured ${battleMessages.length} battle messages:`);
    battleMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
    
    // Verify page loaded successfully
    const title = await page.title();
    expect(title).toBeTruthy();
    console.log(`✅ Page title: ${title}`);
    
    // Check if page is responsive
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('🎉 Simple retry system demo completed successfully!');
  });
  
  test('Test retry system with invalid battle ID', async ({ page }) => {
    console.log('🔄 Testing retry system with invalid battle ID');
    
    const retryMessages: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('retry') || text.includes('Retry') || text.includes('attempt') || text.includes('DynamicRetry')) {
        retryMessages.push(text);
        console.log(`🔄 Retry: ${text}`);
      }
    });
    
    // Navigate to battle page with invalid ID (should trigger retries)
    await page.goto('/battle/runtime?battleId=invalid-battle-id&host=true');
    
    // Wait for retries to happen
    await page.waitForTimeout(10000);
    
    console.log(`📊 Captured ${retryMessages.length} retry messages with invalid ID:`);
    retryMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
    
    // Page should still load (even if battle fails)
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✅ Invalid battle ID test completed');
  });
});
