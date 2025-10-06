const { chromium } = require('playwright');

async function debugInfiniteScroll() {
  console.log('🔍 Debugging infinite scroll behavior...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Monitor console logs
  const logs = [];
  page.on('console', msg => {
    const logEntry = `[${msg.type()}] ${msg.text()}`;
    logs.push(logEntry);
    if (logEntry.includes('Sentinel triggered') || logEntry.includes('Loading more Pokemon') || logEntry.includes('loadMorePokemon')) {
      console.log('📝', logEntry);
    }
  });
  
  try {
    // Navigate to the Pokemon app
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('📊 Initial state check...');
    const initialInfo = await page.evaluate(() => {
      const mainContent = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      
      return {
        mainContentHeight: mainContent ? mainContent.scrollHeight : 0,
        mainContentClientHeight: mainContent ? mainContent.clientHeight : 0,
        mainContentCanScroll: mainContent ? mainContent.scrollHeight > mainContent.clientHeight : false,
        sentinelFound: !!sentinel,
        sentinelPosition: sentinel ? sentinel.getBoundingClientRect() : null,
        pokemonCount: document.querySelectorAll('[data-pokemon-id]').length
      };
    });
    console.log('Initial info:', initialInfo);
    
    let currentPokemonCount = initialInfo.pokemonCount;
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;
    
    // Perform multiple scrolls to load more Pokemon
    while (currentPokemonCount < 1000 && scrollAttempts < maxScrollAttempts) {
      scrollAttempts++;
      console.log(`\n🔄 Scroll attempt ${scrollAttempts} - Current count: ${currentPokemonCount}`);
      
      // Check sentinel position before scrolling
      const sentinelInfo = await page.evaluate(() => {
        const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
        const mainContent = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
        
        if (!sentinel || !mainContent) return null;
        
        const sentinelRect = sentinel.getBoundingClientRect();
        const mainContentRect = mainContent.getBoundingClientRect();
        
        return {
          sentinelTop: sentinelRect.top,
          sentinelBottom: sentinelRect.bottom,
          mainContentTop: mainContentRect.top,
          mainContentBottom: mainContentRect.bottom,
          isSentinelVisible: sentinelRect.top < mainContentRect.bottom && sentinelRect.bottom > mainContentRect.top,
          scrollTop: mainContent.scrollTop,
          scrollHeight: mainContent.scrollHeight,
          clientHeight: mainContent.clientHeight
        };
      });
      
      console.log('Sentinel info:', sentinelInfo);
      
      // Scroll to near the bottom to trigger intersection observer
      await page.evaluate(() => {
        const mainContent = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
        if (mainContent) {
          // Scroll to near the bottom
          mainContent.scrollTop = mainContent.scrollHeight - 500;
        }
      });
      
      // Wait for loading to complete
      await page.waitForTimeout(3000);
      
      // Check new Pokemon count
      const newPokemonCount = await page.evaluate(() => {
        return document.querySelectorAll('[data-pokemon-id]').length;
      });
      
      console.log(`📊 After scroll ${scrollAttempts}: ${newPokemonCount} Pokemon (${newPokemonCount - currentPokemonCount} new)`);
      
      if (newPokemonCount === currentPokemonCount) {
        console.log('⚠️ No new Pokemon loaded, checking state...');
        
        // Check loading state
        const loadingState = await page.evaluate(() => {
          const loadingIndicators = document.querySelectorAll('.animate-spin');
          const hasMoreIndicator = document.querySelector('*[class*="end"]');
          
          return {
            loadingIndicators: loadingIndicators.length,
            hasMoreIndicator: !!hasMoreIndicator,
            isLoadingMore: loadingIndicators.length > 0
          };
        });
        
        console.log('Loading state:', loadingState);
        
        // Check if we've reached the end
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
        await page.waitForTimeout(2000);
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
    
    console.log('\n📊 Final results:');
    console.log(`- Pokemon count: ${finalInfo.pokemonCount}`);
    console.log(`- Scroll attempts: ${scrollAttempts}`);
    console.log(`- Main content height: ${finalInfo.mainContentHeight}`);
    console.log(`- Scroll position: ${finalInfo.mainContentScrollTop}`);
    
    // Check for intersection observer activity
    const intersectionLogs = logs.filter(log => 
      log.includes('Sentinel triggered') || 
      log.includes('Loading more Pokemon') ||
      log.includes('loadMorePokemon')
    );
    
    console.log(`- Intersection observer triggers: ${intersectionLogs.length}`);
    console.log('Recent intersection logs:');
    intersectionLogs.slice(-10).forEach(log => console.log('  ', log));
    
    // Determine success
    if (finalInfo.pokemonCount >= 1000) {
      console.log('✅ SUCCESS: Infinite scroll is working and loaded 1000+ Pokemon!');
    } else if (finalInfo.pokemonCount > initialInfo.pokemonCount) {
      console.log(`✅ PARTIAL SUCCESS: Infinite scroll is working and loaded ${finalInfo.pokemonCount} Pokemon (increased from ${initialInfo.pokemonCount})`);
    } else {
      console.log('❌ FAILURE: Infinite scroll is not working properly');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-infinite-scroll.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-infinite-scroll.png');
    
  } catch (error) {
    console.error('❌ Error during debug test:', error);
  } finally {
    await browser.close();
  }
}

debugInfiniteScroll().catch(console.error);