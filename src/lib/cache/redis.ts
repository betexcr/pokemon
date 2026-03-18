/**
 * Redis caching layer for API routes.
 *
 * Uses ioredis when REDIS_URL is set, otherwise falls back to an in-memory
 * Map cache for local development.
 */

import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 2,
      connectTimeout: 3000,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.warn('Redis connection error, falling back to memory cache:', err.message);
      redis?.disconnect();
      redis = null;
    });

    return redis;
  } catch {
    return null;
  }
}

// In-memory fallback
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

function memGet(key: string): string | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key: string, value: string, ttlSeconds: number): void {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function memDel(key: string): void {
  memoryCache.delete(key);
}

// Public API

export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  const client = getRedis();
  try {
    const raw = client ? await client.get(key) : memGet(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet<T = unknown>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
  const serialized = JSON.stringify(value);
  const client = getRedis();
  try {
    if (client) {
      await client.set(key, serialized, 'EX', ttlSeconds);
    } else {
      memSet(key, serialized, ttlSeconds);
    }
  } catch {
    memSet(key, serialized, ttlSeconds);
  }
}

export async function cacheInvalidate(key: string): Promise<void> {
  const client = getRedis();
  try {
    if (client) {
      await client.del(key);
    }
    memDel(key);
  } catch {
    memDel(key);
  }
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  const client = getRedis();
  try {
    if (client) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) await client.del(...keys);
    }
  } catch {}

  // Also clear matching memory keys
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern.replace(/\*/g, ''))) {
      memoryCache.delete(key);
    }
  }
}

export function isRedisAvailable(): boolean {
  return getRedis() !== null;
}
