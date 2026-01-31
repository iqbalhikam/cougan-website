import { google, youtube_v3 } from 'googleapis';

// Singleton to maintain state in a long-running process (like next dev or a custom server).
// WARNING: In Vercel/Serverless, this state will be lost on cold starts. Use Redis/Database for production.
class QuotaSafeService {
  private static instance: QuotaSafeService;
  private youtube: youtube_v3.Youtube;

  // CIRCUIT BREAKER STATE
  private isQuotaExhausted = false;
  private lastResetTime: Date = new Date();

  // METRICS
  private usedQuota = 0;
  private readonly QUOTA_LIMIT = 10000;

  private constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });
  }

  public static getInstance(): QuotaSafeService {
    if (!QuotaSafeService.instance) {
      QuotaSafeService.instance = new QuotaSafeService();
    }
    return QuotaSafeService.instance;
  }

  public getMetrics() {
    return {
      used: this.usedQuota,
      limit: this.QUOTA_LIMIT,
      remaining: this.QUOTA_LIMIT - this.usedQuota,
      isExhausted: this.isQuotaExhausted,
      lastReset: this.lastResetTime,
    };
  }

  /**
   * CHECK & RESET MECHANISMS
   * Call this before making API calls.
   */
  public checkQuotaStatus(estimatedCost: number = 1): boolean {
    const now = new Date();
    // Simple midnight reset check (local server time)
    if (now.getDate() !== this.lastResetTime.getDate()) {
      console.log('🔄 New Day Detected: Resetting Quota Guard.');
      this.isQuotaExhausted = false;
      this.usedQuota = 0;
      this.lastResetTime = now;
    }

    if (this.usedQuota + estimatedCost > this.QUOTA_LIMIT) {
      this.isQuotaExhausted = true;
    }

    if (this.isQuotaExhausted) {
      console.warn('⛔ SKIPPING: YouTube API calls suspended due to quota exhaustion.');
      return false; // Do not proceed
    }
    return true; // Safe to proceed
  }

  /**
   * THE "WATCHDOG" WRAPPER
   */
  public async fetchVideos(ids: string[]) {
    const COST = 1; // videos.list cost is roughly 1 unit

    // 1. Check Circuit Breaker
    if (!this.checkQuotaStatus(COST)) {
      return null;
    }

    try {
      console.log('🚀 Fetching YouTube Data...');
      const response = await this.youtube.videos.list({
        part: ['snippet', 'liveStreamingDetails'],
        id: ids,
      });

      // Increment usage on success
      this.usedQuota += COST;

      return response.data;
    } catch (error: unknown) {
      this.handleCriticalError(error);
      throw error; // Re-throw for the caller to handle gracefully (e.g. show cached data)
    }
  }

  /**
   * ERROR HANDLER
   */
  private handleCriticalError(error: unknown) {
    const apiError = error as { code?: number; errors?: { reason?: string }[]; message?: string };

    // Check for Quota Exceeded (403)
    const isQuotaError = apiError.code === 403 && apiError.errors?.some((e) => e.reason === 'quotaExceeded');

    if (isQuotaError) {
      this.activateCircuitBreaker();
    } else {
      console.error(`❌ Non-Quota API Error: ${apiError.message || 'Unknown error'}`);
    }
  }

  private activateCircuitBreaker() {
    this.isQuotaExhausted = true;

    const warningMessage = `
    ################################################
    ⚠️  CRITICAL: YOUTUBE QUOTA EXCEEDED
    ------------------------------------------------
    ⛔  STOPPING REQUESTS UNTIL MIDNIGHT
    ⏰  Suspended at: ${new Date().toISOString()}
    ################################################
    `;
    console.error(warningMessage);
  }
}

export const quotaService = QuotaSafeService.getInstance();
