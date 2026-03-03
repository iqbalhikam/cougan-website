# YouTube API Quota Monitoring Guide

## Overview

This application uses YouTube Data API v3 with intelligent quota optimization to minimize API usage while keeping streamer status up-to-date.

## Quota Costs

| Operation       | Cost          | When Used                                                              |
| --------------- | ------------- | ---------------------------------------------------------------------- |
| `channels.list` | 1 unit        | Resolving @handles to Channel IDs (one-time per channel)               |
| `videos.list`   | 1 unit        | Validating existing video IDs (every 2-15 minutes depending on status) |
| `search.list`   | **100 units** | Finding new live videos (only when no cached video ID exists)          |

**Daily Quota Limit**: 10,000 units

## Optimization Features

### 1. In-Memory Caching

- **Live streamers**: 2-minute cache TTL
- **Offline streamers**: 10-minute cache TTL
- **Benefit**: Eliminates API calls for repeated page loads

### 2. Smart Check Intervals

- **Live streamers**: Check every 2 minutes (verify still live)
- **Recently offline** (< 1 hour): Check every 5 minutes
- **Long offline** (> 1 hour): Check every 15 minutes
- **Benefit**: Reduces unnecessary API calls by 80-90%

### 3. Circuit Breaker

- Opens automatically when quota is exceeded
- Exponential backoff: 10min → 20min → 40min → max 1hr
- Prevents cascading failures
- **Benefit**: Protects against quota exhaustion

### 4. Rate Limiting

- Max 100 requests per minute
- Sliding window algorithm
- **Benefit**: Prevents burst traffic from exhausting quota

## Monitoring Endpoints

### GET /api/streamers/metrics

Returns real-time quota and cache metrics:

```json
{
  "quota": {
    "used": 150,
    "requests": 25,
    "errors": 0,
    "circuitOpen": false,
    "circuitTrips": 0,
    "resetDelay": 10,
    "uptime": 3600,
    "lastReset": "2026-02-03T05:00:00.000Z",
    "rateLimiter": {
      "requestsInWindow": 15,
      "maxRequests": 100,
      "windowMs": 60000
    }
  },
  "cache": {
    "size": 1,
    "validEntries": 1,
    "expiredEntries": 0,
    "hitRate": 1.0
  },
  "timestamp": "2026-02-03T05:30:00.000Z"
}
```

### GET /api/streamers

Returns streamer data with cache headers:

**Response Headers:**

- `Cache-Control`: `public, max-age=120, stale-while-revalidate=300`
- `X-Quota-Used`: Current quota usage
- `X-Cache-Hit`: Whether data came from cache

## Expected Quota Usage

### Scenario: 10 Streamers, 100 Daily Visitors

**Without Optimization** (old system):

- 100 visitors × 200 units = **20,000 units/day** ❌ (exceeds limit)

**With Optimization** (new system):

- Initial checks: 10 × 1 unit = 10 units
- Live video searches: ~2 × 100 units = 200 units
- Periodic updates: ~50 × 1 unit = 50 units
- **Total: ~260 units/day** ✅ (97% reduction!)

## Troubleshooting

### Circuit Breaker is Open

**Symptoms:**

- All streamers show as offline
- Logs show "Circuit breaker is OPEN"

**Solutions:**

1. Wait for automatic reset (10-60 minutes)
2. Check quota usage at [Google Cloud Console](https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas)
3. Manually close circuit (development only):
   ```javascript
   quotaService.closeCircuit();
   ```

### High Quota Usage

**Symptoms:**

- Quota usage > 1000 units/day
- Frequent `search.list` calls in logs

**Solutions:**

1. Check cache hit rate (should be > 90%)
2. Verify check intervals are working
3. Look for channels with frequently changing video IDs
4. Consider increasing cache TTL for offline streamers

### Stale Data

**Symptoms:**

- Live streamers not updating
- Status stuck on offline

**Solutions:**

1. Check cache expiration times
2. Verify database `lastChecked` timestamps
3. Clear cache manually:
   ```javascript
   cacheService.clear();
   ```
4. Check for API errors in logs

## Best Practices

### Development

1. Monitor quota usage via `/api/streamers/metrics`
2. Test circuit breaker with invalid API key
3. Verify cache hit rates > 90%
4. Check logs for emoji indicators:
   - 🔍 Fetching data
   - ✅ Success / Cache hit
   - 🔴 New live video found
   - 🟢 Video still live
   - ⚪ Video ended
   - ⚠️ Warning
   - ❌ Error

### Production

1. Set up monitoring alerts for:
   - Quota usage > 5000 units/day
   - Circuit breaker trips > 0
   - Cache hit rate < 80%
2. Review logs daily for errors
3. Monitor API response times
4. Keep YouTube API key secure

## Performance Metrics

### Target KPIs

- ✅ Quota usage: < 1000 units/day
- ✅ Cache hit rate: > 90%
- ✅ API error rate: < 1%
- ✅ Live status update latency: < 5 minutes
- ✅ Circuit breaker trips: 0

## Emergency Procedures

### Quota Exhausted

1. Circuit breaker will open automatically
2. Application returns cached data (stale but functional)
3. Wait for daily quota reset (midnight Pacific Time)
4. Consider requesting quota increase from Google

### API Key Compromised

1. Revoke old key in Google Cloud Console
2. Generate new API key
3. Update `.env` file: `YOUTUBE_API_KEY=new_key`
4. Restart application
5. Monitor for unauthorized usage

## Useful Commands

```bash
# Check quota metrics
curl http://localhost:3000/api/streamers/metrics

# View Prisma database
npx prisma studio

# Reset database (development only)
npx prisma db push --force-reset

# View logs with grep
npm run dev | grep "📊 Quota"
```

## Support

For issues or questions:

1. Check logs for error messages
2. Review metrics endpoint
3. Verify API key is valid
4. Check Google Cloud Console for quota status
