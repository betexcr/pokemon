// Browser-compatible cache using localStorage and IndexedDB
// This provides persistent caching similar to Memcached/Redis but works in browsers

// Cache configuration - Daily TTL (24 hours)
export const CACHE_TTL = {
  POKEMON_LIST: 24 * 60 * 60, // 24 hours in seconds
  POKEMON_DETAIL: 24 * 60 * 60, // 24 hours in seconds
  POKEMON_SPECIES: 24 * 60 * 60, // 24 hours in seconds
  EVOLUTION_CHAIN: 24 * 60 * 60, // 24 hours in seconds
  TYPE: 24 * 60 * 60, // 24 hours in seconds
  ABILITY: 24 * 60 * 60, // 24 hours in seconds
  MOVE: 24 * 60 * 60, // 24 hours in seconds
  POKEMON_SKELETONS: 24 * 60 * 60, // 24 hours in seconds
  POKEMON_TOTAL_COUNT: 24 * 60 * 60, // 24 hours in seconds
}

// Cache key generation
export function getCacheKey(prefix: string, params: Record<string, any>): string {
  return `pokemon:${prefix}:${JSON.stringify(params)}`
}

interface CacheItem {
  data: any
  timestamp: number
  ttl: number
}

// Browser cache operations (using localStorage/IndexedDB as Memcached alternative)
export class BrowserCache {
  private useIndexedDB: boolean
  private dbName = 'pokemon-cache'
  private dbVersion = 1
  private storeName = 'cache'
  private maxCacheSize = 50 * 1024 * 1024 // 50MB limit
  private maxItems = 1000 // Maximum number of cached items
  private accessTimes = new Map<string, number>() // Track access times for LRU

  constructor() {
    this.useIndexedDB = typeof window !== 'undefined' && 'indexedDB' in window
  }

  async get<T>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') return null
    
