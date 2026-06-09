import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redisClient = null;
let ratelimit = null;
const inMemoryRateLimitMap = new Map();

function getRedisClient() {
  if (redisClient) return redisClient;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  return redisClient;
}

function getRatelimit() {
  if (ratelimit) return ratelimit;

  const redis = getRedisClient();
  if (!redis) return null;

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '600 s'),
  });

  return ratelimit;
}

export async function checkRateLimit(ip, { max = 3, window_seconds = 600 } = {}) {
  try {
    const rl = getRatelimit();

    if (rl) {
      // Use Upstash Redis
      const { success, remaining, reset, pending } = await rl.limit(ip);

      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return { allowed: false, retryAfter };
      }

      return { allowed: true };
    }
  } catch (err) {
    console.error('[Rate Limit] Upstash error:', err.message);
  }

  // Fallback: in-memory Map
  try {
    const now = Date.now();
    const windowStart = now - window_seconds * 1000;

    if (!inMemoryRateLimitMap.has(ip)) {
      inMemoryRateLimitMap.set(ip, []);
    }

    const timestamps = inMemoryRateLimitMap.get(ip);

    // Remove timestamps outside the window
    const recentTimestamps = timestamps.filter((ts) => ts > windowStart);
    inMemoryRateLimitMap.set(ip, recentTimestamps);

    if (recentTimestamps.length >= max) {
      const oldestTimestamp = Math.min(...recentTimestamps);
      const retryAfter = Math.ceil((oldestTimestamp + window_seconds * 1000 - now) / 1000);
      return { allowed: false, retryAfter };
    }

    recentTimestamps.push(now);
    return { allowed: true };
  } catch (err) {
    console.error('[Rate Limit] In-memory fallback error:', err.message);
    // Fail open on error
    return { allowed: true };
  }
}
