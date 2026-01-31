import { streamers, Streamer } from '@/data/streamers';

export async function getStreamers(): Promise<Streamer[]> {
  // NO API KEY NEEDED
  // We use a fallback method by scraping the /live URL of the channel
  // This is less reliable than the API but works without a key/quota.

  console.log('Fetching streamer data via Scraping (No API Key)...');

  try {
    const updatedStreamers = await Promise.all(
      streamers.map(async (streamer) => {
        // If no channelId (e.g. placeholder text), skip check
        if (!streamer.channelId || streamer.channelId.startsWith('UC_youtube') || streamer.channelId.includes('PLACEHOLDER')) {
          return streamer;
        }

        try {
          // Fetch the canonical 'live' URL for the channel.
          // If they are live, this page usually contains specific metadata or text like "watching now".
          // We use a User-Agent to ensure we get the desktop/mobile page we expect.
          const response = await fetch(`https://www.youtube.com/channel/${streamer.channelId}/live`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            next: { revalidate: 60 }, // Cache for 1 minute
          });

          if (!response.ok) {
            // 404 means channel not found, etc.
            return streamer;
          }

          const text = await response.text();

          // Check for specific markers in the HTML
          // "text":"LIVE" is often found in the badge JSON
          // "watching now" is found in the viewer count text
          const isLive = text.includes('"text":"LIVE"') && text.includes('watching now');

          // Note: extraction of videoId from HTML is harder.
          // Converting to "live" status implies we might link to the /live URL directly?
          // Or we try to extract "videoId":"..."

          let videoId = '';
          if (isLive) {
            // Try to find videoID. Pattern: "videoId":"VIDEO_ID"
            const match = text.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
            if (match && match[1]) {
              videoId = match[1];
            }
          }

          if (isLive && videoId) {
            console.log(`LIVE FOUND (Scrape): ${streamer.name}`);
            return {
              ...streamer,
              status: 'live',
              youtubeId: videoId,
            } as Streamer;
          } else {
            return {
              ...streamer,
              status: 'offline',
            } as Streamer;
          }
        } catch (error) {
          console.error(`Error scraping for ${streamer.name}:`, error);
          return streamer;
        }
      }),
    );

    return updatedStreamers;
  } catch (error) {
    console.error('Error in getStreamers:', error);
    return streamers;
  }
}
