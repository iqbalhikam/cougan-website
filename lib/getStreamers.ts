// path: lib/getStreamers.ts

import { prisma } from '@/lib/prisma';
import { Streamer } from '@/types';
import { parseStringPromise } from 'xml2js';
import { quotaService } from '@/lib/quota-service';

// Helper: Fix Avatar URL
function getAvatarUrl(path: string) {
  if (path.startsWith('http')) return path;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return `${supabaseUrl}/storage/v1/object/public/cougan/avatar/${path}`;
}

export async function getStreamers(): Promise<Streamer[]> {
  console.info('[STREAMER] 🔍 Starting Smart Check (RSS Mode - Quota Saver)...');

  try {
    const dbStreamers = await prisma.streamer.findMany({
      orderBy: { position: 'asc' },
      include: { role: true },
    });

    const processedStreamers = await Promise.all(
      dbStreamers.map(async (streamer) => {
        // Skip placeholder
        if (!streamer.channelId || streamer.channelId.includes('PLACEHOLDER')) {
          return { ...streamer, status: 'offline' } as Streamer;
        }

        // Default: Gunakan status lama dulu
        let finalStatus = streamer.status;
        let finalVideoId = streamer.youtubeId || '';
        let latestVideoIdCached = streamer.latestVideoId || '';

        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

        try {
          // -----------------------------------------------------------
          // STEP A: CEK RSS FEED (GRATIS)
          // -----------------------------------------------------------
          const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${streamer.channelId}`, { next: { revalidate: 60 } });

          if (rssRes.ok) {
            const xmlText = await rssRes.text();
            const result = await parseStringPromise(xmlText);
            const entry = result.feed.entry ? result.feed.entry[0] : null;

            if (entry) {
              const rssVideoId = entry['yt:videoId'][0];
              const publishedTime = new Date(entry.published[0]);
              const now = new Date();
              const hoursSincePublish = (now.getTime() - publishedTime.getTime()) / (1000 * 60 * 60);

              // Update cache ID video terbaru
              latestVideoIdCached = rssVideoId;

              // LOGIK FILTER:
              // 1. Jika video di RSS sama dengan yg di DB, DAN status di DB offline -> SKIP API (Hemat)
              // 2. TAPI jika status di DB 'live', kita WAJIB cek API untuk memastikan dia masih live atau sudah udahan.
              // 2. TAPI jika status di DB 'live', kita WAJIB cek API untuk memastikan dia masih live atau sudah udahan.
              const shouldCheckApi =
                rssVideoId !== streamer.latestVideoId || // Ada video baru
                streamer.status === 'live'; // Sedang live (perlu cek apakah udah off)

              if (shouldCheckApi) {
                // Update cache variable immediately to prevent loop
                latestVideoIdCached = rssVideoId;
              }

              if (!shouldCheckApi) {
                // Cek double protection: kalau video baru tapi < 4 jam, mungkin tadi ke-skip
                if (hoursSincePublish < 4) {
                  // Lanjut cek API...
                } else {
                  return {
                    ...streamer,
                    avatar: getAvatarUrl(streamer.avatar),
                    // Kembalikan data DB apa adanya
                    status: streamer.status,
                    latestVideoId: latestVideoIdCached,
                  } as Streamer;
                }
              }

              // -----------------------------------------------------------
              // STEP B: VALIDASI API (MURAH - 1 UNIT)
              // -----------------------------------------------------------
              // Kita cek video ID dari RSS (atau ID yg lagi live di DB)
              // Jika DB bilang live tapi video ID beda, cek video ID yg di DB dulu
              const videoIdToCheck = streamer.status === 'live' && streamer.youtubeId ? streamer.youtubeId : rssVideoId;

              // CIRCUIT BREAKER CHECK
              if (quotaService.isCircuitBreakerOpen()) {
                console.warn(`[STREAMER] ⚠️ Circuit breaker OPEN. Skipping API check for ${streamer.name}`);
                return { ...streamer, avatar: getAvatarUrl(streamer.avatar) }; // Return cached data
              }

              const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet&id=${videoIdToCheck}&key=${YOUTUBE_API_KEY}`;
              const apiRes = await fetch(apiUrl, { next: { revalidate: 60 } }); // PENTING: Cache 60s agar build static aman & hemat quota

              const apiData = await apiRes.json();

              if (apiData.items && apiData.items.length > 0) {
                const videoItem = apiData.items[0];
                const liveDetails = videoItem.liveStreamingDetails;

                // LOGIC PENENTU LIVE YANG LEBIH KETAT
                if (liveDetails) {
                  // 1. Harus punya liveStreamingDetails
                  // 2. TIDAK BOLEH ada actualEndTime (artinya belum selesai)
                  // 3. Snippet harus bilang 'live' (bukan 'upcoming' atau 'none')
                  const isActuallyLive = !liveDetails.actualEndTime && videoItem.snippet.liveBroadcastContent === 'live';

                  if (isActuallyLive) {
                    finalStatus = 'live';
                    finalVideoId = videoIdToCheck;
                    console.info(`[STREAMER] 🔴 Live Confirmed: ${streamer.name}`);
                  } else {
                    finalStatus = 'offline';
                    finalVideoId = '';
                    console.info(`[STREAMER] ⚪ Stream Ended: ${streamer.name}`);
                  }
                } else {
                  // Video biasa (bukan live stream)
                  finalStatus = 'offline';
                  finalVideoId = '';
                }
              } else {
                // Video tidak ditemukan (mungkin dihapus/private setelah live)
                finalStatus = 'offline';
                finalVideoId = '';
              }
            }
          }
        } catch (innerError) {
          console.error(`Error processing ${streamer.name}:`, innerError);
        }

        // -----------------------------------------------------------
        // STEP C: UPDATE DATABASE (Only if changed)
        // -----------------------------------------------------------
        const hasChanged = finalStatus !== streamer.status || finalVideoId !== (streamer.youtubeId || '') || latestVideoIdCached !== (streamer.latestVideoId || '');

        if (hasChanged) {
          try {
            await prisma.streamer.update({
              where: { id: streamer.id },
              data: {
                status: finalStatus,
                youtubeId: finalVideoId,
                latestVideoId: latestVideoIdCached,
                lastChecked: new Date(),
                lastVideoCheck: finalStatus === 'live' ? new Date() : streamer.lastVideoCheck,
              },
            });
            console.info(`[STREAMER] 💾 Updated DB for ${streamer.name}: ${finalStatus}`);
          } catch {
            // Ignore if record not found (deleted)
            console.warn(`[STREAMER] ⚠️ Skipping update for ${streamer.name}: Record might be deleted.`);
          }
        }

        return {
          id: streamer.id,
          name: streamer.name,
          roleId: streamer.roleId,
          role: streamer.role,
          channelId: streamer.channelId,
          youtubeId: finalVideoId,
          avatar: getAvatarUrl(streamer.avatar),
          status: finalStatus,
          position: streamer.position,
          latestVideoId: latestVideoIdCached,
          lastChecked: hasChanged ? new Date() : streamer.lastChecked || new Date(),
        } as Streamer;
      }),
    );

    return processedStreamers;
  } catch (error) {
    console.error('❌ Error in getStreamers:', error);
    return [];
  }
}
