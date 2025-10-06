const { chromium } = require('playwright');

async function testInfiniteScrollFix() {
  console.log('🔧 Testing infinite scroll fix...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the Pokemon app
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Page loaded, testing infinite scroll...');
    
    let pokemonCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Initial Pokemon count: ${pokemonCount}`);
    
    // Monitor console for intersection observer logs
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Sentinel triggered') || 
          text.includes('Loading more Pokemon') || 
          text.includes('Loaded') ||
          text.includes('offset=')) {
        logs.push(`[${msg.type()}] ${text}`);
      }
    });
    
    // Try multiple scroll attempts to test infinite scroll
    for (let i = 0; i < 10; i++) {
      console.log(`📜 Scroll attempt ${i + 1}...`);
      
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      
      // Check count
      const newCount = await page.locator('[data-pokemon-id]').count();
      console.log(`🎯 Pokemon count: ${newCount}`);
      
      // If count didn't change, wait a bit more
      if (newCount === pokemonCount && i > 2) {
        console.log('⏳ Count unchanged, waiting for loading...');
        await page.waitForTimeout(3000);
        
        const finalCount = await page.locator('[data-pokemon-id]').count();
        if (finalCount === pokemonCount) {
          console.log('🛑 No more Pokemon loading, stopping test');
          break;
        }
      }
      
      pokemonCount = newCount;
      
      // Check for loading indicators
      const loadingCount = await page.locator('.animate-spin').count();
      if (loadingCount > 0) {
        console.log(`⏳ ${loadingCount} loading indicators visible`);
        await page.waitForTimeout(2000);
      }
    }
    
    // Final count
    const finalCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Final Pokemon count: ${finalCount}`);
    
    // Show console logs
    console.log('\n📝 Console logs:');
    logs.forEach(log => console.log(log));
    
    // Take screenshot
    await page.screenshot({ path: 'infinite-scroll-fix-test.png' });
    console.log('📸 Screenshot saved');
    
    // Results
    if (finalCount >= 1000) {
      console.log('🎉 SUCCESS: Reached 1000+ Pokemon!');
    } else if (finalCount >= 800) {
      console.log('✅ GOOD: Reached 800+ Pokemon');
    } else if (finalCount >= 600) {
      console.log('⚠️ PARTIAL: Reached 600+ Pokemon');
    } else {
      console.log('❌ ISSUE: Only reached ' + finalCount + ' Pokemon');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testInfiniteScrollFix().catch(console.error);



