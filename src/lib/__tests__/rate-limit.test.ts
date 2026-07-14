import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkRateLimit } from '../server/rate-limit';
import { resetRedisClientForTests } from '../server/upstashRedis';

describe('checkRateLimit', () => {
  const prevVercel = process.env.VERCEL_ENV;
  const prevUrl = process.env.UPSTASH_REDIS_REST_URL;
  const prevToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    resetRedisClientForTests();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.VERCEL_ENV;
  });

  afterEach(() => {
    resetRedisClientForTests();
    if (prevVercel === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevVercel;
    if (prevUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = prevUrl;
    if (prevToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = prevToken;
  });

  it('allows up to the limit then denies (memory fallback)', async () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    const first = await checkRateLimit(key, 2, 60_000);
    const second = await checkRateLimit(key, 2, 60_000);
    const third = await checkRateLimit(key, 2, 60_000);
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });

  it('denies in Vercel production when Redis is unavailable', async () => {
    process.env.VERCEL_ENV = 'production';
    resetRedisClientForTests();
    const result = await checkRateLimit(`prod-${Date.now()}`, 10, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('uses memory fallback in production when onRedisError is memory', async () => {
    process.env.VERCEL_ENV = 'production';
    resetRedisClientForTests();
    const key = `prod-mem-${Date.now()}-${Math.random()}`;
    const first = await checkRateLimit(key, 2, 60_000, { onRedisError: 'memory' });
    const second = await checkRateLimit(key, 2, 60_000, { onRedisError: 'memory' });
    const third = await checkRateLimit(key, 2, 60_000, { onRedisError: 'memory' });
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });
});
