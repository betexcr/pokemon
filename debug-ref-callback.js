const { chromium } = require('playwright');

async function debugRefCallback() {
  console.log('🔍 Debugging ref callback and intersection observer...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    console.log('📍 Page loaded, monitoring ref callback...');
    
    // Monitor all console logs
    const allLogs = [];
    page.on('console', msg => {
      allLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Wait for any ref callback logs
    await page.waitForTimeout(3000);
    
    // Check if sentinel ref callback was called
    const refCallbackLogs = allLogs.filter(log => 
      log.includes('Sentinel ref callback') ||
      log.includes('Setting up intersection observer') ||
      log.includes('Intersection observer attached') ||
      log.includes('Intersection observer triggered')
    );
    
    console.log('🔗 Ref callback logs:');
    refCallbackLogs.forEach(log => console.log(log));
    
    if (refCallbackLogs.length === 0) {
      console.log('❌ No ref callback logs found - ref is not being called!');
    }
    
    // Check Pokemon count
    const pokemonCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Pokemon count: ${pokemonCount}`);
    
    // Try to manually trigger intersection by scrolling
    console.log('📜 Trying to scroll to trigger intersection...');
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);
    
    // Check if more Pokemon loaded
    const newPokemonCount = await page.locator('[data-pokemon-id]').count();
    console.log(`🎯 Pokemon count after scroll: ${newPokemonCount}`);
    
    // Check for any new logs
    await page.waitForTimeout(2000);
    
    const newRefCallbackLogs = allLogs.filter(log => 
      log.includes('Sentinel ref callback') ||
      log.includes('Setting up intersection observer') ||
      log.includes('Intersection observer attached') ||
      log.includes('Intersection observer triggered') ||
      log.includes('Sentinel triggered')
    );
    
    console.log('\n🔗 All ref callback logs after scroll:');
    newRefCallbackLogs.forEach(log => console.log(log));
    
    // Try to manually create intersection observer to test
    console.log('\n🧪 Testing manual intersection observer...');
    const manualTest = await page.evaluate(() => {
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      if (sentinel) {
        console.log('🎯 Found sentinel, creating manual observer...');
        const observer = new IntersectionObserver((entries) => {
          console.log('🔍 Manual observer triggered:', entries[0].isIntersecting);
          if (entries[0].isIntersecting) {
            console.log('🚀 Manual intersection detected!');
          }
        }, {
          root: null,
          rootMargin: '200px',
          threshold: 0.1
        });
        
        observer.observe(sentinel);
        console.log('✅ Manual observer created');
        
        // Scroll to sentinel
        sentinel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        return { success: true };
      }
      return { success: false, error: 'No sentinel found' };
    });
    
    console.log('🧪 Manual test result:', manualTest);
    
    // Wait for manual observer to trigger
    await page.waitForTimeout(3000);
    
    // Check final logs
    const finalLogs = allLogs.filter(log => 
      log.includes('Manual observer') ||
      log.includes('Manual intersection')
    );
    
    console.log('\n📝 Manual observer logs:');
    finalLogs.forEach(log => console.log(log));
    
  } catch (error) {
    console.error('❌ Error during ref callback debug:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

debugRefCallback().catch(console.error);



