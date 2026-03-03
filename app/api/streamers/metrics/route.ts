import { NextResponse } from 'next/server';
import { quotaService } from '@/lib/quota-service';
import { cacheService } from '@/lib/cache-service';

/**
 * GET /api/streamers/metrics
 * Returns quota and cache metrics for monitoring
 */
export async function GET() {
  const metrics = quotaService.getMetrics();
  const cacheStats = cacheService.getStats();

  return NextResponse.json({
    quota: {
      used: metrics.quotaUsed,
      requests: metrics.requestsMade,
      errors: metrics.errorCount,
      circuitOpen: metrics.isCircuitOpen,
      circuitTrips: metrics.circuitBreakerTrips,
      resetDelay: metrics.currentResetDelay,
      uptime: metrics.uptime,
      lastReset: metrics.lastReset,
      rateLimiter: metrics.rateLimiter,
    },
    cache: {
      size: cacheStats.size,
      validEntries: cacheStats.validEntries,
      expiredEntries: cacheStats.expiredEntries,
      hitRate: cacheStats.validEntries / Math.max(cacheStats.size, 1),
    },
    timestamp: new Date().toISOString(),
  });
}
