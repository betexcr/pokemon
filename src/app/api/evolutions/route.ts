import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { buildEvoGraph } from '@/lib/evo/build';

export const revalidate = 43200; // 12 hours ISR for this route

// In-memory cache for frequently accessed data
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Cache for popular Pokemon families (first 50 families are most commonly accessed)
const POPULAR_FAMILIES_CACHE = new Map<string, { data: any; timestamp: number }>();
const POPULAR_CACHE_DURATION = 7200000; // 2 hours for popular families

function getCacheKey(genParam: string | null, methodParam: string | null, offsetParam: string, limitParam: string): string {
  return `evolutions-${genParam || 'all'}-${methodParam || 'all'}-${offsetParam}-${limitParam}`;
}

function getFromCache(key: string): any | null {
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

function getFromPopularCache(key: string): any | null {
  const cached = POPULAR_FAMILIES_CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < POPULAR_CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setPopularCache(key: string, data: any): void {
  POPULAR_FAMILIES_CACHE.set(key, { data, timestamp: Date.now() });
}

// Note: We instantiate a cached function per unique param triplet so
// each (gen, offset, limit) combination has an independent cache entry.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const genParam = searchParams.get('gen');
  const methodParam = searchParams.get('method');
  // Optimize for faster initial loads with smaller batches
  const isDev = process.env.NODE_ENV === 'development';
  const offsetParam = searchParams.get('offset') ?? '';
  // Use smaller default limits for faster loading
  const defaultLimit = (genParam || methodParam) ? '50' : '20'; // Much smaller initial loads
  const limitParam = searchParams.get('limit') ?? defaultLimit;
  
  // For generation or method filtering, we can still use smaller batches since we're filtering
  const effectiveLimitParam = limitParam;
  
  const cacheKey = getCacheKey(genParam, methodParam, offsetParam, effectiveLimitParam);
  
  // Check popular families cache first for initial loads (offset 0, small limits)
  const isInitialLoad = offsetParam === '0' && parseInt(effectiveLimitParam) <= 50;
  if (isInitialLoad && !genParam && !methodParam) {
    const popularCachedData = getFromPopularCache(cacheKey);
    if (popularCachedData) {
      return NextResponse.json(popularCachedData, {
        headers: {
          'Cache-Control': 'public, s-maxage=7200, max-age=7200, stale-while-revalidate=14400',
          'X-Cache': 'popular-memory'
        },
      });
    }
  }

  // Check memory cache first (skip for generation or method filtering to avoid cache issues)
  if (!genParam && !methodParam) {
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, max-age=3600, stale-while-revalidate=7200',
          'X-Cache': 'memory'
        },
      });
    }
  }
  
  // Skip Next.js cache for generation or method filtering to avoid cache issues
  let data;
  if (genParam || methodParam) {
    console.log(`Debug: API route calling buildEvoGraph for generation ${genParam}, method ${methodParam}`);
    const gens = genParam ? genParam.split(',').map((s) => Number(s)).filter((n) => Number.isFinite(n)) : undefined;
    const methods = methodParam ? methodParam.split(',').filter(Boolean) : undefined;
    const offset = offsetParam ? Number(offsetParam) : undefined;
    const limit = effectiveLimitParam ? Number(effectiveLimitParam) : undefined;
    console.log(`Debug: API route buildEvoGraph params: gens=${gens}, methods=${methods}, offset=${offset}, limit=${limit}`);
    data = await buildEvoGraph({ gens, methods, offset, limit });
    console.log(`Debug: API route buildEvoGraph returned ${data.families.length} families`);
  } else {
    const cacheKeyParts = ['evolutions-route', genParam ?? '', methodParam ?? '', offsetParam, effectiveLimitParam];
    const cached = unstable_cache(
      async () => {
        const gens = genParam ? genParam.split(',').map((s) => Number(s)).filter((n) => Number.isFinite(n)) : undefined;
        const methods = methodParam ? methodParam.split(',').filter(Boolean) : undefined;
        const offset = offsetParam ? Number(offsetParam) : undefined;
        const limit = effectiveLimitParam ? Number(effectiveLimitParam) : undefined;
        return buildEvoGraph({ gens, methods, offset, limit });
      },
      cacheKeyParts,
      { revalidate: 3600, tags: ['evolutions'] } // Reduced cache time to 1 hour
    );
    data = await cached();
  }
  
  
  // Store in appropriate cache (skip for generation or method filtering to avoid cache issues)
  if (!genParam && !methodParam) {
    if (isInitialLoad) {
      setPopularCache(cacheKey, data);
    }
    setCache(cacheKey, data);
  }
  
  return NextResponse.json(data, {
    headers: {
      // Strong CDN and browser caching with SWR
      'Cache-Control': 'public, s-maxage=43200, max-age=43200, stale-while-revalidate=86400',
      'X-Cache': 'miss'
    },
  });
}
