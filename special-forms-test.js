const { chromium } = require('playwright');

async function specialFormsTest() {
  console.log('🚀 Starting special forms test...');
  
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
    await page.waitForTimeout(5000);
    
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
    
    console.log(`📊 Total Pokemon loaded: ${allPokemonIds.length}`);
    
    // Find special forms IDs
    const specialFormsIds = allPokemonIds.filter(id => id >= 10001);
    console.log(`🎯 Special forms IDs: ${specialFormsIds.slice(0, 10).join(', ')}${specialFormsIds.length > 10 ? '...' : ''}`);
    
    // Check if we have the expected special forms range (10033-10082)
    const expectedSpecialForms = specialFormsIds.filter(id => id >= 10033 && id <= 10082);
    console.log(`✅ Expected special forms (10033-10082): ${expectedSpecialForms.length}`);
    
    // Scroll to find more special forms
    console.log('📜 Scrolling to find more special forms...');
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Check again after scrolling
    const finalSpecialFormsCount = await page.locator('[data-pokemon-id]').evaluateAll(elements => {
      return elements.filter(el => {
        const id = parseInt(el.getAttribute('data-pokemon-id'));
        return id >= 10001;
      }).length;
    });
    
    console.log(`🎯 Final special forms count: ${finalSpecialFormsCount}`);
    
    if (finalSpecialFormsCount > 0) {
      console.log('✅ SUCCESS: Special forms are loading!');
    } else {
      console.log('❌ FAILURE: No special forms found');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'special-forms-test.png' });
    console.log('📸 Screenshot saved as special-forms-test.png');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

specialFormsTest();



