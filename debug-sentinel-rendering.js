const { chromium } = require('playwright');

async function debugSentinelRendering() {
  console.log('🔍 Debugging sentinel element rendering...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Page loaded, checking sentinel rendering...');
    
    // Check if sentinel element exists in DOM
    const sentinelExists = await page.evaluate(() => {
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      return {
        exists: !!sentinel,
        visible: sentinel ? sentinel.offsetParent !== null : false,
        position: sentinel ? {
          x: sentinel.offsetLeft,
          y: sentinel.offsetTop,
          width: sentinel.offsetWidth,
          height: sentinel.offsetHeight
        } : null,
        computedStyle: sentinel ? window.getComputedStyle(sentinel) : null
      };
    });
    
    console.log('🎯 Sentinel element check:', sentinelExists);
    
    // Check Pokemon count
    const pokemonCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Pokemon count: ${pokemonCount}`);
    
    // Check if there are multiple sentinel elements
    const sentinelCount = await page.locator('[data-infinite-scroll-sentinel="true"]').count();
    console.log(`🎯 Total sentinel elements: ${sentinelCount}`);
    
    // Check if the sentinel has the ref attached
    const sentinelRefAttached = await page.evaluate(() => {
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      if (sentinel) {
        // Check if the element has any event listeners or if it's being observed
        const hasRef = sentinel.getAttribute('ref') || sentinel._reactInternalFiber || sentinel._reactInternalInstance;
        return {
          hasRef: !!hasRef,
          className: sentinel.className,
          style: sentinel.style.cssText,
          parentElement: sentinel.parentElement ? sentinel.parentElement.tagName : null
        };
      }
      return null;
    });
    
    console.log('🔗 Sentinel ref attachment:', sentinelRefAttached);
    
    // Try to manually create an intersection observer to test
    const manualObserverTest = await page.evaluate(() => {
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      if (sentinel) {
        console.log('🧪 Creating manual intersection observer...');
        const observer = new IntersectionObserver((entries) => {
          console.log('🔍 Manual observer triggered:', entries);
          entries.forEach(entry => {
            console.log('📊 Entry details:', {
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
        console.log('✅ Manual observer created and attached');
        
        // Try to scroll the sentinel into view
        sentinel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        return { success: true };
      }
      return { success: false, error: 'No sentinel found' };
    });
    
    console.log('🧪 Manual observer test:', manualObserverTest);
    
    // Wait for any intersection events
    await page.waitForTimeout(3000);
    
    // Check console for intersection events
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && (
        msg.text().includes('Manual observer') ||
        msg.text().includes('intersection') ||
        msg.text().includes('Entry details')
      )) {
        consoleLogs.push(`📝 ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(2000);
    
    console.log('\n📝 Manual observer logs:');
    consoleLogs.forEach(log => console.log(log));
    
  } catch (error) {
    console.error('❌ Error during sentinel rendering debug:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

debugSentinelRendering().catch(console.error);



