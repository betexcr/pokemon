import { Redis } from '@upstash/redis'

let client: Redis | null = null
let initialized = false

/**
 * Returns an Upstash Redis client when env is configured; otherwise null (caller uses PokeAPI only).
 */
export function getRedis(): Redis | null {
  if (initialized) return client
  initialized = true
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) {
    client = null
    return null
  }
  client = new Redis({ url, token })
  return client
}
