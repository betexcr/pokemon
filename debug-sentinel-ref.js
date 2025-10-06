const { chromium } = require('playwright');

async function debugSentinelRef() {
  console.log('🔍 Debugging sentinel ref attachment...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000); // Wait for component to render
    
    console.log('📍 Page loaded, checking sentinel ref...');
    
    // Check if sentinel has ref attached
    const sentinelRefCheck = await page.evaluate(() => {
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      if (sentinel) {
        // Check if the element has React ref attached
        const hasReactRef = !!(sentinel._reactInternalFiber || sentinel._reactInternalInstance || sentinel.__reactInternalInstance);
        
        // Try to manually attach an intersection observer
        const observer = new IntersectionObserver((entries) => {
          console.log('🔍 Manual observer triggered:', entries[0].isIntersecting);
        }, {
          root: null,
          rootMargin: '200px',
          threshold: 0.1
        });
        
        observer.observe(sentinel);
        
        return {
          hasReactRef,
          sentinelElement: sentinel,
          observerAttached: true
        };
      }
      return null;
    });
    
    console.log('🎯 Sentinel ref check:', sentinelRefCheck);
    
    // Scroll to trigger intersection
    console.log('📜 Scrolling to trigger intersection...');
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(2000);
    
    // Check console logs
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('Manual observer')) {
        consoleLogs.push(`📝 ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(2000);
    
    console.log('\n📝 Manual observer logs:');
    consoleLogs.forEach(log => console.log(log));
    
    // Try to manually call the loadMorePokemon function
    console.log('\n🧪 Trying to manually trigger loadMorePokemon...');
    const manualLoadTest = await page.evaluate(() => {
      // Look for the loadMorePokemon function in the global scope or window
      if (window.loadMorePokemon) {
        console.log('🎯 Found loadMorePokemon in window, calling it...');
        window.loadMorePokemon();
        return { success: true };
      } else {
        console.log('❌ loadMorePokemon not found in window');
        return { success: false };
      }
    });
    
    console.log('🧪 Manual load test:', manualLoadTest);
    
    // Check Pokemon count after manual test
    const pokemonCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Pokemon count after manual test: ${pokemonCount}`);
    
  } catch (error) {
    console.error('❌ Error during sentinel ref debug:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

debugSentinelRef().catch(console.error);



