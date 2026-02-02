/**
 * YouTube Data API v3 Type Definitions
 * For better type safety and error handling
 */

export interface YouTubeError {
  code?: number;
  message?: string;
  errors?: Array<{
    domain?: string;
    reason?: string;
    message?: string;
  }>;
}

export interface YouTubeApiError extends Error {
  code?: number;
  errors?: YouTubeError['errors'];
}

/**
 * Quota costs for different API operations
 * Reference: https://developers.google.com/youtube/v3/determine_quota_cost
 */
export const QUOTA_COSTS = {
  CHANNELS_LIST: 1, // channels.list - Check channel info
  VIDEOS_LIST: 1, // videos.list - Validate video status
  SEARCH_LIST: 100, // search.list - Find live videos (EXPENSIVE!)
  PLAYLIST_ITEMS: 1, // playlistItems.list
} as const;

/**
 * Check intervals in milliseconds
 */
export const CHECK_INTERVALS = {
  LIVE_STREAMER: 2 * 60 * 1000, // 2 minutes - verify still live
  RECENTLY_OFFLINE: 5 * 60 * 1000, // 5 minutes - might go live soon
  LONG_OFFLINE: 15 * 60 * 1000, // 15 minutes - unlikely to be live
  VIDEO_VALIDATION: 5 * 60 * 1000, // 5 minutes - recheck video status
} as const;

/**
 * Circuit breaker configuration
 */
export const CIRCUIT_BREAKER_CONFIG = {
  INITIAL_RESET_DELAY: 10 * 60 * 1000, // 10 minutes
  MAX_RESET_DELAY: 60 * 60 * 1000, // 1 hour
  BACKOFF_MULTIPLIER: 2, // Exponential backoff
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 100,
  WINDOW_MS: 60 * 1000, // 1 minute
} as const;
