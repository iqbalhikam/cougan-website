import { google } from 'googleapis';
import { YouTubeError, QUOTA_COSTS, CIRCUIT_BREAKER_CONFIG, RATE_LIMIT_CONFIG } from './youtube-types';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

/**
 * Rate Limiter using Sliding Window Algorithm
 * Prevents bursts of requests that could trigger rate limits
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE, windowMs = RATE_LIMIT_CONFIG.WINDOW_MS) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      console.warn(`Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.checkLimit();
    }

    this.requests.push(now);
    return true;
  }

  getStats() {
    const now = Date.now();
    const recentRequests = this.requests.filter((time) => now - time < this.windowMs);
    return {
      requestsInWindow: recentRequests.length,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
    };
  }
}

/**
 * Enhanced Quota Service with Production-Grade Features
 *
 * Features:
 * - Circuit Breaker with Exponential Backoff
 * - Rate Limiting (100 req/min)
 * - Quota Usage Tracking
 * - Better Error Handling
 * - Request Queuing
 */
class QuotaService {
  private isCircuitOpen = false;
  private resetTimeout: NodeJS.Timeout | null = null;
  private currentResetDelay = CIRCUIT_BREAKER_CONFIG.INITIAL_RESET_DELAY;
  private rateLimiter = new RateLimiter();

  // Metrics
  private quotaUsed = 0;
  private requestsMade = 0;
  private circuitBreakerTrips = 0;
  private lastReset = new Date();
  private errorCount = 0;

  private checkCircuit(): boolean {
    if (this.isCircuitOpen) {
      console.warn('⚠️ Circuit breaker is OPEN. Requests blocked to prevent quota exhaustion.');
      return false;
    }
    return true;
  }

  private handleQuotaError(error: unknown) {
    const err = error as YouTubeError;
    const isQuotaError = err?.code === 403 && (err?.errors?.[0]?.reason === 'quotaExceeded' || err?.message?.toLowerCase().includes('quota'));

    if (isQuotaError) {
      console.error('🚨 QUOTA EXCEEDED! Opening circuit breaker with exponential backoff.');
      this.isCircuitOpen = true;
      this.circuitBreakerTrips++;
      this.errorCount++;

      // Clear existing timeout
      if (this.resetTimeout) {
        clearTimeout(this.resetTimeout);
      }

      // Exponential backoff: 10min → 20min → 40min → max 1hr
      const resetDelay = Math.min(this.currentResetDelay, CIRCUIT_BREAKER_CONFIG.MAX_RESET_DELAY);

      console.log(`Circuit breaker will reset in ${resetDelay / 1000 / 60} minutes`);

      this.resetTimeout = setTimeout(() => {
        console.log('✅ Resetting circuit breaker...');
        this.isCircuitOpen = false;
        this.resetTimeout = null;
        // Keep increased delay for next potential failure
      }, resetDelay);

      // Increase delay for next time (exponential backoff)
      this.currentResetDelay = Math.min(this.currentResetDelay * CIRCUIT_BREAKER_CONFIG.BACKOFF_MULTIPLIER, CIRCUIT_BREAKER_CONFIG.MAX_RESET_DELAY);
    } else {
      // Other errors (network, invalid key, etc.)
      this.errorCount++;
      console.error('YouTube API Error:', err?.message || 'Unknown error');
    }
  }

  private trackCost(units: number, operation: string) {
    this.quotaUsed += units;
    this.requestsMade++;
    console.log(`📊 Quota: +${units} units (${operation}) | Total: ${this.quotaUsed} units`);
  }

  /**
   * Resolve a handle (e.g. @User) to a Channel ID
   * Cost: 1 unit
   */
  async resolveHandleToId(handle: string): Promise<string | null> {
    if (!this.checkCircuit()) return null;
    await this.rateLimiter.checkLimit();

    try {
      this.trackCost(QUOTA_COSTS.CHANNELS_LIST, 'resolveHandle');
      const cleanHandle = handle.replace(/^@/, '');
      const response = await youtube.channels.list({
        part: ['id'],
        forHandle: cleanHandle,
      });

      const id = response.data.items?.[0]?.id || null;
      if (id) {
        console.log(`✅ Resolved @${cleanHandle} → ${id}`);
      } else {
        console.warn(`⚠️ Could not resolve handle: @${cleanHandle}`);
      }
      return id;
    } catch (error) {
      console.error(`❌ Error resolving handle ${handle}:`, error);
      this.handleQuotaError(error);
      return null;
    }
  }

