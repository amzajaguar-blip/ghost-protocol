/**
 * In-memory rate limiter (token bucket) for API routes.
 *
 * For production, replace with @upstash/ratelimit + Redis or Vercel KV.
 * This in-memory implementation works for single-instance deployments
 * and is a massive improvement over having zero rate limiting.
 */

interface Bucket {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, Bucket>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > 600_000) { // 10 min inactivity
      buckets.delete(key)
    }
  }
}, 300_000).unref()

function getBucket(key: string, maxTokens: number, refillRate: number): Bucket {
  let bucket = buckets.get(key)
  const now = Date.now()

  if (!bucket) {
    bucket = { tokens: maxTokens, lastRefill: now }
    buckets.set(key, bucket)
    return bucket
  }

  // Refill tokens based on elapsed time
  const elapsed = (now - bucket.lastRefill) / 1000 // seconds
  bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillRate)
  bucket.lastRefill = now

  return bucket
}

/**
 * Global rate limit: N requests per window per IP
 */
export function checkGlobalLimit(ip: string): { allowed: boolean; remaining: number } {
  const bucket = getBucket(`global:${ip}`, 60, 1) // 60 tokens, refill 1/sec → ~60 req/min
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return { allowed: true, remaining: Math.floor(bucket.tokens) }
  }
  return { allowed: false, remaining: 0 }
}

/**
 * POST rate limit: stricter, N requests per window per IP
 */
export function checkPostLimit(ip: string): { allowed: boolean; remaining: number } {
  const bucket = getBucket(`post:${ip}`, 10, 0.166) // 10 tokens, refill 0.166/sec → ~10 req/min
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return { allowed: true, remaining: Math.floor(bucket.tokens) }
  }
  return { allowed: false, remaining: 0 }
}

/**
 * Vote rate limit: per-fingerprint, prevents mass voting
 */
export function checkVoteLimit(fp: string): { allowed: boolean; remaining: number } {
  const bucket = getBucket(`vote:${fp}`, 20, 0.066) // 20 tokens, refill 0.066/sec → ~20 per 5 min
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return { allowed: true, remaining: Math.floor(bucket.tokens) }
  }
  return { allowed: false, remaining: 0 }
}
