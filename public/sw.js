// Service Worker for Pokemon Pokedex
// Implements modern caching strategies for optimal performance

const CACHE_NAME = 'pokemon-pokedex-v1.0.3'
const STATIC_CACHE = 'pokemon-static-v1.0.3'
const DYNAMIC_CACHE = 'pokemon-dynamic-v1.0.3'
const IMAGE_CACHE = 'pokemon-images-v1.0.3'

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets - cache first, fallback to network
  STATIC_FIRST: 'cache-first',
  // API data - network first, fallback to cache
  NETWORK_FIRST: 'network-first',
  // Images - cache first with long TTL
  IMAGE_FIRST: 'cache-first',
  // Pokemon data - stale while revalidate
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
}

// URLs to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/loading.gif',
  '/pokedex.jpg',
  '/Pokeball.svg',
  '/pokeball-pattern.svg',
  '/pokeball-pattern-dark.svg'
]

// Pokemon image patterns
const POKEMON_IMAGE_PATTERNS = [
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/',
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/',
  'https://sprites.pmdcollab.org/'
]

// API endpoints to cache
const API_PATTERNS = [
  'https://pokeapi.co/api/v2/',
  '/api/'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    // Clear all old caches first
    caches.keys().then(cacheNames => {
      return Promise.all(
            cacheNames.map(cacheName => {
              if (cacheName.startsWith('pokemon-') && !cacheName.includes('v1.0.3')) {
                console.log('Deleting old cache:', cacheName)
                return caches.delete(cacheName)
              }
            })
      )
    }).then(() => {
      return caches.open(STATIC_CACHE)
    })
      .then((cache) => {
        console.log('Caching static assets...')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
              cacheNames.map((cacheName) => {
                if (cacheName.startsWith('pokemon-') && !cacheName.includes('v1.0.3')) {
                  console.log('Deleting old cache:', cacheName)
                  return caches.delete(cacheName)
                }
              })
        )
      })
      .then(() => {
        console.log('Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }
  
  // Handle RSC payload requests specifically
  if (url.pathname.endsWith('/index.txt') || url.pathname.includes('_next/static')) {
    event.respondWith(handleRSCRequest(request))
    return
  }
  
  // Determine caching strategy based on request type
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (isPokemonImage(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 7 * 24 * 60 * 60 * 1000)) // 7 days
  } else if (isAPIRequest(request)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
  } else {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
  }
})

// Cache First Strategy - for static assets and images
async function cacheFirst(request, cacheName, maxAge = 24 * 60 * 60 * 1000) {
  try {
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // Check if cache is still fresh
      const cacheDate = cachedResponse.headers.get('sw-cache-date')
      if (cacheDate && (Date.now() - parseInt(cacheDate)) < maxAge) {
        console.log('Serving from cache:', request.url)
        return cachedResponse
      }
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone()
      // Create new headers object to avoid immutable headers error
      const newHeaders = new Headers(responseToCache.headers)
      newHeaders.set('sw-cache-date', Date.now().toString())
      const newResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: newHeaders
      })
      await cache.put(request, newResponse)
      console.log('Cached new response:', request.url)
    }
    
    return networkResponse
  } catch (error) {
    console.error('Cache first strategy failed:', error)
    
    // For HTML requests, only show offline page if we're actually offline
    if (request.headers.get('accept')?.includes('text/html')) {
      // Check if we're actually offline by trying a simple fetch
      try {
        const testResponse = await fetch('/', { method: 'HEAD', signal: AbortSignal.timeout(2000) })
        if (testResponse.ok) {
          // We're actually online, don't show offline page
          return new Response('', { status: 503 })
        }
      } catch (testError) {
        // Network is actually down, show offline page
      }
      
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Offline - PokéDex</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: system-ui, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: #f0f0f0;
              }
              .offline-container {
                max-width: 400px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .pokeball {
                width: 60px;
                height: 60px;
                margin: 0 auto 20px;
                background: #ff6b6b;
                border-radius: 50%;
                position: relative;
              }
              .pokeball::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 2px;
                background: #333;
              }
              .pokeball::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 20px;
                height: 20px;
                background: #333;
                border-radius: 50%;
              }
              h1 { color: #333; margin-bottom: 10px; }
              p { color: #666; margin-bottom: 20px; }
              button {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
              }
              button:hover { background: #45a049; }
            </style>
          </head>
          <body>
            <div class="offline-container">
              <div class="pokeball"></div>
              <h1>You're Offline</h1>
              <p>It looks like you're not connected to the internet. Some features may be limited.</p>
              <button onclick="window.location.reload()">Try Again</button>
            </div>
          </body>
        </html>
      `, {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      })
    }
    
    return new Response('Offline', { status: 503 })
  }
}

// Network First Strategy - for dynamic content
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      const responseToCache = networkResponse.clone()
      // Create new headers object to avoid immutable headers error
      const newHeaders = new Headers(responseToCache.headers)
      newHeaders.set('sw-cache-date', Date.now().toString())
      const newResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: newHeaders
      })
      await cache.put(request, newResponse)
    }
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', request.url)
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // For HTML requests, only show offline page if we're actually offline
    if (request.headers.get('accept')?.includes('text/html')) {
      // Check if we're actually offline by trying a simple fetch
      try {
        const testResponse = await fetch('/', { method: 'HEAD', signal: AbortSignal.timeout(2000) })
        if (testResponse.ok) {
          // We're actually online, don't show offline page
          return new Response('', { status: 503 })
        }
      } catch (testError) {
        // Network is actually down, show offline page
      }
      
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Offline - PokéDex</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: system-ui, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: #f0f0f0;
              }
              .offline-container {
                max-width: 400px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .pokeball {
                width: 60px;
                height: 60px;
                margin: 0 auto 20px;
                background: #ff6b6b;
                border-radius: 50%;
                position: relative;
              }
              .pokeball::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 2px;
                background: #333;
              }
              .pokeball::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 20px;
                height: 20px;
                background: #333;
                border-radius: 50%;
              }
              h1 { color: #333; margin-bottom: 10px; }
              p { color: #666; margin-bottom: 20px; }
              button {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
              }
              button:hover { background: #45a049; }
            </style>
          </head>
          <body>
            <div class="offline-container">
              <div class="pokeball"></div>
              <h1>You're Offline</h1>
              <p>It looks like you're not connected to the internet. Some features may be limited.</p>
              <button onclick="window.location.reload()">Try Again</button>
            </div>
          </body>
        </html>
      `, {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      })
    }
    
    return new Response('Offline', { status: 503 })
  }
}

