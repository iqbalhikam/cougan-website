import { NextResponse } from 'next/server';
import { getStreamers } from '@/lib/getStreamers';
import { cacheService } from '@/lib/cache-service';
import { quotaService } from '@/lib/quota-service';

/**
 * GET /api/streamers
 * Returns streamer data with caching
 * Cache-Control: max-age=120 (2 minutes), stale-while-revalidate=300 (5 minutes)
 */
export async function GET() {
  try {
    const streamers = await getStreamers();

    return NextResponse.json(streamers, {
      headers: {
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
        'X-Quota-Used': quotaService.getMetrics().quotaUsed.toString(),
        'X-Cache-Hit': cacheService.has('streamers') ? 'true' : 'false',
      },
    });
  } catch (error) {
    console.error('❌ Error in streamers API:', error);

    // Try to return cached data as fallback
    const fallback = cacheService.get('streamers');
    if (fallback) {
      return NextResponse.json(fallback, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60',
          'X-Cache-Fallback': 'true',
        },
      });
    }

    return NextResponse.json({ error: 'Failed to fetch streamers' }, { status: 500 });
  }
}
