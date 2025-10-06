const { chromium } = require('playwright');

async function final1000Test() {
  console.log('🎯 Final test: Loading 1000+ Pokemon with infinite scroll...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the page
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000);
    
    // Set up console log monitoring
    const logs = [];
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Check initial state
    console.log('📊 Checking initial state...');
    const initialInfo = await page.evaluate(() => {
      const mainContent = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      
      return {
        mainContentHeight: mainContent ? mainContent.scrollHeight : 0,
        mainContentClientHeight: mainContent ? mainContent.clientHeight : 0,
        mainContentCanScroll: mainContent ? mainContent.scrollHeight > mainContent.clientHeight : false,
        sentinelFound: !!sentinel,
        pokemonCount: document.querySelectorAll('[data-pokemon-id]').length
      };
    });
    console.log('Initial info:', initialInfo);
    
    let currentPokemonCount = initialInfo.pokemonCount;
    let scrollAttempts = 0;
    const maxScrollAttempts = 20; // Limit to prevent infinite loop
    
    // Perform multiple scrolls to load more Pokemon
    while (currentPokemonCount < 1000 && scrollAttempts < maxScrollAttempts) {
      scrollAttempts++;
      console.log(`🔄 Scroll attempt ${scrollAttempts} - Current count: ${currentPokemonCount}`);
      
      // Scroll to near the bottom to trigger intersection observer
      await page.evaluate(() => {
        const mainContent = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
        if (mainContent) {
          // Scroll to near the bottom
          mainContent.scrollTop = mainContent.scrollHeight - 500;
        }
      });
      
      // Wait for loading to complete
      await page.waitForTimeout(2000);
      
      // Check new Pokemon count
      const newPokemonCount = await page.evaluate(() => {
        return document.querySelectorAll('[data-pokemon-id]').length;
      });
      
      console.log(`📊 After scroll ${scrollAttempts}: ${newPokemonCount} Pokemon`);
      
      if (newPokemonCount === currentPokemonCount) {
        console.log('⚠️ No new Pokemon loaded, checking if we reached the end...');
        // Check if we've reached the end by looking for "end of list" indicators
        const hasReachedEnd = await page.evaluate(() => {
          const endIndicator = document.querySelector('*[class*="end"]');
          const loadingIndicator = document.querySelector('*[class*="loading"]');
          return !!endIndicator || !loadingIndicator;
        });
        
        if (hasReachedEnd) {
          console.log('🏁 Reached end of Pokemon list');
          break;
        }
        
        // If no new Pokemon and no end indicator, wait a bit more
        await page.waitForTimeout(1000);
      }
      
      currentPokemonCount = newPokemonCount;
      
      // Stop if we've reached 1000+ Pokemon
      if (currentPokemonCount >= 1000) {
        console.log('🎉 Successfully loaded 1000+ Pokemon!');
        break;
      }
    }
    
    // Final state check
    const finalInfo = await page.evaluate(() => {
      const mainContent = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      
      return {
        mainContentScrollTop: mainContent ? mainContent.scrollTop : 0,
        mainContentHeight: mainContent ? mainContent.scrollHeight : 0,
        mainContentClientHeight: mainContent ? mainContent.clientHeight : 0,
        sentinelPosition: sentinel ? sentinel.getBoundingClientRect() : null,
        pokemonCount: document.querySelectorAll('[data-pokemon-id]').length
      };
    });
    
    console.log('📊 Final results:');
    console.log(`- Pokemon count: ${finalInfo.pokemonCount}`);
    console.log(`- Scroll attempts: ${scrollAttempts}`);
    console.log(`- Main content height: ${finalInfo.mainContentHeight}`);
    console.log(`- Scroll position: ${finalInfo.mainContentScrollTop}`);
    
    // Check for intersection observer activity
    const intersectionLogs = logs.filter(log => 
      log.includes('Sentinel triggered') || 
      log.includes('Loading more Pokemon')
    );
    
    console.log(`- Intersection observer triggers: ${intersectionLogs.length}`);
    
    // Determine success
    if (finalInfo.pokemonCount >= 1000) {
      console.log('✅ SUCCESS: Infinite scroll is working and loaded 1000+ Pokemon!');
    } else if (finalInfo.pokemonCount > initialInfo.pokemonCount) {
      console.log(`✅ PARTIAL SUCCESS: Infinite scroll is working and loaded ${finalInfo.pokemonCount} Pokemon (increased from ${initialInfo.pokemonCount})`);
    } else {
      console.log('❌ FAILURE: Infinite scroll is not working properly');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'final-1000-test.png', fullPage: true });
    console.log('📸 Screenshot saved as final-1000-test.png');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

final1000Test().catch(console.error);