// Stale While Revalidate Strategy - for Pokemon data
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)
  
  // Return cached response immediately if available
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone()
      // Create new headers object to avoid immutable headers error
      const newHeaders = new Headers(responseToCache.headers)
      newHeaders.set('sw-cache-date', Date.now().toString())
      const newResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: newHeaders
      })
      cache.put(request, newResponse)
    }
    return networkResponse
  }).catch(() => {
    // Network failed, but we have cache
    return cachedResponse
  })
  
  return cachedResponse || fetchPromise
}

// Handle RSC payload requests
async function handleRSCRequest(request) {
  try {
    // Try network first for RSC payloads
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      const responseToCache = networkResponse.clone()
      // Create new headers object to avoid immutable headers error
      const newHeaders = new Headers(responseToCache.headers)
      newHeaders.set('sw-cache-date', Date.now().toString())
      const newResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: newHeaders
      })
      await cache.put(request, newResponse)
      return networkResponse
    }
  } catch (error) {
    console.log('RSC network request failed, trying cache:', request.url)
  }
  
  // Fallback to cache
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  // If no cache, return a minimal response to prevent errors
  return new Response('', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache'
    }
  })
}

// Helper functions to determine request type
function isStaticAsset(request) {
  const url = new URL(request.url)
  return STATIC_ASSETS.some(asset => url.pathname === asset) ||
         url.pathname.startsWith('/_next/static/') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.woff2')
}

function isPokemonImage(request) {
  const url = new URL(request.url)
  return POKEMON_IMAGE_PATTERNS.some(pattern => url.href.startsWith(pattern)) ||
         url.pathname.includes('/gen1/') ||
         url.pathname.includes('/gen2/') ||
         url.pathname.includes('/gen3/') ||
         url.pathname.includes('/header-icons/')
}

function isAPIRequest(request) {
  const url = new URL(request.url)
  return API_PATTERNS.some(pattern => url.href.startsWith(pattern))
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'pokemon-data-sync') {
    event.waitUntil(syncPokemonData())
  }
})

async function syncPokemonData() {
  try {
    // Sync any pending Pokemon data updates
    console.log('Syncing Pokemon data in background...')
    // Implementation would depend on specific sync requirements
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Push notifications for updates
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'pokemon-update',
      actions: [
        {
          action: 'open',
          title: 'View Update'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches())
  }
  
  if (event.data && event.data.type === 'PREFETCH_POKEMON') {
    event.waitUntil(prefetchPokemonData(event.data.pokemonIds))
  }
})

async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  )
  console.log('All caches cleared')
}

async function prefetchPokemonData(pokemonIds) {
  const cache = await caches.open(DYNAMIC_CACHE)
  
  for (const id of pokemonIds) {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      if (response.ok) {
        await cache.put(`https://pokeapi.co/api/v2/pokemon/${id}`, response)
        console.log(`Prefetched Pokemon ${id}`)
      }
    } catch (error) {
      console.error(`Failed to prefetch Pokemon ${id}:`, error)
    }
  }
}

console.log('Service Worker loaded successfully')
