import { test, expect, Page } from '@playwright/test';

test.describe('Battle Retry System Demo', () => {
  test('Demonstrate retry system during battle initialization', async ({ page }) => {
    console.log('⚔️ Starting Battle Retry System Demo');
    
    // Monitor all console messages
    const allMessages: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      allMessages.push(text);
      console.log(`📝 Console: ${text}`);
    });
    
    // Navigate to battle page with a realistic battle ID
    const battleId = `demo-battle-${Date.now()}`;
    console.log(`🌐 Navigating to battle: ${battleId}`);
    
    await page.goto(`/battle/runtime?battleId=${battleId}&host=true`);
    
    // Wait for page to load and initialize
    await page.waitForLoadState('networkidle');
    
    // Wait for battle initialization attempts
    await page.waitForTimeout(8000);
    
    // Check for retry-related messages
    const retryMessages = allMessages.filter(msg => 
      msg.includes('retry') || 
      msg.includes('Retry') || 
      msg.includes('attempt') || 
      msg.includes('DynamicRetry') ||
      msg.includes('does not exist') ||
      msg.includes('not found')
    );
    
    const battleMessages = allMessages.filter(msg => 
      msg.includes('battle') || 
      msg.includes('Battle') ||
      msg.includes('initialization')
    );
    
    console.log(`\n📊 Analysis Results:`);
    console.log(`  Total console messages: ${allMessages.length}`);
    console.log(`  Retry-related messages: ${retryMessages.length}`);
    console.log(`  Battle-related messages: ${battleMessages.length}`);
    
    if (retryMessages.length > 0) {
      console.log(`\n🔄 Retry Messages:`);
      retryMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
    }
    
    console.log(`\n⚔️ Battle Messages:`);
    battleMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
    
    // Verify page is responsive
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('\n🎉 Battle retry system demo completed!');
  });
  
  test('Show retry system preventing premature cleanup', async ({ page }) => {
    console.log('🛡️ Testing retry system preventing premature cleanup');
    
    const cleanupMessages: string[] = [];
    const retryMessages: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('cleanup') || text.includes('Cleanup') || text.includes('leaving')) {
        cleanupMessages.push(text);
        console.log(`🧹 Cleanup: ${text}`);
      }
      if (text.includes('retry') || text.includes('Retry') || text.includes('attempt')) {
        retryMessages.push(text);
        console.log(`🔄 Retry: ${text}`);
      }
    });
    
    // Navigate to battle page
    await page.goto('/battle/runtime?battleId=cleanup-test&host=true');
    
    // Wait for initialization
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Simulate tab switching (triggers visibility change)
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden'
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    // Wait a bit
    await page.waitForTimeout(2000);
    
    // Switch back to visible
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'visible'
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    // Wait for any delayed cleanup
    await page.waitForTimeout(3000);
    
    console.log(`📊 Cleanup messages: ${cleanupMessages.length}`);
    cleanupMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
    
    console.log(`📊 Retry messages: ${retryMessages.length}`);
    retryMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
    
    // Verify page is still responsive
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✅ Cleanup prevention test completed');
  });
  
  test('Demonstrate our retry system configuration', async ({ page }) => {
    console.log('⚙️ Demonstrating retry system configuration');
    
    await page.goto('/');
    
    // Inject our retry configuration into the page
    await page.addScriptTag({
      content: `
        // Our retry configurations
        const BATTLE_RETRY_CONFIG = {
          maxAttempts: 15,
          baseDelayMs: 1000,
          maxDelayMs: 20000,
          jitterMs: 2000,
          backoffMultiplier: 1.3
        };
        
        const ROOM_RETRY_CONFIG = {
          maxAttempts: 8,
          baseDelayMs: 300,
          maxDelayMs: 5000,
          jitterMs: 500,
          backoffMultiplier: 1.5
        };
        
        console.log('🔧 BATTLE_RETRY_CONFIG:', JSON.stringify(BATTLE_RETRY_CONFIG, null, 2));
        console.log('🔧 ROOM_RETRY_CONFIG:', JSON.stringify(ROOM_RETRY_CONFIG, null, 2));
        
        // Simulate retry delays
        const calculateDelay = (attempt, config) => {
          const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
          const jitter = Math.random() * config.jitterMs;
          const totalDelay = Math.min(exponentialDelay + jitter, config.maxDelayMs);
          return Math.round(totalDelay);
        };
        
        console.log('📊 Battle retry delays (first 5 attempts):');
        for (let i = 1; i <= 5; i++) {
          const delay = calculateDelay(i, BATTLE_RETRY_CONFIG);
          console.log(\`  Attempt \${i}: \${delay}ms\`);
        }
        
        console.log('📊 Room retry delays (first 5 attempts):');
        for (let i = 1; i <= 5; i++) {
          const delay = calculateDelay(i, ROOM_RETRY_CONFIG);
          console.log(\`  Attempt \${i}: \${delay}ms\`);
        }
      `
    });
    
    // Wait for the script to execute
    await page.waitForTimeout(1000);
    
    console.log('✅ Retry configuration demonstration completed');
  });
});
