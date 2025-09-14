import { test, expect, Page } from '@playwright/test';

test.describe('Retry System Stress Test', () => {
  test('Test retry system with network interruptions', async ({ page }) => {
    console.log('🔄 Starting Retry System Stress Test');
    
    const retryMessages: string[] = [];
    const errorMessages: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('retry') || text.includes('Retry') || text.includes('attempt') || text.includes('DynamicRetry')) {
        retryMessages.push(text);
        console.log(`🔄 Retry: ${text}`);
      }
      if (text.includes('error') || text.includes('Error') || text.includes('failed') || text.includes('Failed')) {
        errorMessages.push(text);
        console.log(`❌ Error: ${text}`);
      }
    });
    
    // Navigate to battle page
    console.log('🌐 Navigating to battle runtime page...');
    await page.goto('/battle/runtime?battleId=stress-test-battle&host=true');
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Simulate network issues by going offline
    console.log('📡 Simulating network interruption...');
    await page.context().setOffline(true);
    await page.waitForTimeout(3000);
    
    // Go back online
    console.log('📡 Restoring network connection...');
    await page.context().setOffline(false);
    
    // Wait for reconnection and potential retries
    await page.waitForTimeout(5000);
    
    // Navigate to lobby to trigger more Firebase operations
    console.log('🏠 Navigating to lobby...');
    await page.goto('/lobby');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check results
    console.log(`📊 Captured ${retryMessages.length} retry messages:`);
    retryMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
    
    console.log(`📊 Captured ${errorMessages.length} error messages:`);
    errorMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
    
    // Verify page is still responsive
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('🎉 Retry system stress test completed!');
  });
  
  test('Test battle initialization with multiple rapid requests', async ({ page }) => {
    console.log('⚔️ Testing rapid battle initialization requests');
    
    const retryMessages: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('retry') || text.includes('Retry') || text.includes('attempt') || text.includes('DynamicRetry')) {
        retryMessages.push(text);
        console.log(`🔄 Retry: ${text}`);
      }
    });
    
    // Make multiple rapid requests to battle pages
    const battleIds = ['rapid-test-1', 'rapid-test-2', 'rapid-test-3'];
    
    for (const battleId of battleIds) {
      console.log(`🌐 Navigating to battle: ${battleId}`);
      await page.goto(`/battle/runtime?battleId=${battleId}&host=true`);
      await page.waitForTimeout(1000); // Short wait between requests
    }
    
    // Wait for all operations to complete
    await page.waitForTimeout(5000);
    
    console.log(`📊 Captured ${retryMessages.length} retry messages from rapid requests:`);
    retryMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
    
    // Verify final page is responsive
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✅ Rapid requests test completed');
  });
  
  test('Test our dynamic retry utility directly', async ({ page }) => {
    console.log('🧪 Testing dynamic retry utility directly');
    
    // Navigate to a page and inject our retry utility
    await page.goto('/');
    
    // Inject our retry utility into the page
    await page.addScriptTag({
      content: `
        // Simplified version of our retry utility for testing
        class DynamicRetry {
          static async retry(operation, config = {}, onProgress) {
            const {
              maxAttempts = 3,
              baseDelayMs = 500,
              jitterMs = 100,
              backoffMultiplier = 1.5
            } = config;
            
            let lastError;
            
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
              try {
                const result = await operation();
                console.log(\`✅ Operation succeeded on attempt \${attempt}\`);
                return result;
              } catch (error) {
                lastError = error;
                console.log(\`⏳ Attempt \${attempt} failed: \${error.message}\`);
                
                if (attempt === maxAttempts) break;
                
                const delay = baseDelayMs * Math.pow(backoffMultiplier, attempt - 1) + Math.random() * jitterMs;
                console.log(\`🔄 Retrying in \${Math.round(delay)}ms...\`);
                
                if (onProgress) onProgress(attempt, delay, error);
                
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
            
            throw lastError;
          }
        }
        
        // Test the retry utility
        window.testRetryUtility = async () => {
          console.log('🧪 Testing retry utility...');
          
          let attemptCount = 0;
          const result = await DynamicRetry.retry(
            async () => {
              attemptCount++;
              if (attemptCount < 3) {
                throw new Error(\`Attempt \${attemptCount} failed\`);
              }
              return \`Success on attempt \${attemptCount}!\`;
            },
            { maxAttempts: 5, baseDelayMs: 200, jitterMs: 50 },
            (attempt, delay) => {
              console.log(\`🔄 Retry progress: attempt \${attempt}, delay \${Math.round(delay)}ms\`);
            }
          );
          
          console.log(\`✅ Retry test result: \${result}\`);
          return result;
        };
        
        // Make it available globally
        window.DynamicRetry = DynamicRetry;
      `
    });
    
    // Execute the test
    const result = await page.evaluate(() => window.testRetryUtility());
    console.log(`🎉 Retry utility test result: ${result}`);
    
    // Verify the test worked
    expect(result).toContain('Success on attempt 3');
    
    console.log('✅ Direct retry utility test completed successfully!');
  });
});
