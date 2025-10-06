const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('Browser log:', msg.text());
    }
  });

  console.log('🌐 Opening page...');
  await page.goto('http://localhost:3001');

  console.log('⏳ Waiting for page to load...');
  await page.waitForSelector('[data-pokemon-grid]', { timeout: 10000 });

  // Wait a bit for initial load
  await page.waitForTimeout(2000);

  // Check initial state
  const initialCount = await page.evaluate(() => {
    const grid = document.querySelector('[data-pokemon-grid]');
    return grid ? grid.children.length : 0;
  });
  console.log(`📊 Initial Pokemon count: ${initialCount}`);

  // Check sentinel position and visibility
  const sentinelInfo = await page.evaluate(() => {
    const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
    const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
    
    if (!sentinel || !scrollContainer) {
      return { sentinelFound: false, containerFound: false };
    }
    
    const sentinelRect = sentinel.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    
    return {
      sentinelFound: true,
      containerFound: true,
      sentinelPosition: {
        top: sentinelRect.top,
        bottom: sentinelRect.bottom,
        left: sentinelRect.left,
        right: sentinelRect.right,
        width: sentinelRect.width,
        height: sentinelRect.height
      },
      containerPosition: {
        top: containerRect.top,
        bottom: containerRect.bottom,
        left: containerRect.left,
        right: containerRect.right,
        width: containerRect.width,
        height: containerRect.height
      },
      sentinelInViewport: sentinelRect.top < window.innerHeight && sentinelRect.bottom > 0,
      scrollHeight: scrollContainer.scrollHeight,
      scrollTop: scrollContainer.scrollTop,
      clientHeight: scrollContainer.clientHeight
    };
  });

  console.log('🔍 Initial sentinel info:', sentinelInfo);

  // Scroll down to trigger loading
  console.log('📜 Scrolling to trigger loading...');
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  // Wait for loading to complete
  await page.waitForTimeout(5000);

  // Check count after scroll
  const afterScrollCount = await page.evaluate(() => {
    const grid = document.querySelector('[data-pokemon-grid]');
    return grid ? grid.children.length : 0;
  });
  console.log(`📊 After scroll Pokemon count: ${afterScrollCount}`);

  // Check sentinel position after loading
  const sentinelInfoAfter = await page.evaluate(() => {
    const sentinel = document.querySelector('[data-infinite-scroll-sentinel="true"]');
    const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
    
    if (!sentinel || !scrollContainer) {
      return { sentinelFound: false, containerFound: false };
    }
    
    const sentinelRect = sentinel.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    
    return {
      sentinelFound: true,
      containerFound: true,
      sentinelPosition: {
        top: sentinelRect.top,
        bottom: sentinelRect.bottom,
        left: sentinelRect.left,
        right: sentinelRect.right,
        width: sentinelRect.width,
        height: sentinelRect.height
      },
      containerPosition: {
        top: containerRect.top,
        bottom: containerRect.bottom,
        left: containerRect.left,
        right: containerRect.right,
        width: containerRect.width,
        height: containerRect.height
      },
      sentinelInViewport: sentinelRect.top < window.innerHeight && sentinelRect.bottom > 0,
      scrollHeight: scrollContainer.scrollHeight,
      scrollTop: scrollContainer.scrollTop,
      clientHeight: scrollContainer.clientHeight
    };
  });

  console.log('🔍 Sentinel info after loading:', sentinelInfoAfter);

  // Try scrolling more to see if we can trigger another load
  console.log('📜 Scrolling more to check for additional loading...');
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  await page.waitForTimeout(3000);

  const finalCount = await page.evaluate(() => {
    const grid = document.querySelector('[data-pokemon-grid]');
    return grid ? grid.children.length : 0;
  });
  console.log(`📊 Final Pokemon count: ${finalCount}`);

  // Check if there are more Pokemon to load
  const loadingState = await page.evaluate(() => {
    const loadingIndicator = document.querySelector('[data-testid="loading-more"]');
    const hasLoading = loadingIndicator && loadingIndicator.style.display !== 'none';
    const skeletonCards = document.querySelectorAll('[data-testid="pokemon-card-skeleton"]');
    
    return {
      hasLoading,
      skeletonCount: skeletonCards.length,
      totalCards: document.querySelector('[data-pokemon-grid]')?.children.length || 0,
      hasMorePokemon: window.hasMorePokemon !== undefined ? window.hasMorePokemon : 'unknown'
    };
  });

  console.log('🔍 Loading state:', loadingState);

  await browser.close();
})();



