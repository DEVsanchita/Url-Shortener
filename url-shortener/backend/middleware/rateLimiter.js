import redis from "../config/redisClient.js";

const BUCKET_SIZE = parseInt(process.env.RATE_LIMIT_BUCKET_SIZE || "10", 10);
const REFILL_RATE_MS = parseInt(process.env.RATE_LIMIT_REFILL_RATE_MS || "2000", 10);

/**
 * Token Bucket algorithm, implemented manually (no library).
 *
 * Each client (identified by IP) has a "bucket" holding up to BUCKET_SIZE tokens.
 * Every request consumes 1 token. Tokens refill gradually over time based on
 * how long it's been since the last request, at a rate of 1 token per
 * REFILL_RATE_MS milliseconds.
 *
 * We store two values per client in Redis:
 *   - tokens: how many tokens are currently available
 *   - lastRefill: timestamp of the last refill calculation
 *
 * This is computed lazily on each request (no background cron job needed),
 * which is the standard approach for token bucket implementations at scale.
 */
export async function rateLimiter(req, res, next) {
  try {
    const clientId = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const key = `ratelimit:${clientId}`;

    const now = Date.now();
    const bucket = await redis.hgetall(key);

    let tokens = bucket.tokens !== undefined ? parseFloat(bucket.tokens) : BUCKET_SIZE;
    let lastRefill = bucket.lastRefill !== undefined ? parseInt(bucket.lastRefill, 10) : now;

    // Calculate how many tokens should have regenerated since last check
    const elapsed = now - lastRefill;
    const tokensToAdd = elapsed / REFILL_RATE_MS;
    tokens = Math.min(BUCKET_SIZE, tokens + tokensToAdd);

    if (tokens < 1) {
      // Not enough tokens — reject the request
      const retryAfterMs = (1 - tokens) * REFILL_RATE_MS;
      res.set("Retry-After", Math.ceil(retryAfterMs / 1000).toString());
      return res.status(429).json({
        error: "Too many requests. Please slow down.",
        retryAfterMs: Math.ceil(retryAfterMs)
      });
    }

    // Consume one token and persist the new state
    tokens -= 1;
    await redis.hset(key, { tokens: tokens.toString(), lastRefill: now.toString() });
    await redis.expire(key, 3600); // cleanup stale clients after 1 hour of inactivity

    res.set("X-RateLimit-Remaining", Math.floor(tokens).toString());
    next();
  } catch (err) {
    // Fail open: if Redis is down, don't block all traffic — just log it
    console.error("Rate limiter error:", err.message);
    next();
  }
}
