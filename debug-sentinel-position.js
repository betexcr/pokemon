const { chromium } = require('playwright');

async function debugSentinelPosition() {
  console.log('🔍 Debugging sentinel position and scroll behavior...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Page loaded, checking sentinel position...');
    
    // Check sentinel position and page dimensions
    const positionCheck = await page.evaluate(() => {
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      const pageHeight = document.body.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollTop = window.pageYOffset;
      
      if (sentinel) {
        const rect = sentinel.getBoundingClientRect();
        const sentinelTop = rect.top + scrollTop;
        const sentinelBottom = sentinelTop + rect.height;
        
        return {
          sentinelExists: true,
          sentinelRect: rect,
          sentinelTop: sentinelTop,
          sentinelBottom: sentinelBottom,
          pageHeight: pageHeight,
          viewportHeight: viewportHeight,
          scrollTop: scrollTop,
          sentinelInViewport: rect.top >= 0 && rect.bottom <= viewportHeight,
          distanceFromBottom: pageHeight - sentinelBottom
        };
      }
      
      return { sentinelExists: false };
    });
    
    console.log('🎯 Position check:', positionCheck);
    
    // Try scrolling to different positions
    console.log('📜 Testing scroll positions...');
    
    const scrollTests = [
      { name: 'Scroll to 50%', position: 0.5 },
      { name: 'Scroll to 75%', position: 0.75 },
      { name: 'Scroll to 90%', position: 0.9 },
      { name: 'Scroll to 95%', position: 0.95 },
      { name: 'Scroll to 100%', position: 1.0 }
    ];
    
    for (const test of scrollTests) {
      console.log(`📜 ${test.name}...`);
      
      await page.evaluate((pos) => {
        const pageHeight = document.body.scrollHeight;
        const viewportHeight = window.innerHeight;
        const scrollTo = (pageHeight - viewportHeight) * pos;
        window.scrollTo(0, scrollTo);
      }, test.position);
      
      await page.waitForTimeout(2000);
      
      // Check if sentinel is now in viewport
      const inViewportCheck = await page.evaluate(() => {
        const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
        if (sentinel) {
          const rect = sentinel.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          return {
            inViewport: rect.top >= 0 && rect.bottom <= viewportHeight,
            rect: rect,
            scrollTop: window.pageYOffset
          };
        }
        return null;
      });
      
      console.log(`🎯 ${test.name} result:`, inViewportCheck);
      
      // Check Pokemon count
      const pokemonCount = await page.locator('[data-pokemon-id]').count();
      console.log(`🎯 Pokemon count: ${pokemonCount}`);
      
      if (inViewportCheck?.inViewport) {
        console.log('🎉 Sentinel is in viewport!');
        break;
      }
    }
    
    // Try to manually trigger intersection
    console.log('🧪 Trying to manually trigger intersection...');
    await page.evaluate(() => {
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      if (sentinel) {
        console.log('🎯 Manually scrolling sentinel into view...');
        sentinel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Final check
    const finalCheck = await page.evaluate(() => {
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      if (sentinel) {
        const rect = sentinel.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        return {
          inViewport: rect.top >= 0 && rect.bottom <= viewportHeight,
          rect: rect,
          scrollTop: window.pageYOffset
        };
      }
      return null;
    });
    
    console.log('🎯 Final check:', finalCheck);
    
    const finalPokemonCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Final Pokemon count: ${finalPokemonCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

debugSentinelPosition().catch(console.error);



