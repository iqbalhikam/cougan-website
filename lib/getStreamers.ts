// path: lib/getStreamers.ts

import { prisma } from '@/lib/prisma';
import { Streamer } from '@/types';
import { parseStringPromise } from 'xml2js';
import { quotaService } from '@/lib/quota-service';

// Helper: Fix Avatar URL
function getAvatarUrl(path: string) {
  if (!path || path.trim() === '') return '/images/logo/LOGO-COUGAN.webp';
  if (path.startsWith('http') || path.startsWith('/')) return path;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return `${supabaseUrl}/storage/v1/object/public/cougan/avatar/${path}`;
}

export async function getStreamers(): Promise<Streamer[]> {
  console.info('[STREAMER] 🔍 Starting Smart Check (RSS Mode - Quota Saver)...');

  try {
    let dbStreamers = await prisma.streamer.findMany({
      orderBy: { position: 'asc' },
      include: { role: true },
    });

    // Sort by Division priority
    const getDivisionPriority = (divisions: string[] = []) => {
      if (divisions.includes('DONN')) return 1;
      if (divisions.includes('FAMS')) return 2;
      if (divisions.includes('SWAG')) return 3;
      if (divisions.includes('BUSINESS')) return 4;
      if (divisions.includes('MEMBER')) return 5;
      return 99; // Fallback
    };

    dbStreamers.sort((a, b) => {
      const priorityA = getDivisionPriority(a.divisions);
      const priorityB = getDivisionPriority(b.divisions);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return 0; // Same division, fallback to original DB position order
    });

    const processedStreamers = await Promise.all(
      dbStreamers.map(async (streamer) => {
        // Format name to include "Cougan" if missing for display
        streamer.name = streamer.name.toLowerCase().includes('cougan')
          ? streamer.name
          : `${streamer.name.trim()} Cougan`;

        // Skip placeholder
        if (!streamer.channelId || streamer.channelId.includes('PLACEHOLDER')) {
          return { ...streamer, status: 'offline' } as Streamer;
        }

        // Default: Gunakan status lama dulu
        let finalStatus = streamer.status;
        let finalVideoId = streamer.youtubeId || '';
        let finalLiveChatId = streamer.activeLiveChatId || '';
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
                    finalLiveChatId = liveDetails.activeLiveChatId || ''; // Extract chat ID
                    console.info(`[STREAMER] 🔴 Live Confirmed: ${streamer.name}`);
                  } else {
                    finalStatus = 'offline';
                    finalVideoId = '';
                    finalLiveChatId = ''; // Clear chat ID
                    console.info(`[STREAMER] ⚪ Stream Ended: ${streamer.name}`);
                  }
                } else {
                  // Video biasa (bukan live stream)
                  finalStatus = 'offline';
                  finalVideoId = '';
                  finalLiveChatId = '';
                }
              } else {
                // Video tidak ditemukan (mungkin dihapus/private setelah live)
                finalStatus = 'offline';
                finalVideoId = '';
                finalLiveChatId = '';
              }
            }
          }
        } catch (innerError) {
          console.error(`Error processing ${streamer.name}:`, innerError);
        }

        // -----------------------------------------------------------
        // STEP C: UPDATE DATABASE (Only if changed)
        // -----------------------------------------------------------
        const hasChanged = finalStatus !== streamer.status || finalLiveChatId !== (streamer.activeLiveChatId || '') || finalVideoId !== (streamer.youtubeId || '') || latestVideoIdCached !== (streamer.latestVideoId || '');

        if (hasChanged) {
          try {
            await prisma.streamer.update({
              where: { id: streamer.id },
              data: {
                status: finalStatus,
                youtubeId: finalVideoId,
                activeLiveChatId: finalLiveChatId,
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
          activeLiveChatId: finalLiveChatId,
          avatar: getAvatarUrl(streamer.avatar),
          status: finalStatus,
          position: streamer.position,
          divisions: streamer.divisions,
          factionStatus: streamer.factionStatus,
          lore: streamer.lore,
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
