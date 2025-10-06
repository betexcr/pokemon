const { chromium } = require('playwright');

async function debugIntersectionObserver() {
  console.log('🔍 Debugging intersection observer...');
  
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
        sentinelPosition: sentinel ? sentinel.getBoundingClientRect() : null,
        pokemonCount: document.querySelectorAll('[data-pokemon-id]').length
      };
    });
    console.log('Initial info:', initialInfo);
    
    // Create our own intersection observer to test
    console.log('🔧 Creating test intersection observer...');
    await page.evaluate(() => {
      const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
      if (sentinel) {
        console.log('🎯 Setting up test intersection observer');
        const observer = new IntersectionObserver(
          (entries) => {
            console.log('🔍 Test observer triggered:', entries[0].isIntersecting);
            if (entries[0].isIntersecting) {
              console.log('🚀 Test observer - sentinel is intersecting!');
            }
          },
          {
            root: null,
            rootMargin: '500px',
            threshold: 0.01
          }
        );
        
        observer.observe(sentinel);
        console.log('✅ Test observer attached to sentinel');
      }
    });
    
    // Scroll to trigger intersection
    console.log('🚀 Scrolling to trigger intersection...');
    await page.evaluate(() => {
      const mainContent = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
      if (mainContent) {
        // Scroll to near the bottom
        mainContent.scrollTop = mainContent.scrollHeight - 1000;
        console.log('📜 Scrolled to:', mainContent.scrollTop);
      }
    });
    
    // Wait for any async operations
    await page.waitForTimeout(2000);
    
    // Check console logs
    console.log('📝 Console logs:');
    logs.forEach(log => console.log(log));
    
    // Check final state
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
    console.log('Final info:', finalInfo);
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-intersection-observer.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-intersection-observer.png');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

debugIntersectionObserver().catch(console.error);