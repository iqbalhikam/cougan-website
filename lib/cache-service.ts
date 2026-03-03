// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * In-Memory Cache Service
 * Reduces YouTube API quota usage by caching data
 */
class CacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes
  private readonly OFFLINE_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_CACHE_SIZE = 100; // Prevent memory leaks

  /**
   * Get cached data if valid
   * @param key Cache key
   * @returns Cached data or null if expired/missing
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache with intelligent TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttlSeconds Optional TTL in seconds (overrides default logic)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: string, data: any, ttlSeconds?: number): void {
    // Prevent cache from growing too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    let ttl = this.DEFAULT_TTL;

    if (ttlSeconds) {
      ttl = ttlSeconds * 1000;
    } else if (Array.isArray(data)) {
      // Assume streamer array logic if no TTL provided
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const liveCount = data.filter((s: any) => s.status === 'live').length;
      ttl = liveCount > 0 ? this.DEFAULT_TTL : this.OFFLINE_TTL;
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();

    return {
      size: this.cache.size,
      validEntries: entries.filter((e) => now - e.timestamp <= e.ttl).length,
      expiredEntries: entries.filter((e) => now - e.timestamp > e.ttl).length,
    };
  }

  /**
   * Check if cache has valid entry
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Singleton instance
export const cacheService = new CacheService();
