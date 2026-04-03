import { getRedisConnection } from '@/services/redis'

/**
 * Sliding window rate limiter backed by Redis.
 * Returns { success, remaining, resetAt }
 */
export async function rateLimit(
  identifier: string,       // IP address or user ID
  action: string,           // e.g. 'merge', 'compress'
  limit: number,            // max requests
  windowSeconds: number     // window duration
): Promise<{ success: boolean; remaining: number; resetAt: Date }> {
  const redis = getRedisConnection()
  const key = `rl:${action}:${identifier}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  try {
    const pipeline = redis.pipeline()
    // Remove entries outside the window
    pipeline.zremrangebyscore(key, 0, now - windowMs)
    // Count current entries
    pipeline.zcard(key)
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`)
    // Set expiry
    pipeline.expire(key, windowSeconds + 1)

    const results = await pipeline.exec()
    const currentCount = (results?.[1]?.[1] as number) ?? 0

    const remaining = Math.max(0, limit - currentCount - 1)
    const resetAt = new Date(now + windowMs)

    if (currentCount >= limit) {
      return { success: false, remaining: 0, resetAt }
    }

    return { success: true, remaining, resetAt }
  } catch (err) {
    // If Redis is down, fail open (don't block users)
    console.error('[rate-limit] Redis error, failing open:', err)
    return { success: true, remaining: limit, resetAt: new Date(now + windowMs) }
  }
}

/**
 * Check current usage without consuming a slot.
 */
export async function getRateLimitStatus(
  identifier: string,
  action: string,
  limit: number,
  windowSeconds: number
): Promise<{ count: number; remaining: number; resetAt: Date }> {
  const redis = getRedisConnection()
  const key = `rl:${action}:${identifier}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  try {
    await redis.zremrangebyscore(key, 0, now - windowMs)
    const count = await redis.zcard(key)
    return {
      count,
      remaining: Math.max(0, limit - count),
      resetAt: new Date(now + windowMs),
    }
  } catch {
    return { count: 0, remaining: limit, resetAt: new Date(now + windowMs) }
  }
}
