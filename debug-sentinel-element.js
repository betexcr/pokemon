const { chromium } = require('playwright');

async function debugSentinelElement() {
  console.log('🔍 Debugging sentinel element...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Page loaded, checking sentinel element...');
    
    // Check for sentinel elements
    const sentinels = await page.locator('[data-infinite-scroll-sentinel="true"]');
    const sentinelCount = await sentinels.count();
    console.log(`🎯 Found ${sentinelCount} sentinel elements`);
    
    if (sentinelCount > 0) {
      const sentinel = sentinels.first();
      
      // Check sentinel properties
      const isVisible = await sentinel.isVisible();
      const boundingBox = await sentinel.boundingBox();
      
      console.log(`👁️ Sentinel visible: ${isVisible}`);
      console.log(`📍 Sentinel position:`, boundingBox);
      
      // Check page dimensions
      const pageHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = await page.evaluate(() => window.innerHeight);
      console.log(`📏 Page height: ${pageHeight}, Viewport height: ${viewportHeight}`);
      
      // Check if sentinel is at the bottom
      if (boundingBox) {
        const sentinelBottom = boundingBox.y + boundingBox.height;
        console.log(`📍 Sentinel bottom position: ${sentinelBottom}`);
        console.log(`📍 Page bottom: ${pageHeight}`);
        console.log(`📍 Distance from page bottom: ${pageHeight - sentinelBottom}`);
      }
      
      // Try to manually trigger intersection
      console.log('🧪 Trying to manually trigger intersection...');
      await page.evaluate(() => {
        const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
        if (sentinel) {
          console.log('🎯 Sentinel found, creating manual observer...');
          const observer = new IntersectionObserver((entries) => {
            console.log('🔍 Manual observer triggered:', entries);
            entries.forEach(entry => {
              console.log('📊 Intersection entry:', {
                isIntersecting: entry.isIntersecting,
                intersectionRatio: entry.intersectionRatio,
                boundingClientRect: entry.boundingClientRect,
                rootBounds: entry.rootBounds
              });
            });
          }, {
            root: null,
            rootMargin: '200px',
            threshold: 0.1
          });
          observer.observe(sentinel);
          
          // Also try to scroll the sentinel into view
          sentinel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          console.log('❌ No sentinel found');
        }
      });
      
      await page.waitForTimeout(3000);
      
      // Try scrolling to the very bottom
      console.log('📜 Scrolling to very bottom...');
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(2000);
      
      // Check Pokemon count
      const pokemonCount = await page.locator('[data-pokemon-id]').count();
      console.log(`🎯 Pokemon count after scrolls: ${pokemonCount}`);
    }
    
    // Check console for any logs
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && (
        msg.text().includes('Sentinel') || 
        msg.text().includes('observer') ||
        msg.text().includes('intersection')
      )) {
        consoleLogs.push(`📝 ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(2000);
    
    console.log('\n📝 Sentinel-related console logs:');
    consoleLogs.forEach(log => console.log(log));
    
  } catch (error) {
    console.error('❌ Error during sentinel debug:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

debugSentinelElement().catch(console.error);
