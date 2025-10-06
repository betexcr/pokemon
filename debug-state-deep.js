const { chromium } = require('playwright');

async function debugStateDeep() {
  console.log('🔍 Starting deep state debugging...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the page
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000);
    
    // Check initial state
    console.log('📊 Checking initial state...');
    const initialPokemonCount = await page.evaluate(() => {
      const pokemonCards = document.querySelectorAll('[data-pokemon-id]');
      return pokemonCards.length;
    });
    console.log(`Initial Pokemon count: ${initialPokemonCount}`);
    
    // Check if the page is scrollable
    const scrollInfo = await page.evaluate(() => {
      return {
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        scrollTop: document.documentElement.scrollTop,
        canScroll: document.documentElement.scrollHeight > document.documentElement.clientHeight
      };
    });
    console.log('📏 Scroll info:', scrollInfo);
    
    // Check for sentinel element
    const sentinelInfo = await page.evaluate(() => {
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      if (sentinel) {
        const rect = sentinel.getBoundingClientRect();
        return {
          found: true,
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          },
          isVisible: rect.top >= 0 && rect.top <= window.innerHeight,
          hasReactRef: sentinel.hasAttribute('data-react-ref')
        };
      }
      return { found: false };
    });
    console.log('🎯 Sentinel info:', sentinelInfo);
    
    // Check console logs for intersection observer activity
    console.log('📝 Checking console logs...');
    const logs = await page.evaluate(() => {
      // This won't work as expected since we can't access console logs from the page
      // But we can check if the sentinel has any event listeners
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      if (sentinel) {
        return {
          hasListeners: sentinel.addEventListener ? true : false,
          nodeName: sentinel.nodeName,
          className: sentinel.className
        };
      }
      return null;
    });
    console.log('🔗 Sentinel listeners:', logs);
    
    // Try to manually trigger the load more function
    console.log('🚀 Attempting to manually trigger load more...');
    const loadMoreResult = await page.evaluate(() => {
      // Try to find and call the loadMorePokemon function
      const windowObj = window;
      
      // Check if we can access React components
      const reactRoot = document.querySelector('#__next');
      if (reactRoot && reactRoot._reactInternalFiber) {
        console.log('Found React root');
      }
      
      // Try to scroll to trigger intersection observer
      window.scrollTo(0, document.documentElement.scrollHeight - 1000);
      
      return {
        scrolled: true,
        newScrollTop: document.documentElement.scrollTop
      };
    });
    console.log('📜 Scroll result:', loadMoreResult);
    
    // Wait a bit for any async operations
    await page.waitForTimeout(2000);
    
    // Check Pokemon count after scroll
    const afterScrollCount = await page.evaluate(() => {
      const pokemonCards = document.querySelectorAll('[data-pokemon-id]');
      return pokemonCards.length;
    });
    console.log(`Pokemon count after scroll: ${afterScrollCount}`);
    
    // Check if any new Pokemon were loaded
    if (afterScrollCount > initialPokemonCount) {
      console.log('✅ Success! New Pokemon were loaded');
    } else {
      console.log('❌ No new Pokemon were loaded');
    }
    
    // Check final scroll state
    const finalScrollInfo = await page.evaluate(() => {
      return {
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        scrollTop: document.documentElement.scrollTop,
        canScroll: document.documentElement.scrollHeight > document.documentElement.clientHeight
      };
    });
    console.log('📏 Final scroll info:', finalScrollInfo);
    
    // Take a screenshot for visual debugging
    await page.screenshot({ path: 'debug-state-deep.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-state-deep.png');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

debugStateDeep().catch(console.error);


