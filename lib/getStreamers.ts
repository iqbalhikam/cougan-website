import { prisma } from '@/lib/prisma';
import { Streamer } from '@/types'; // Keep type definition if compatible, or define new one

// Helper to get full avatar URL
function getAvatarUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cougan/avatar/${path}`;
}

export async function getStreamers(): Promise<Streamer[]> {
  console.log('Fetching streamer data from Database...');

  try {
    // 1. Fetch from DB
    const dbStreamers = await prisma.streamer.findMany({
      orderBy: { position: 'asc' },
    });

    // 2. Process and Scrape
    const updatedStreamers = await Promise.all(
      dbStreamers.map(async (streamer) => {
        // Construct basic streamer object from DB
        const currentStreamer: Streamer = {
          id: streamer.id,
          name: streamer.name,
          role: streamer.role,
          channelId: streamer.channelId,
          youtubeId: streamer.youtubeId || '',
          avatar: getAvatarUrl(streamer.avatar),
          status: streamer.status as 'live' | 'offline',
          position: streamer.position,
        };

        // If no channelId or placeholder, return DB state
        if (!streamer.channelId || streamer.channelId.startsWith('UC_youtube') || streamer.channelId.includes('PLACEHOLDER')) {
          return currentStreamer;
        }

        try {
          // Live Check Logic (Preserved)
          const response = await fetch(`https://www.youtube.com/channel/${streamer.channelId}/live`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            next: { revalidate: 60 },
          });

          if (!response.ok) return currentStreamer;

          const text = await response.text();
          const isLive = text.includes('"text":"LIVE"') && text.includes('watching now');

          let videoId = '';
          if (isLive) {
            const match = text.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
            if (match && match[1]) {
              videoId = match[1];
            }
          }

          if (isLive && videoId) {
            console.log(`LIVE FOUND (Scrape): ${currentStreamer.name}`);
            return {
              ...currentStreamer,
              status: 'live' as const,
              youtubeId: videoId,
            };
          } else {
            // If DB says live but scrape says offline?
            // We trust the scrape for "real-time" accuracy, but if admins want to force "live",
            // we might need a flag. For now, let's stick to "scraped status overrides offline DB status"
            // or "scrape status overrides everything".
            // Let's settle on: If scrape finds LIVE, set LIVE. Else keep DB status (which might be set manually).
            return currentStreamer;
          }
        } catch (error) {
          console.error(`Error scraping for ${streamer.name}:`, error);
          return currentStreamer;
        }
      }),
    );

    return updatedStreamers;
  } catch (error) {
    console.error('Error in getStreamers:', error);
    // Fallback? Return empty or handle error gracefully
    return [];
  }
}
