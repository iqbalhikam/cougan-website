import { streamers, Streamer } from '@/data/streamers';

export async function getStreamers(): Promise<Streamer[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY is not set. Returning static data.');
    return streamers;
  }

  console.log('Fetching streamer data initiated...');

  try {
    const updatedStreamers = await Promise.all(
      streamers.map(async (streamer) => {
        // If no channelId (e.g. placeholder text), skip check
        if (!streamer.channelId || streamer.channelId.startsWith('UC_youtube') || streamer.channelId.includes('PLACEHOLDER')) {
          // console.log(`Skipping ${streamer.name} (No valid Channel ID)`);
          return streamer;
        }

        try {
          // console.log(`Fetching for ${streamer.name} (${streamer.channelId})...`);
          const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${streamer.channelId}&eventType=live&type=video&key=${apiKey}`, {
            next: { revalidate: 60 },
          });

          if (!response.ok) {
            console.error(`Failed to fetch for ${streamer.name}: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error('Response body:', text);
            return streamer;
          }

          const data = await response.json();

          if (data.items && data.items.length > 0) {
            console.log(`LIVE FOUND: ${streamer.name}`);
            const videoId = data.items[0].id.videoId;
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
          console.error(`Error fetching for ${streamer.name}:`, error);
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