  /**
   * Check status of multiple channels at once.
   * Note: channels.list does NOT provide live status reliably.
   * This is mainly for channel existence validation.
   * Cost: 1 unit (per page of 50 channels)
   */
  async getChannelsStatus(channelIds: string[]): Promise<Map<string, 'live' | 'offline'>> {
    const statusMap = new Map<string, 'live' | 'offline'>();
    if (channelIds.length === 0) return statusMap;

    if (!this.checkCircuit()) {
      channelIds.forEach((id) => statusMap.set(id, 'offline'));
      return statusMap;
    }

    const chunkSize = 50;
    for (let i = 0; i < channelIds.length; i += chunkSize) {
      const chunk = channelIds.slice(i, i + chunkSize);
      await this.rateLimiter.checkLimit();

      try {
        this.trackCost(QUOTA_COSTS.CHANNELS_LIST, 'batchChannelCheck');
        const response = await youtube.channels.list({
          part: ['snippet'],
          id: chunk,
        });

        // Default to offline (we can't determine live status from channels.list)
        chunk.forEach((id) => statusMap.set(id, 'offline'));

        response.data.items?.forEach((item) => {
          if (item.id) {
            // We assume offline here; actual live status comes from video validation
            statusMap.set(item.id, 'offline');
          }
        });
      } catch (error) {
        console.error('❌ Error in getChannelsStatus:', error);
        this.handleQuotaError(error);
        chunk.forEach((id) => statusMap.set(id, 'offline'));
      }
    }

    return statusMap;
  }

  /**
   * Search for an active live video on a specific channel.
   * ⚠️ EXPENSIVE: 100 units per call!
   * Only use when necessary (no cached video ID available)
   * Cost: 100 units
   */
  async searchLiveVideo(channelId: string): Promise<string | null> {
    if (!this.checkCircuit()) return null;
    await this.rateLimiter.checkLimit();

    try {
      this.trackCost(QUOTA_COSTS.SEARCH_LIST, 'searchLiveVideo');
      const response = await youtube.search.list({
        part: ['id'],
        channelId: channelId,
        eventType: 'live',
        type: ['video'],
        maxResults: 1,
      });

      const videoId = response.data.items?.[0]?.id?.videoId;
      if (videoId) {
        console.log(`🔴 Found LIVE video: ${videoId} for channel ${channelId}`);
      } else {
        console.log(`⚪ No live video found for channel ${channelId}`);
      }
      return videoId || null;
    } catch (error) {
      console.error(`❌ Error searching live video for ${channelId}:`, error);
      this.handleQuotaError(error);
      return null;
    }
  }

  /**
   * Fetch video details to validate if still live
   * Cost: 1 unit
   */
  async fetchVideos(videoIds: string[]) {
    if (!this.checkCircuit()) return null;
    if (videoIds.length === 0) return null;

    await this.rateLimiter.checkLimit();

    try {
      this.trackCost(QUOTA_COSTS.VIDEOS_LIST, 'fetchVideos');
      const response = await youtube.videos.list({
        part: ['snippet', 'liveStreamingDetails'],
        id: videoIds,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching videos:', error);
      this.handleQuotaError(error);
      return null;
    }
  }

  /**
   * Check if circuit breaker is open
   */
  isCircuitBreakerOpen(): boolean {
    return this.isCircuitOpen;
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics() {
    return {
      quotaUsed: this.quotaUsed,
      requestsMade: this.requestsMade,
      isCircuitOpen: this.isCircuitOpen,
      circuitBreakerTrips: this.circuitBreakerTrips,
      errorCount: this.errorCount,
      currentResetDelay: this.currentResetDelay / 1000 / 60, // in minutes
      uptime: process.uptime(),
      lastReset: this.lastReset.toISOString(),
      rateLimiter: this.rateLimiter.getStats(),
    };
  }

  /**
   * Reset metrics (for testing or daily reset)
   */
  resetMetrics() {
    this.quotaUsed = 0;
    this.requestsMade = 0;
    this.errorCount = 0;
    this.lastReset = new Date();
    console.log('📊 Quota metrics reset');
  }

  /**
   * Manually close circuit breaker (for testing/recovery)
   */
  closeCircuit() {
    this.isCircuitOpen = false;
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }
    // Reset backoff delay
    this.currentResetDelay = CIRCUIT_BREAKER_CONFIG.INITIAL_RESET_DELAY;
    console.log('✅ Circuit breaker manually closed');
  }
}

export const quotaService = new QuotaService();
