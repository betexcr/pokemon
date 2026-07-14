import { Redis } from '@upstash/redis';

let client: Redis | null = null;
let initialized = false;

const DEFAULT_TIMEOUT_MS = 2_000;

/**
 * Returns an Upstash Redis client when env is configured; otherwise null.
 */
export function getRedis(): Redis | null {
  if (initialized) return client;
  initialized = true;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    client = null;
    return null;
  }
  client = new Redis({ url, token });
  return client;
}

/** Test helper: reset singleton so env changes apply. */
export function resetRedisClientForTests(): void {
  client = null;
  initialized = false;
}

export function withTimeout<T>(promise: Promise<T>, ms = DEFAULT_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Upstash timeout after ${ms}ms`)), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

/** Ping Redis; returns false on missing client, error, or timeout. */
export async function pingRedis(ms = DEFAULT_TIMEOUT_MS): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    const pong = await withTimeout(redis.ping(), ms);
    return pong === 'PONG' || pong === 'pong' || pong === true || pong === 'OK';
  } catch {
    return false;
  }
}