    try {
      // Update access time for LRU tracking
      this.accessTimes.set(key, Date.now())
      
      if (this.useIndexedDB) {
        return await this.getFromIndexedDB<T>(key)
      } else {
        return this.getFromLocalStorage<T>(key)
      }
    } catch (error) {
      console.error('Browser cache GET error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    try {
      const cacheItem: CacheItem = {
        data: value,
        timestamp: Date.now(),
        ttl: ttlSeconds ? ttlSeconds * 1000 : 0
      }
      
      // Check if we need to evict items before setting
      if (!this.useIndexedDB) {
        await this.ensureCacheSpace(key, cacheItem)
      }
      
      // Update access time for LRU tracking
      this.accessTimes.set(key, Date.now())
      
      if (this.useIndexedDB) {
        return await this.setToIndexedDB(key, cacheItem)
      } else {
        return this.setToLocalStorage(key, cacheItem)
      }
    } catch (error) {
      console.error('Browser cache SET error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    try {
      if (this.useIndexedDB) {
        return await this.delFromIndexedDB(key)
      } else {
        return this.delFromLocalStorage(key)
      }
    } catch (error) {
      console.error('Browser cache DEL error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    try {
      const result = await this.get(key)
      return result !== null
    } catch (error) {
      console.error('Browser cache EXISTS error:', error)
      return false
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (typeof window === 'undefined') return keys.map(() => null)
    
    try {
      const results = await Promise.all(keys.map(key => this.get<T>(key)))
      return results
    } catch (error) {
      console.error('Browser cache MGET error:', error)
      return keys.map(() => null)
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttlSeconds?: number): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    try {
      const promises = Object.entries(keyValuePairs).map(([key, value]) => 
        this.set(key, value, ttlSeconds)
      )
      const results = await Promise.all(promises)
      return results.every(result => result === true)
    } catch (error) {
      console.error('Browser cache MSET error:', error)
      return false
    }
  }

  // Batch operations for Pokemon data
  async getPokemonBatch(ids: number[]): Promise<Record<number, any>> {
    const keys = ids.map(id => getCacheKey('pokemon', { id }))
    const results = await this.mget(keys)
    
    const pokemonData: Record<number, any> = {}
    ids.forEach((id, index) => {
      if (results[index]) {
        pokemonData[id] = results[index]
      }
    })
    
    return pokemonData
  }

  async setPokemonBatch(pokemonData: Record<number, any>, ttlSeconds = CACHE_TTL.POKEMON_DETAIL): Promise<boolean> {
    const keyValuePairs: Record<string, any> = {}
    Object.entries(pokemonData).forEach(([id, data]) => {
      keyValuePairs[getCacheKey('pokemon', { id: parseInt(id) })] = data
    })
    
    return this.mset(keyValuePairs, ttlSeconds)
  }

  // Clear cache patterns
  async clearPattern(pattern: string): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    try {
      if (this.useIndexedDB) {
        return await this.clearPatternFromIndexedDB(pattern)
      } else {
        return this.clearPatternFromLocalStorage(pattern)
      }
    } catch (error) {
      console.error('Browser cache clear pattern error:', error)
      return false
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    try {
      const testKey = 'ping-test'
      const testValue = 'pong'
      await this.set(testKey, testValue, 1)
      const result = await this.get(testKey)
      await this.del(testKey)
      return result === testValue
    } catch (error) {
      console.error('Browser cache ping error:', error)
      return false
    }
  }

  // Close connection (no-op for browser storage)
  async close(): Promise<void> {
    // Browser storage doesn't need explicit closing
  }

  // Cache management methods
  private async ensureCacheSpace(key: string, newItem: CacheItem): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      // Estimate size of new item
      const newItemSize = JSON.stringify(newItem).length
      
      // Get current cache size
      let currentSize = 0
      const keys: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i)
        if (storageKey && storageKey.startsWith('pokemon:')) {
          keys.push(storageKey)
          const item = localStorage.getItem(storageKey)
          if (item) {
            currentSize += item.length
          }
        }
      }

      // Check if we need to evict items
      if (currentSize + newItemSize > this.maxCacheSize || keys.length >= this.maxItems) {
        await this.evictLRUItems(keys, newItemSize)
      }
    } catch (error) {
      console.warn('Cache space management error:', error)
    }
  }

  private async evictLRUItems(keys: string[], newItemSize: number): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      // Sort keys by access time (oldest first)
      const sortedKeys = keys
        .map(key => ({ key, accessTime: this.accessTimes.get(key) || 0 }))
        .sort((a, b) => a.accessTime - b.accessTime)

      let freedSpace = 0
      const targetFreeSpace = newItemSize + (10 * 1024 * 1024) // Free 10MB extra

      for (const { key } of sortedKeys) {
        const item = localStorage.getItem(key)
        if (item) {
          freedSpace += item.length
          localStorage.removeItem(key)
          this.accessTimes.delete(key)
          
          if (freedSpace >= targetFreeSpace) {
            break
          }
        }
      }

      console.log(`Evicted ${freedSpace} bytes from cache`)
    } catch (error) {
      console.warn('LRU eviction error:', error)
    }
  }

  private getCacheSize(): number {
    if (typeof window === 'undefined') return 0

    let size = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('pokemon:')) {
        const item = localStorage.getItem(key)
        if (item) {
          size += item.length
        }
      }
    }
    return size
  }

  // IndexedDB methods
  private async getFromIndexedDB<T>(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(request.error)
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
      request.onsuccess = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          console.warn('Object store not found, falling back to localStorage')
          resolve(this.getFromLocalStorage<T>(key))
          return
        }
        
        const transaction = db.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)
        const getRequest = store.get(key)
        
        getRequest.onerror = () => reject(getRequest.error)
        getRequest.onsuccess = () => {
          const result = getRequest.result as CacheItem | undefined
          if (result && this.isValidCacheItem(result)) {
            resolve(result.data as T)
          } else {
            resolve(null)
          }
        }
      }
    })
  }

  private async setToIndexedDB(key: string, value: CacheItem): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(request.error)
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
      request.onsuccess = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          console.warn('Object store not found, falling back to localStorage')
          resolve(this.setToLocalStorage(key, value))
          return
        }
        
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const putRequest = store.put(value, key)
        
        putRequest.onerror = () => reject(putRequest.error)
        putRequest.onsuccess = () => resolve(true)
      }
    })
  }

  private async delFromIndexedDB(key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(request.error)
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
      request.onsuccess = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          console.warn('Object store not found, falling back to localStorage')
          resolve(this.delFromLocalStorage(key))
          return
        }
        
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const deleteRequest = store.delete(key)
        
        deleteRequest.onerror = () => reject(deleteRequest.error)
        deleteRequest.onsuccess = () => resolve(true)
      }
    })
  }

  private async clearPatternFromIndexedDB(pattern: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(request.error)
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
      request.onsuccess = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          console.warn('Object store not found, falling back to localStorage')
          resolve(this.clearPatternFromLocalStorage(pattern))
          return
        }
        
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const getAllRequest = store.getAllKeys()
        
        getAllRequest.onerror = () => reject(getAllRequest.error)
        getAllRequest.onsuccess = () => {
          const keys = getAllRequest.result as string[]
          const matchingKeys = keys.filter(key => key.includes(pattern))
          
          if (matchingKeys.length === 0) {
            resolve(true)
            return
          }
          
          const deletePromises = matchingKeys.map(key => {
            return new Promise<void>((resolveDelete, rejectDelete) => {
              const deleteRequest = store.delete(key)
              deleteRequest.onerror = () => rejectDelete(deleteRequest.error)
              deleteRequest.onsuccess = () => resolveDelete()
            })
          })
          
          Promise.all(deletePromises)
            .then(() => resolve(true))
            .catch(reject)
        }
      }
    })
  }

  // localStorage methods
  private getFromLocalStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      
      const cacheItem: CacheItem = JSON.parse(item)
      if (this.isValidCacheItem(cacheItem)) {
        return cacheItem.data as T
      } else {
        localStorage.removeItem(key)
        return null
      }
    } catch (error) {
      console.error('localStorage GET error:', error)
      return null
    }
  }

  private setToLocalStorage(key: string, value: CacheItem): boolean {
    try {
      // Try to set the item
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      // If quota exceeded, try to free space and retry once
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, attempting to free space...')
        try {
          // Clear some old items and retry
          this.clearOldestItems(10) // Clear 10 oldest items
          localStorage.setItem(key, JSON.stringify(value))
          return true
        } catch (retryError) {
          console.error('localStorage SET error after cleanup:', retryError)
          return false
        }
      }
      console.error('localStorage SET error:', error)
      return false
    }
  }

  private clearOldestItems(count: number): void {
    if (typeof window === 'undefined') return

    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('pokemon:')) {
          keys.push(key)
        }
      }

      // Sort by access time and remove oldest
      const sortedKeys = keys
        .map(key => ({ key, accessTime: this.accessTimes.get(key) || 0 }))
        .sort((a, b) => a.accessTime - b.accessTime)
        .slice(0, count)

      for (const { key } of sortedKeys) {
        localStorage.removeItem(key)
        this.accessTimes.delete(key)
      }

      console.log(`Cleared ${sortedKeys.length} oldest cache items`)
    } catch (error) {
      console.warn('Error clearing oldest items:', error)
    }
  }

  private delFromLocalStorage(key: string): boolean {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('localStorage DEL error:', error)
      return false
    }
  }

  private clearPatternFromLocalStorage(pattern: string): boolean {
    try {
      const keys = Object.keys(localStorage)
      const matchingKeys = keys.filter(key => key.includes(pattern))
      matchingKeys.forEach(key => localStorage.removeItem(key))
      return true
    } catch (error) {
      console.error('localStorage clear pattern error:', error)
      return false
    }
  }

  // Helper method to check if cache item is valid
  private isValidCacheItem(item: CacheItem): boolean {
    if (!item || typeof item !== 'object') return false
    if (!item.data || typeof item.timestamp !== 'number') return false
    if (item.ttl > 0 && Date.now() - item.timestamp > item.ttl) return false
    return true
  }
}

// Export singleton instance
export const browserCache = new BrowserCache()

// Export for compatibility
export const redisCache = browserCache