import { Streamer } from '@/types';

interface CacheEntry {
  data: Streamer[];
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * In-Memory Cache Service
 * Reduces YouTube API quota usage by caching streamer data
 *
 * Cache Strategy:
 * - Live streamers: 2 minute TTL (need frequent updates)
 * - Offline streamers: 10 minute TTL (less frequent updates needed)
 * - Automatic invalidation on TTL expiry
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
  get(key: string): Streamer[] | null {
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
   * Set cache with intelligent TTL based on live status
   * @param key Cache key
   * @param data Streamer data
   */
  set(key: string, data: Streamer[]): void {
    // Prevent cache from growing too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    // Determine TTL based on live streamers count
    const liveCount = data.filter((s) => s.status === 'live').length;
    const ttl = liveCount > 0 ? this.DEFAULT_TTL : this.OFFLINE_TTL;

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
