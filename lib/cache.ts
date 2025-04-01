import { redis } from "@/lib/redis";

const DEFAULT_CACHE_TTL = 60 * 5;

/**
 * Get data from cache
 * @param key Cache key
 * @returns Cached data or null if not found
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    const cachedData = await redis.get(key);

    if (!cachedData || typeof cachedData !== "string") return null;

    return JSON.parse(cachedData) as T;
  } catch (error) {
    console.error("Cache get error:", error);
    return null;
  }
}

/**
 * Set data in cache
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time to live in seconds (default: 5 minutes)
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttl = DEFAULT_CACHE_TTL
): Promise<void> {
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(data), { ex: ttl });
  } catch (error) {
    console.error("Cache set error:", error);
  }
}

/**
 * Delete data from cache
 * @param key Cache key
 */
export async function deleteCache(key: string): Promise<void> {
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error("Cache delete error:", error);
  }
}

/**
 * Delete multiple cache keys by pattern
 * @param pattern Key pattern to match (e.g., "patients:*")
 */
export async function deleteCacheByPattern(pattern: string): Promise<void> {
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Cache delete by pattern error:", error);
  }
}

/**
 * Cache wrapper for async functions
 * @param key Cache key
 * @param fn Function to execute if cache miss
 * @param ttl Time to live in seconds
 * @returns Function result (from cache or execution)
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl = DEFAULT_CACHE_TTL
): Promise<T> {
  const cachedData = await getCache<T>(key);
  if (cachedData) return cachedData;

  const data = await fn();

  await setCache(key, data, ttl);

  return data;
}
