const { chromium } = require('playwright');

async function extendedScrollTest() {
  console.log('🚀 Starting extended scroll test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50
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
    
    let currentCount = await page.locator('[data-pokemon-id]').count();
    console.log(`📊 Initial Pokemon count: ${currentCount}`);
    
    let scrollAttempts = 0;
    const maxScrollAttempts = 20;
    let lastCount = 0;
    let stableCount = 0;
    
    while (scrollAttempts < maxScrollAttempts && currentCount < 1000) {
      console.log(`\n🔄 Scroll attempt ${scrollAttempts + 1}/${maxScrollAttempts}`);
      
      // Scroll to bottom
      await page.evaluate(() => {
        const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      });
      
      // Wait for loading
      await page.waitForTimeout(3000);
      
      // Check new count
      const newCount = await page.locator('[data-pokemon-id]').count();
      console.log(`📊 Pokemon count: ${newCount} (${newCount - currentCount} new)`);
      
      if (newCount === currentCount) {
        stableCount++;
        console.log(`⚠️  Count unchanged (${stableCount}/3)`);
        if (stableCount >= 3) {
          console.log('🛑 Count stable for 3 attempts, stopping...');
          break;
        }
      } else {
        stableCount = 0;
        currentCount = newCount;
      }
      
      scrollAttempts++;
      
      // Check if we reached a good number
      if (currentCount >= 1000) {
        console.log('🎉 Reached 1000+ Pokemon!');
        break;
      }
    }
    
    console.log(`\n📊 Final Pokemon count: ${currentCount}`);
    console.log(`🔄 Total scroll attempts: ${scrollAttempts}`);
    
    if (currentCount >= 1000) {
      console.log('✅ SUCCESS: Reached 1000+ Pokemon! Infinite scroll is working well!');
    } else if (currentCount >= 500) {
      console.log('⚠️  PARTIAL SUCCESS: Loaded 500+ Pokemon, but not 1000+');
    } else {
      console.log('❌ FAILURE: Did not load enough Pokemon');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'extended-scroll-test.png' });
    console.log('📸 Screenshot saved as extended-scroll-test.png');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

extendedScrollTest();



