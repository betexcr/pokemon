const { chromium } = require('playwright');

async function debugViewportLoading() {
  console.log('🚀 Starting viewport loading debug...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    if (msg.text().includes('🎯') || msg.text().includes('📦') || msg.text().includes('✅') || msg.text().includes('❌')) {
      console.log('🔍 Console:', msg.text());
    }
  });
  
  try {
    console.log('📱 Navigating to localhost:3001...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('⏳ Waiting for initial load...');
    await page.waitForTimeout(3000);
    
    // Check initial state
    const initialCount = await page.locator('[data-pokemon-id]').count();
    console.log(`📊 Initial Pokemon count: ${initialCount}`);
    
    // Scroll to trigger viewport loading
    console.log('📜 Scrolling to trigger viewport loading...');
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = 500; // Scroll down a bit
      }
    });
    
    // Wait for viewport loading to occur
    console.log('⏳ Waiting for viewport-based loading...');
    await page.waitForTimeout(3000);
    
    // Check if Pokemon are being loaded
    const skeletonCount = await page.locator('[data-pokemon-id]').evaluateAll(elements => {
      return elements.filter(el => {
        const card = el.closest('[data-pokemon-id]');
        if (!card) return false;
        
        const hasSkeleton = card.querySelector('.animate-pulse') || 
                           card.querySelector('[data-testid="loading-skeleton"]') ||
                           card.textContent?.includes('pokemon-');
        
        return hasSkeleton;
      }).length;
    });
    
    console.log(`💀 Skeleton Pokemon: ${skeletonCount}`);
    console.log(`✅ Loaded Pokemon: ${initialCount - skeletonCount}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-viewport-loading.png' });
    console.log('📸 Screenshot saved as debug-viewport-loading.png');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

debugViewportLoading();



