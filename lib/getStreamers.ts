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
          const response = await fetch(`https://www.youtube.com/channel/${streamer.channelId}/live`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            next: { revalidate: 60 },
          });

          if (!response.ok) {
            return {
              ...currentStreamer,
              status: 'offline',
              youtubeId: '',
            };
          }

          const html = await response.text();
          let isLive = false;
          let videoId = '';

          // 1. Try parsing ytInitialData (More reliable)
          const ytInitialDataMatch = html.match(/var ytInitialData = ({.*?});/);
          if (ytInitialDataMatch && ytInitialDataMatch[1]) {
            try {
              const ytData = JSON.parse(ytInitialDataMatch[1]);
              const microformat = ytData.microformat?.microformatDataRenderer;
              if (microformat?.liveBroadcastDetails?.isLiveBroadcast) {
                isLive = true;
                videoId = microformat.liveBroadcastDetails.videoId;
              }
            } catch (e) {
              console.error('Error parsing ytInitialData:', e);
            }
          }

          // 2. Fallback: Check for raw text indicators if logic above failed to find live
          if (!isLive) {
            const hasLiveText = html.includes('"text":"LIVE"') && html.includes('watching now');
            if (hasLiveText) {
              const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
              if (match && match[1]) {
                isLive = true;
                videoId = match[1];
              }
            }
          }

          if (isLive && videoId) {
            console.log(`LIVE FOUND (Scrape): ${currentStreamer.name} -> ${videoId}`);
            return {
              ...currentStreamer,
              status: 'live' as const,
              youtubeId: videoId,
            };
          } else {
            // Explicitly return offline if we scraped successfully but found no live stream
            // This prevents "different youtube" issue by overriding stale DB data
            return {
              ...currentStreamer,
              status: 'offline',
            };
          }
        } catch (error) {
          console.error(`Error scraping for ${streamer.name}:`, error);
          // On ERROR (e.g. rate limit), force OFFLINE status.
          // Do NOT fallback to DB data, as it is likely stale/incorrect ("different youtube" issue).
          return {
            ...currentStreamer,
            status: 'offline',
            youtubeId: '',
          };
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
