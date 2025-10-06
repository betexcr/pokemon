const { chromium } = require('playwright');

async function testManualLoad() {
  console.log('🧪 Testing manual loadMorePokemon function...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Page loaded, testing manual load...');
    
    // Monitor console logs
    const loadingLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Loading more Pokemon') || 
          text.includes('Loaded') ||
          text.includes('offset=') ||
          text.includes('Sentinel triggered')) {
        loadingLogs.push(`[${msg.type()}] ${text}`);
      }
    });
    
    // Check initial Pokemon count
    let pokemonCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Initial Pokemon count: ${pokemonCount}`);
    
    // Try to manually trigger loadMorePokemon by calling it directly
    console.log('🧪 Attempting to manually trigger loadMorePokemon...');
    const manualTriggerResult = await page.evaluate(() => {
      // Try to find the loadMorePokemon function in the React component
      const reactRoot = document.querySelector('#__next');
      if (reactRoot && reactRoot._reactInternalFiber) {
        console.log('🎯 Found React root');
        return { success: true, foundReact: true };
      }
      
      // Try to dispatch a custom event
      const event = new CustomEvent('manualLoadMore');
      document.dispatchEvent(event);
      console.log('🎯 Dispatched manual load event');
      return { success: true, dispatchedEvent: true };
    });
    
    console.log('🧪 Manual trigger result:', manualTriggerResult);
    
    // Wait for any loading to complete
    await page.waitForTimeout(3000);
    
    // Check Pokemon count after manual trigger
    const newPokemonCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Pokemon count after manual trigger: ${newPokemonCount}`);
    
    // Try to manually call the intersection observer
    console.log('🧪 Trying to manually trigger intersection observer...');
    const intersectionTriggerResult = await page.evaluate(() => {
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      if (sentinel) {
        // Create a fake intersection entry
        const fakeEntry = {
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: sentinel.getBoundingClientRect(),
          rootBounds: null,
          target: sentinel
        };
        
        // Try to find and call the intersection observer callback
        console.log('🎯 Found sentinel, trying to trigger intersection...');
        
        // Dispatch a custom event that the intersection observer might listen for
        const intersectionEvent = new CustomEvent('intersection', { detail: fakeEntry });
        sentinel.dispatchEvent(intersectionEvent);
        
        return { success: true, foundSentinel: true };
      }
      return { success: false, error: 'No sentinel found' };
    });
    
    console.log('🧪 Intersection trigger result:', intersectionTriggerResult);
    
    // Wait for any loading to complete
    await page.waitForTimeout(3000);
    
    // Check Pokemon count after intersection trigger
    const finalPokemonCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Final Pokemon count: ${finalPokemonCount}`);
    
    // Show loading logs
    console.log('\n📝 Loading logs:');
    loadingLogs.forEach(log => console.log(log));
    
    // Results
    if (finalPokemonCount > pokemonCount) {
      console.log('🎉 SUCCESS: Pokemon count increased!');
    } else {
      console.log('❌ ISSUE: Pokemon count did not increase');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testManualLoad().catch(console.error);



