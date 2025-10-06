const { chromium } = require('playwright');

async function testScrollFix() {
  console.log('🔧 Testing scroll fix...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the page
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000);
    
    // Check initial state
    console.log('📊 Checking initial state...');
    const initialInfo = await page.evaluate(() => {
      const mainContent = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      const pokemonGrid = document.querySelector('[data-pokemon-grid]');
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      
      return {
        mainContentHeight: mainContent ? mainContent.scrollHeight : 0,
        mainContentClientHeight: mainContent ? mainContent.clientHeight : 0,
        mainContentCanScroll: mainContent ? mainContent.scrollHeight > mainContent.clientHeight : false,
        pokemonGridHeight: pokemonGrid ? pokemonGrid.scrollHeight : 0,
        pokemonGridClientHeight: pokemonGrid ? pokemonGrid.clientHeight : 0,
        pokemonGridCanScroll: pokemonGrid ? pokemonGrid.scrollHeight > pokemonGrid.clientHeight : false,
        sentinelFound: !!sentinel,
        sentinelPosition: sentinel ? sentinel.getBoundingClientRect() : null,
        pokemonCount: document.querySelectorAll('[data-pokemon-id]').length
      };
    });
    console.log('Initial info:', initialInfo);
    
    // Try to force the content to be scrollable by adding more height
    console.log('🔧 Attempting to fix scroll by adding content height...');
    await page.evaluate(() => {
      const pokemonGrid = document.querySelector('[data-pokemon-grid]');
      if (pokemonGrid) {
        // Add a large bottom padding to force scrolling
        pokemonGrid.style.paddingBottom = '200vh';
        pokemonGrid.style.minHeight = '200vh';
      }
    });
    
    // Wait a bit for the change to take effect
    await page.waitForTimeout(1000);
    
    // Check state after fix
    console.log('📊 Checking state after fix...');
    const afterFixInfo = await page.evaluate(() => {
      const mainContent = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      const pokemonGrid = document.querySelector('[data-pokemon-grid]');
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      
      return {
        mainContentHeight: mainContent ? mainContent.scrollHeight : 0,
        mainContentClientHeight: mainContent ? mainContent.clientHeight : 0,
        mainContentCanScroll: mainContent ? mainContent.scrollHeight > mainContent.clientHeight : false,
        pokemonGridHeight: pokemonGrid ? pokemonGrid.scrollHeight : 0,
        pokemonGridClientHeight: pokemonGrid ? pokemonGrid.clientHeight : 0,
        pokemonGridCanScroll: pokemonGrid ? pokemonGrid.scrollHeight > pokemonGrid.clientHeight : false,
        sentinelFound: !!sentinel,
        sentinelPosition: sentinel ? sentinel.getBoundingClientRect() : null,
        pokemonCount: document.querySelectorAll('[data-pokemon-id]').length
      };
    });
    console.log('After fix info:', afterFixInfo);
    
    // Try to scroll to trigger intersection observer
    if (afterFixInfo.mainContentCanScroll) {
      console.log('🚀 Attempting to scroll to trigger intersection observer...');
      await page.evaluate(() => {
        const mainContent = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
        if (mainContent) {
          mainContent.scrollTop = mainContent.scrollHeight - 1000;
        }
      });
      
      // Wait for any async operations
      await page.waitForTimeout(2000);
      
      // Check if more Pokemon were loaded
      const finalPokemonCount = await page.evaluate(() => {
        return document.querySelectorAll('[data-pokemon-id]').length;
      });
      
      console.log(`Pokemon count after scroll: ${finalPokemonCount}`);
      
      if (finalPokemonCount > initialInfo.pokemonCount) {
        console.log('✅ Success! Infinite scroll is working after fix');
      } else {
        console.log('❌ Infinite scroll still not working');
      }
    } else {
      console.log('❌ Content is still not scrollable');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'test-scroll-fix.png', fullPage: true });
    console.log('📸 Screenshot saved as test-scroll-fix.png');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

testScrollFix().catch(console.error);


