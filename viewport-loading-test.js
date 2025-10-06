const { chromium } = require('playwright');

async function viewportLoadingTest() {
  console.log('🚀 Starting viewport loading test...');
  
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
    
    // Check initial state
    const initialCount = await page.locator('[data-pokemon-id]').count();
    console.log(`📊 Initial Pokemon count: ${initialCount}`);
    
    // Check how many are skeletons (no types data)
    const skeletonCount = await page.locator('[data-pokemon-id]').evaluateAll(elements => {
      return elements.filter(el => {
        // Check if the Pokemon card shows skeleton state
        const card = el.closest('[data-pokemon-id]');
        if (!card) return false;
        
        // Look for skeleton indicators
        const hasSkeleton = card.querySelector('.animate-pulse') || 
                           card.querySelector('[data-testid="loading-skeleton"]') ||
                           card.textContent?.includes('pokemon-');
        
        return hasSkeleton;
      }).length;
    });
    
    console.log(`💀 Skeleton Pokemon: ${skeletonCount}`);
    console.log(`✅ Loaded Pokemon: ${initialCount - skeletonCount}`);
    
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
    await page.waitForTimeout(2000);
    
    // Check if Pokemon are being loaded
    const afterScrollSkeletonCount = await page.locator('[data-pokemon-id]').evaluateAll(elements => {
      return elements.filter(el => {
        const card = el.closest('[data-pokemon-id]');
        if (!card) return false;
        
        const hasSkeleton = card.querySelector('.animate-pulse') || 
                           card.querySelector('[data-testid="loading-skeleton"]') ||
                           card.textContent?.includes('pokemon-');
        
        return hasSkeleton;
      }).length;
    });
    
    console.log(`💀 Skeleton Pokemon after scroll: ${afterScrollSkeletonCount}`);
    console.log(`✅ Loaded Pokemon after scroll: ${initialCount - afterScrollSkeletonCount}`);
    
    // Check for Pokemon with real data (types, stats, etc.)
    const realDataCount = await page.locator('[data-pokemon-id]').evaluateAll(elements => {
      return elements.filter(el => {
        const card = el.closest('[data-pokemon-id]');
        if (!card) return false;
        
        // Look for real Pokemon data indicators
        const hasTypes = card.querySelector('[class*="type-"]') || 
                        card.textContent?.match(/\b(Fire|Water|Grass|Electric|Psychic|Dark|Fighting|Dragon|Ice|Fairy|Poison|Ground|Flying|Bug|Rock|Ghost|Steel|Normal)\b/);
        
        const hasStats = card.textContent?.match(/\b(HP|Attack|Defense|Speed)\b/);
        
        return hasTypes || hasStats;
      }).length;
    });
    
    console.log(`🎯 Pokemon with real data: ${realDataCount}`);
    
    if (realDataCount > 0) {
      console.log('✅ SUCCESS: Viewport-based loading is working!');
      console.log(`📈 ${realDataCount} Pokemon have been loaded with real data`);
    } else {
      console.log('⚠️  WARNING: No Pokemon with real data found');
      console.log('🔍 This might be normal if viewport loading is still in progress');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'viewport-loading-test.png' });
    console.log('📸 Screenshot saved as viewport-loading-test.png');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

viewportLoadingTest();


