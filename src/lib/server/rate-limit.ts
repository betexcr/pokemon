/**
 * Lightweight sliding-window rate limiter.
 * Prefer Upstash when configured. In Vercel production, fail closed by default if Redis is unavailable.
 * Pass `onRedisError: 'memory'` for high-read proxies (e.g. PokeAPI) so a Redis blip does not 429 the Dex.
 */

import { getRedis, withTimeout } from './upstashRedis';

type WindowResult = { allowed: boolean; remaining: number };

export type RateLimitOptions = {
  /** When Redis is missing/errors: deny (default in Vercel prod) or process-local memory. */
  onRedisError?: 'deny' | 'memory';
};

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

function memoryLimit(key: string, limit: number, windowMs: number): WindowResult {
  const now = Date.now();
  const existing = memoryBuckets.get(key);
  if (!existing || now >= existing.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count };
}

function denyAll(): WindowResult {
  return { allowed: false, remaining: 0 };
}

function fallbackOnRedisError(
  key: string,
  limit: number,
  windowMs: number,
  onRedisError: 'deny' | 'memory'
): WindowResult {
  if (onRedisError === 'memory' || !isVercelProduction()) {
    return memoryLimit(key, limit, windowMs);
  }
  return denyAll();
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  options: RateLimitOptions = {}
): Promise<WindowResult> {
  const onRedisError = options.onRedisError ?? 'deny';
  const redis = getRedis();
  if (!redis) {
    return fallbackOnRedisError(key, limit, windowMs, onRedisError);
  }

  try {
    const redisKey = `rl:${key}`;
    const count = await withTimeout(redis.incr(redisKey));
    if (count === 1) {
      await withTimeout(redis.pexpire(redisKey, windowMs));
    }
    if (count > limit) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: Math.max(0, limit - count) };
  } catch {
    return fallbackOnRedisError(key, limit, windowMs, onRedisError);
  }
}

export function clientIpFromRequest(req: { headers: Headers }): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
}
