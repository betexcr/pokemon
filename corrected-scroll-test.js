const { chromium } = require('playwright');

async function correctedScrollTest() {
  console.log('🚀 Starting corrected scroll test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('📱 Navigating to localhost:3001...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('⏳ Waiting for initial load...');
    await page.waitForTimeout(3000);
    
    // Check initial Pokemon count using correct selector
    const initialCount = await page.locator('[data-pokemon-id]').count();
    console.log(`📊 Initial Pokemon count: ${initialCount}`);
    
    // Check if sentinel exists
    const sentinel = await page.locator('[data-infinite-scroll-sentinel="true"]').count();
    console.log(`🎯 Sentinel elements found: ${sentinel}`);
    
    if (initialCount === 0) {
      console.log('❌ No Pokemon loaded initially, waiting longer...');
      await page.waitForTimeout(5000);
      const retryCount = await page.locator('[data-pokemon-id]').count();
      console.log(`📊 Retry Pokemon count: ${retryCount}`);
    }
    
    // Scroll to bottom
    console.log('📜 Scrolling to bottom...');
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    });
    
    // Wait for loading
    console.log('⏳ Waiting for more Pokemon to load...');
    await page.waitForTimeout(5000);
    
    // Check final count
    const finalCount = await page.locator('[data-pokemon-id]').count();
    console.log(`📊 Final Pokemon count: ${finalCount}`);
    
    // Check for loading indicators
    const loadingIndicators = await page.locator('.animate-pulse').count();
    console.log(`⏳ Loading skeletons: ${loadingIndicators}`);
    
    if (finalCount > initialCount) {
      console.log('✅ SUCCESS: More Pokemon loaded!');
      console.log(`📈 Loaded ${finalCount - initialCount} additional Pokemon`);
    } else if (finalCount === initialCount && finalCount > 0) {
      console.log('⚠️  WARNING: Same count, but Pokemon are present');
      console.log('🔍 Checking if we reached the end...');
      
      // Check if we're at the end by looking for "no more" indicators
      const hasMoreText = await page.textContent('body');
      const isAtEnd = hasMoreText.includes('No more') || hasMoreText.includes('End of list');
      console.log(`🏁 At end of list: ${isAtEnd}`);
    } else {
      console.log('❌ FAILURE: No Pokemon loaded');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'corrected-scroll-test.png' });
    console.log('📸 Screenshot saved as corrected-scroll-test.png');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

correctedScrollTest();



