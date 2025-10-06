const { chromium } = require('playwright');

async function debugComponentSelection() {
  console.log('🔍 Debugging component selection...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Page loaded, checking component selection...');
    
    // Check what components are actually rendered
    const componentCheck = await page.evaluate(() => {
      const virtualizedGrid = document.querySelector('[data-pokemon-grid]');
      const listView = document.querySelector('[data-testid="pokemon-list-view"]');
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      
      return {
        hasVirtualizedGrid: !!virtualizedGrid,
        hasListView: !!listView,
        hasSentinel: !!sentinel,
        virtualizedGridClasses: virtualizedGrid ? virtualizedGrid.className : null,
        sentinelParent: sentinel ? sentinel.parentElement?.tagName : null,
        sentinelParentClasses: sentinel ? sentinel.parentElement?.className : null
      };
    });
    
    console.log('🎯 Component check:', componentCheck);
    
    // Check Pokemon count
    const pokemonCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Pokemon count: ${pokemonCount}`);
    
    // Check for density buttons
    const densityButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent?.includes('Cols') || btn.textContent?.includes('List')
      );
      return buttons.map(btn => ({
        text: btn.textContent?.trim(),
        isActive: btn.classList.contains('bg-poke-blue') || btn.classList.contains('scale-105')
      }));
    });
    
    console.log('🎛️ Density buttons:', densityButtons);
    
    // Check if we're in list view mode
    const isListView = await page.locator('[data-testid="pokemon-list-view"]').count() > 0;
    console.log(`📋 Is list view: ${isListView}`);
    
    // If we're in list view, try switching to grid view
    if (isListView) {
      console.log('🔄 Switching to grid view...');
      const gridButton = await page.locator('button:has-text("6 Cols")').first();
      if (await gridButton.count() > 0) {
        await gridButton.click();
        await page.waitForTimeout(2000);
        
        // Check again
        const newComponentCheck = await page.evaluate(() => {
          const virtualizedGrid = document.querySelector('[data-pokemon-grid]');
          const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
          
          return {
            hasVirtualizedGrid: !!virtualizedGrid,
            hasSentinel: !!sentinel,
            sentinelParent: sentinel ? sentinel.parentElement?.tagName : null
          };
        });
        
        console.log('🎯 Component check after switch:', newComponentCheck);
      }
    }
    
    // Monitor console for any logs
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && (
        msg.text().includes('VirtualizedPokemonGrid') ||
        msg.text().includes('sentinelRef') ||
        msg.text().includes('uniqueRegularPokemon')
      )) {
        consoleLogs.push(`📝 ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(2000);
    
    console.log('\n📝 Component-related logs:');
    consoleLogs.forEach(log => console.log(log));
    
  } catch (error) {
    console.error('❌ Error during component selection debug:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

debugComponentSelection().catch(console.error);



