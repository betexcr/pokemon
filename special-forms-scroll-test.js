const { chromium } = require('playwright');

async function specialFormsScrollTest() {
  console.log('🚀 Starting special forms scroll test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('📱 Navigating to localhost:3001...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log('⏳ Waiting for initial load...');
    await page.waitForTimeout(3000);
    
    let currentCount = await page.locator('[data-pokemon-id]').count();
    console.log(`📊 Initial Pokemon count: ${currentCount}`);
    
    let scrollAttempts = 0;
    const maxScrollAttempts = 15;
    let lastCount = 0;
    let stableCount = 0;
    
    while (scrollAttempts < maxScrollAttempts) {
      console.log(`\n🔄 Scroll attempt ${scrollAttempts + 1}/${maxScrollAttempts}`);
      
      // Scroll to bottom
      await page.evaluate(() => {
        const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      });
      
      // Wait for loading
      await page.waitForTimeout(3000);
      
      // Check new count
      const newCount = await page.locator('[data-pokemon-id]').count();
      console.log(`📊 Pokemon count: ${newCount} (${newCount - currentCount} new)`);
      
      if (newCount === currentCount) {
        stableCount++;
        console.log(`⚠️  Count unchanged (${stableCount}/3)`);
        if (stableCount >= 3) {
          console.log('🛑 Count stable for 3 attempts, stopping...');
          break;
        }
      } else {
        stableCount = 0;
        currentCount = newCount;
      }
      
      scrollAttempts++;
    }
    
    console.log(`\n📊 Final Pokemon count: ${currentCount}`);
    
    // Check for special forms Pokemon (IDs >= 10001)
    const specialFormsCount = await page.locator('[data-pokemon-id]').evaluateAll(elements => {
      return elements.filter(el => {
        const id = parseInt(el.getAttribute('data-pokemon-id'));
        return id >= 10001;
      }).length;
    });
    
    console.log(`🎯 Special forms Pokemon found: ${specialFormsCount}`);
    
    // Check for special forms header
    const specialFormsHeader = await page.locator('text=Special Forms').count();
    console.log(`📋 Special forms headers found: ${specialFormsHeader}`);
    
    // Check for Mega Evolution Pokemon
    const megaPokemon = await page.locator('text=Mega').count();
    console.log(`⚡ Mega Evolution Pokemon found: ${megaPokemon}`);
    
    // Check for Primal Pokemon
    const primalPokemon = await page.locator('text=Primal').count();
    console.log(`🔥 Primal Pokemon found: ${primalPokemon}`);
    
    // Get all Pokemon IDs to check for special forms
    const allPokemonIds = await page.locator('[data-pokemon-id]').evaluateAll(elements => {
      return elements.map(el => parseInt(el.getAttribute('data-pokemon-id'))).sort((a, b) => a - b);
    });
    
    // Find special forms IDs
    const specialFormsIds = allPokemonIds.filter(id => id >= 10001);
    console.log(`🎯 Special forms IDs: ${specialFormsIds.slice(0, 10).join(', ')}${specialFormsIds.length > 10 ? '...' : ''}`);
    
    // Check if we have the expected special forms range (10033-10082)
    const expectedSpecialForms = specialFormsIds.filter(id => id >= 10033 && id <= 10082);
    console.log(`✅ Expected special forms (10033-10082): ${expectedSpecialForms.length}`);
    
    if (specialFormsCount > 0) {
      console.log('✅ SUCCESS: Special forms are loading!');
    } else {
      console.log('❌ FAILURE: No special forms found');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'special-forms-scroll-test.png' });
    console.log('📸 Screenshot saved as special-forms-scroll-test.png');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

specialFormsScrollTest();



