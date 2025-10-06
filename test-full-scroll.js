const { chromium } = require('playwright');

async function testFullScroll() {
  console.log('🚀 Testing full scroll to reach all 1000+ Pokemon...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the Pokemon app
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    let previousCount = 0;
    let currentCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 15; // Allow up to 15 scroll attempts
    
    while (scrollAttempts < maxScrollAttempts) {
      // Count current Pokemon cards
      currentCount = await page.locator('[data-pokemon-id]').count();
      console.log(`📊 Scroll attempt ${scrollAttempts + 1}: ${currentCount} Pokemon cards`);
      
      // If count didn't change, we might have reached the end
      if (currentCount === previousCount && scrollAttempts > 0) {
        console.log('🛑 Pokemon count unchanged, checking if we reached the end...');
        break;
      }
      
      previousCount = currentCount;
      
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Wait for loading
      await page.waitForTimeout(2000);
      
      scrollAttempts++;
    }
    
    // Final count
    const finalCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Final Pokemon count: ${finalCount}`);
    
    // Check for loading indicators
    const loadingIndicators = await page.locator('.animate-spin').count();
    console.log(`⏳ Loading indicators: ${loadingIndicators}`);
    
    // Check how many cards have loaded data vs skeletons
    const cardsWithTypes = await page.locator('[data-pokemon-id] .type-badge').count();
    const skeletonCards = await page.locator('[data-pokemon-id] .animate-pulse').count();
    console.log(`🏷️ Cards with type badges: ${cardsWithTypes}`);
    console.log(`💀 Skeleton cards: ${skeletonCards}`);
    
    // Take final screenshot
    await page.screenshot({ path: 'final-scroll-test.png' });
    console.log('📸 Final screenshot saved: final-scroll-test.png');
    
    // Check if we reached a good number of Pokemon
    if (finalCount >= 1000) {
      console.log('✅ SUCCESS: Reached 1000+ Pokemon!');
    } else if (finalCount >= 800) {
      console.log('⚠️ PARTIAL: Reached 800+ Pokemon, may need more scrolling');
    } else {
      console.log('❌ ISSUE: Only reached ' + finalCount + ' Pokemon');
    }
    
    // Check console for any errors
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(`❌ ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(3000);
    
    if (consoleMessages.length > 0) {
      console.log('🐛 Console errors:');
      consoleMessages.forEach(msg => console.log(msg));
    }
    
  } catch (error) {
    console.error('❌ Error during full scroll test:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testFullScroll().catch(console.error);



