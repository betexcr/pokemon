const { chromium } = require('playwright');

async function comprehensiveTest() {
  console.log('🚀 Comprehensive test of Pokemon list scrolling...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the Pokemon app
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    let currentCount = 0;
    let previousCount = 0;
    let scrollAttempts = 0;
    const maxAttempts = 20;
    const targetCount = 1200; // Aim for 1200+ Pokemon
    
    console.log('📊 Starting scroll test...');
    
    while (scrollAttempts < maxAttempts && currentCount < targetCount) {
      // Count current Pokemon
      currentCount = await page.locator('[data-pokemon-id]').count();
      console.log(`📊 Attempt ${scrollAttempts + 1}: ${currentCount} Pokemon cards`);
      
      // If we haven't loaded more Pokemon in 2 attempts, try scrolling more aggressively
      if (currentCount === previousCount && scrollAttempts > 2) {
        console.log('🔄 Count unchanged, trying aggressive scroll...');
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
          // Also try scrolling the main container
          const container = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
        await page.waitForTimeout(1000);
      }
      
      // Regular scroll
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1500); // Wait for loading
      
      previousCount = currentCount;
      scrollAttempts++;
      
      // Check for loading indicators
      const loadingCount = await page.locator('.animate-spin').count();
      if (loadingCount > 0) {
        console.log(`⏳ Loading ${loadingCount} items...`);
        await page.waitForTimeout(2000); // Wait longer if loading
      }
    }
    
    // Final count
    const finalCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Final Pokemon count: ${finalCount}`);
    
    // Check how many have loaded data vs skeletons
    const cardsWithTypes = await page.locator('[data-pokemon-id] .type-badge').count();
    const skeletonCards = await page.locator('[data-pokemon-id] .animate-pulse').count();
    console.log(`🏷️ Cards with type badges: ${cardsWithTypes}`);
    console.log(`💀 Skeleton cards: ${skeletonCards}`);
    
    // Check for special forms section
    const specialFormsHeader = await page.locator('text=Special Forms & Variants').count();
    console.log(`⭐ Special forms section: ${specialFormsHeader > 0 ? 'Found' : 'Not found'}`);
    
    // Take final screenshot
    await page.screenshot({ path: 'comprehensive-test-final.png' });
    console.log('📸 Final screenshot saved: comprehensive-test-final.png');
    
    // Results
    if (finalCount >= 1200) {
      console.log('🎉 SUCCESS: Reached 1200+ Pokemon!');
      console.log('✅ Infinite scroll is working perfectly!');
    } else if (finalCount >= 1000) {
      console.log('✅ SUCCESS: Reached 1000+ Pokemon!');
      console.log('✅ Infinite scroll is working well!');
    } else if (finalCount >= 800) {
      console.log('⚠️ PARTIAL: Reached 800+ Pokemon');
      console.log('⚠️ May need more scrolling or there might be an issue');
    } else {
      console.log('❌ ISSUE: Only reached ' + finalCount + ' Pokemon');
      console.log('❌ Infinite scroll may not be working properly');
    }
    
    // Test scrolling back up
    console.log('📜 Testing scroll back up...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    
    const topCards = await page.locator('[data-pokemon-id]').first().count();
    console.log(`🔝 Top cards visible: ${topCards > 0 ? 'Yes' : 'No'}`);
    
    console.log('✅ Comprehensive test completed!');
    
  } catch (error) {
    console.error('❌ Error during comprehensive test:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

comprehensiveTest().catch(console.error);



