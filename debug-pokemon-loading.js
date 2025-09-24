const { chromium } = require('playwright');

async function debugPokemonLoading() {
  console.log('🔍 Debugging Pokemon Loading...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
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
    await page.waitForTimeout(2000);
    
    console.log('🔍 Checking Pokemon #700 card...');
    
    // Check the specific Pokemon #700 card
    const pokemon700Data = await page.evaluate(() => {
      const card = document.querySelector('[data-pokemon-id="700"]');
      if (!card) return { found: false };
      
      const rect = card.getBoundingClientRect();
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto') || window;
      const containerRect = scrollContainer === window ? 
        { top: 0, bottom: window.innerHeight } : 
        scrollContainer.getBoundingClientRect();
      
      const buffer = 200;
      const isVisible = rect.bottom > (containerRect.top - buffer) && 
                       rect.top < (containerRect.bottom + buffer);
      
      if (!isVisible) return { found: true, visible: false };
      
      // Check what data the card has
      const hasImage = card.querySelector('img[src*="pokemon"]');
      const hasTypes = card.querySelector('[class*="type-"]');
      const hasName = card.querySelector('h3, .pokemon-name');
      const imageSrc = hasImage ? hasImage.src : null;
      const typeElements = card.querySelectorAll('[class*="type-"]');
      const types = Array.from(typeElements).map(el => el.textContent || el.className);
      const nameElement = card.querySelector('h3, .pokemon-name');
      const name = nameElement ? nameElement.textContent : null;
      
      return {
        found: true,
        visible: true,
        hasImage: !!hasImage,
        hasTypes: !!hasTypes,
        hasName: !!hasName,
        imageSrc,
        types,
        name,
        cardHTML: card.outerHTML.substring(0, 500) + '...'
      };
    });
    
    console.log('📊 Pokemon #700 Analysis:');
    console.log(JSON.stringify(pokemon700Data, null, 2));
    
    // Check API requests
    console.log(`🌐 API requests made: ${apiRequests.length}`);
    if (apiRequests.length > 0) {
      const requestRange = {
        min: Math.min(...apiRequests.map(r => r.pokemonId)),
        max: Math.max(...apiRequests.map(r => r.pokemonId))
      };
      console.log(`📡 API request range: Pokemon #${requestRange.min} - #${requestRange.max}`);
      
      // Check if Pokemon #700 was requested
      const pokemon700Requested = apiRequests.some(r => r.pokemonId === 700);
      console.log(`🎯 Pokemon #700 API request made: ${pokemon700Requested ? 'YES' : 'NO'}`);
    }
    
    // Wait a bit more to see if data loads
    console.log('⏱️ Waiting 3 more seconds for data to load...');
    await page.waitForTimeout(3000);
    
    // Check again
    const pokemon700DataAfter = await page.evaluate(() => {
      const card = document.querySelector('[data-pokemon-id="700"]');
      if (!card) return { found: false };
      
      const hasImage = card.querySelector('img[src*="pokemon"]');
      const hasTypes = card.querySelector('[class*="type-"]');
      const hasName = card.querySelector('h3, .pokemon-name');
      const imageSrc = hasImage ? hasImage.src : null;
      const typeElements = card.querySelectorAll('[class*="type-"]');
      const types = Array.from(typeElements).map(el => el.textContent || el.className);
      const nameElement = card.querySelector('h3, .pokemon-name');
      const name = nameElement ? nameElement.textContent : null;
      
      return {
        hasImage: !!hasImage,
        hasTypes: !!hasTypes,
        hasName: !!hasName,
        imageSrc,
        types,
        name
      };
    });
    
    console.log('📊 Pokemon #700 After Wait:');
    console.log(JSON.stringify(pokemon700DataAfter, null, 2));
    
  } catch (error) {
    console.error('❌ Debug failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the debug
debugPokemonLoading().catch(console.error);
