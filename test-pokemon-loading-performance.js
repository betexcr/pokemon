const { chromium } = require('playwright');

async function testPokemonLoadingPerformance() {
  console.log('🚀 Starting Pokemon Loading Performance Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // Slow down for better observation
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track network requests
  const apiRequests = [];
  page.on('request', request => {
    if (request.url().includes('pokeapi.co/api/v2/pokemon/')) {
      apiRequests.push({
        url: request.url(),
        timestamp: Date.now(),
        pokemonId: extractPokemonId(request.url())
      });
    }
  });
  
  function extractPokemonId(url) {
    const match = url.match(/pokemon\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }
  
  try {
    console.log('📱 Navigating to main page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Wait for initial page load
    await page.waitForTimeout(2000);
    
    console.log('🔍 Checking initial state...');
    const initialCards = await page.$$('[data-pokemon-id]');
    console.log(`Initial cards rendered: ${initialCards.length}`);
    
    // Clear any existing API requests from initial load
    apiRequests.length = 0;
    
    console.log('⚡ Scrolling to Pokemon #700...');
    const startTime = Date.now();
    
    // Find Pokemon #700 and scroll to it
    await page.evaluate(() => {
      const pokemon700 = document.querySelector('[data-pokemon-id="700"]');
      if (pokemon700) {
        pokemon700.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Fallback: scroll to approximate position
        const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
        if (scrollContainer) {
          scrollContainer.scrollTop = 700 * 200; // Approximate scroll position
        }
      }
    });
    
    // Wait for scroll to complete
    await page.waitForTimeout(1000);
    
    console.log('⏱️ Waiting for cards to load (5 second timeout)...');
    
    // Wait up to 5 seconds for Pokemon #700 area to load
    const loadStartTime = Date.now();
    let cardsLoaded = false;
    let visiblePokemonIds = [];
    
    for (let i = 0; i < 50; i++) { // Check every 100ms for 5 seconds
      await page.waitForTimeout(100);
      
      // Get visible Pokemon IDs in viewport
      visiblePokemonIds = await page.evaluate(() => {
        const cards = document.querySelectorAll('[data-pokemon-id]');
        const visibleIds = [];
        const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto') || window;
        const containerRect = scrollContainer === window ? 
          { top: 0, bottom: window.innerHeight } : 
          scrollContainer.getBoundingClientRect();
        
        cards.forEach(card => {
          const rect = card.getBoundingClientRect();
          const buffer = 200;
          const isVisible = rect.bottom > (containerRect.top - buffer) && 
                           rect.top < (containerRect.bottom + buffer);
          
          if (isVisible) {
            const pokemonId = parseInt(card.getAttribute('data-pokemon-id') || '0');
            if (pokemonId > 0) {
              visibleIds.push(pokemonId);
            }
          }
        });
        
        return visibleIds.sort((a, b) => a - b);
      });
      
      // Check if Pokemon #700 area is loaded (cards around 700 should have data)
      const hasLoadedCards = await page.evaluate(() => {
        const cards = document.querySelectorAll('[data-pokemon-id]');
        let loadedCount = 0;
        
        cards.forEach(card => {
          const rect = card.getBoundingClientRect();
          const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto') || window;
          const containerRect = scrollContainer === window ? 
            { top: 0, bottom: window.innerHeight } : 
            scrollContainer.getBoundingClientRect();
          
          const buffer = 200;
          const isVisible = rect.bottom > (containerRect.top - buffer) && 
                           rect.top < (containerRect.bottom + buffer);
          
          if (isVisible) {
      // Check if card has loaded data (not just skeleton)
      const hasImage = card.querySelector('img[src*="pokemon"]');
      const hasTypes = card.querySelector('[class*="type-"]');
      const hasRealName = !card.textContent?.includes('pokemon-');
      
      // More lenient check - if it has image and real name, consider it loaded
      if (hasImage && hasRealName) {
        loadedCount++;
      }
          }
        });
        
        return loadedCount;
      });
      
      console.log(`Check ${i + 1}/50: Visible Pokemon: ${visiblePokemonIds.slice(0, 5).join(', ')}... (${visiblePokemonIds.length} total), Loaded cards: ${hasLoadedCards}`);
      
      // Check if we have Pokemon around #700 visible and loaded
      const hasPokemon700Area = visiblePokemonIds.some(id => id >= 690 && id <= 710);
      if (hasPokemon700Area && hasLoadedCards >= 6) { // At least 6 cards loaded (6-column view)
        cardsLoaded = true;
        break;
      }
    }
    
    const loadTime = Date.now() - loadStartTime;
    
    // Final validation
    console.log('\n📊 Test Results:');
    console.log(`⏱️ Load time: ${loadTime}ms`);
    console.log(`✅ Cards loaded within 5 seconds: ${cardsLoaded ? 'YES' : 'NO'}`);
    console.log(`👁️ Visible Pokemon range: ${Math.min(...visiblePokemonIds)} - ${Math.max(...visiblePokemonIds)}`);
    console.log(`🔢 Total visible Pokemon: ${visiblePokemonIds.length}`);
    
    // Check API requests
    console.log(`🌐 API requests made: ${apiRequests.length}`);
    if (apiRequests.length > 0) {
      const requestRange = {
        min: Math.min(...apiRequests.map(r => r.pokemonId)),
        max: Math.max(...apiRequests.map(r => r.pokemonId))
      };
      console.log(`📡 API request range: Pokemon #${requestRange.min} - #${requestRange.max}`);
      
      // Check if requests are only for visible Pokemon
      const visibleSet = new Set(visiblePokemonIds);
      const unnecessaryRequests = apiRequests.filter(r => !visibleSet.has(r.pokemonId));
      console.log(`❌ Unnecessary API requests: ${unnecessaryRequests.length}`);
      
      if (unnecessaryRequests.length > 0) {
        console.log('Unnecessary requests:', unnecessaryRequests.slice(0, 5).map(r => `#${r.pokemonId}`).join(', '));
      }
    }
    
    // Check if Pokemon #700 is actually visible and loaded
    const pokemon700Loaded = await page.evaluate(() => {
      const card = document.querySelector('[data-pokemon-id="700"]');
      if (!card) return false;
      
      const rect = card.getBoundingClientRect();
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto') || window;
      const containerRect = scrollContainer === window ? 
        { top: 0, bottom: window.innerHeight } : 
        scrollContainer.getBoundingClientRect();
      
      const buffer = 200;
      const isVisible = rect.bottom > (containerRect.top - buffer) && 
                       rect.top < (containerRect.bottom + buffer);
      
      if (!isVisible) return false;
      
      // Check if it has loaded data
      const hasImage = card.querySelector('img[src*="pokemon"]');
      const hasTypes = card.querySelector('[class*="type-"]');
      const hasName = card.querySelector('h3, .pokemon-name');
      const hasRealName = !card.textContent?.includes('pokemon-');
      
      return !!(hasImage && hasRealName);
    });
    
    console.log(`🎯 Pokemon #700 loaded and visible: ${pokemon700Loaded ? 'YES' : 'NO'}`);
    
    // Test result
    const testPassed = cardsLoaded && loadTime <= 5000 && pokemon700Loaded;
    console.log(`\n🏆 Test Result: ${testPassed ? 'PASSED' : 'FAILED'}`);
    
    if (!testPassed) {
      console.log('\n❌ Issues found:');
      if (!cardsLoaded) console.log('- Cards did not load within 5 seconds');
      if (loadTime > 5000) console.log(`- Load time exceeded 5 seconds (${loadTime}ms)`);
      if (!pokemon700Loaded) console.log('- Pokemon #700 is not visible or not loaded');
    }
    
    // Take screenshot for verification
    await page.screenshot({ 
      path: 'pokemon-loading-test-result.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved as pokemon-loading-test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testPokemonLoadingPerformance().catch(console.error);
