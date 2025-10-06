const { chromium } = require('playwright');

async function test503ErrorHandling() {
  console.log('🚀 Testing 503 error handling...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    if (msg.text().includes('❌') || msg.text().includes('🔄') || msg.text().includes('503') || msg.text().includes('fallback')) {
      console.log('🔍 Console:', msg.text());
    }
  });
  
  try {
    console.log('📱 Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('⏳ Waiting for initial load...');
    await page.waitForTimeout(3000);
    
    // Check if Pokemon are loading
    const initialCount = await page.locator('[data-pokemon-id]').count();
    console.log(`📊 Initial Pokemon count: ${initialCount}`);
    
    // Scroll to trigger more Pokemon loading
    console.log('📜 Scrolling to trigger Pokemon loading...');
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = 1000;
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Check for fallback Pokemon (those with pokemon- prefix in name)
    const fallbackCount = await page.locator('[data-pokemon-id]').evaluateAll(elements => {
      return elements.filter(el => {
        const card = el.closest('[data-pokemon-id]');
        if (!card) return false;
        
        // Look for fallback Pokemon indicators
        const hasFallbackName = card.textContent?.includes('pokemon-');
        const hasNoTypes = !card.querySelector('[class*="type-"]');
        
        return hasFallbackName || hasNoTypes;
      }).length;
    });
    
    console.log(`🔄 Fallback Pokemon count: ${fallbackCount}`);
    
    // Check for error messages in the UI
    const errorMessages = await page.locator('text=/503|error|failed/i').count();
    console.log(`❌ Error messages in UI: ${errorMessages}`);
    
    // Test retry functionality
    console.log('🔄 Testing retry functionality...');
    await page.evaluate(() => {
      // Simulate API recovery by calling retry
      if (window.viewportLoaderRef && window.viewportLoaderRef.current) {
        window.viewportLoaderRef.current.retryFailedPokemon();
      }
    });
    
    await page.waitForTimeout(3000);
    
    console.log('✅ 503 error handling test completed');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

test503ErrorHandling();


