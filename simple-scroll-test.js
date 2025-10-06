const { chromium } = require('playwright');

async function simpleScrollTest() {
  console.log('🚀 Starting simple scroll test...');
  
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
    
    // Check initial Pokemon count
    const initialCount = await page.locator('[data-testid="pokemon-card"]').count();
    console.log(`📊 Initial Pokemon count: ${initialCount}`);
    
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
    const finalCount = await page.locator('[data-testid="pokemon-card"]').count();
    console.log(`📊 Final Pokemon count: ${finalCount}`);
    
    // Check if sentinel exists
    const sentinel = await page.locator('[data-infinite-scroll-sentinel="true"]').count();
    console.log(`🎯 Sentinel elements found: ${sentinel}`);
    
    // Check for loading indicators
    const loadingIndicators = await page.locator('[data-testid="loading-skeleton"]').count();
    console.log(`⏳ Loading skeletons: ${loadingIndicators}`);
    
    if (finalCount > initialCount) {
      console.log('✅ SUCCESS: More Pokemon loaded!');
      console.log(`📈 Loaded ${finalCount - initialCount} additional Pokemon`);
    } else {
      console.log('❌ FAILURE: No additional Pokemon loaded');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'simple-scroll-test.png' });
    console.log('📸 Screenshot saved as simple-scroll-test.png');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

simpleScrollTest();


