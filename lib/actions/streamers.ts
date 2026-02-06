'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { revalidatePath } from 'next/cache';

export async function getStreamersDA() {
  // Direct Access for Admin - no caching to ensure fresh data
  try {
    await requireAdmin();
    // Prioritize order asc, then created_at desc
    return await prisma.streamer.findMany({
      orderBy: [{ position: 'asc' }],
    });
  } catch (error) {
    console.error('[ACTION] ❌ Failed to fetch streamers for admin:', error);
    throw new Error('Failed to fetch streamers');
  }
}

export interface StreamerInput {
  name: string;
  role: string;
  channelId: string;
  youtubeId?: string | null;
  avatar: string;
  status?: string;
  position?: number;
}

export async function createStreamer(data: StreamerInput) {
  await requireAdmin();

  try {
    const newStreamer = await prisma.streamer.create({
      data: {
        id: crypto.randomUUID(), // Or let Prisma handle it if configured
        name: data.name,
        role: data.role,
        channelId: data.channelId,
        youtubeId: data.youtubeId,
        avatar: data.avatar, // Path from storage
        status: data.status || 'offline',
        position: data.position || 0,
      },
    });
    revalidatePath('/', 'layout');
    revalidatePath('/admin');
    console.info(`[ACTION] ✅ Created streamer: ${data.name}`);
    return { success: true, data: newStreamer };
  } catch (error) {
    console.error('[ACTION] ❌ Failed to create streamer:', error);
    return { success: false, error: 'Failed to create streamer' };
  }
}

export async function updateStreamer(id: string, data: Partial<StreamerInput>) {
  await requireAdmin();

  try {
    // 1. Fetch existing data BEFORE update to know the old avatar
    const existingStreamer = await prisma.streamer.findUnique({
      where: { id },
    });

    await prisma.streamer.update({
      where: { id },
      data: {
        name: data.name,
        role: data.role,
        channelId: data.channelId,
        youtubeId: data.youtubeId,
        avatar: data.avatar,
        status: data.status,
        position: data.position,
      },
    });

    // 2. Cleanup Old Avatar if it changed
    if (existingStreamer?.avatar && data.avatar && existingStreamer.avatar !== data.avatar) {
      // Check if it's not a default or external avatar (simple check if it's likely a file path)
      // Assuming our uploads are just filenames or paths like 'avatar/filename'
      // We need just the filename or correct path relative to bucket root.
      // StreamerForm saves just "filename.ext". So path is `avatar/${filename}`.

      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });

        const fullPath = `avatar/${existingStreamer.avatar}`;
        console.log(`[ACTION] 🔄 Avatar changed. Deleting old (Admin): ${existingStreamer.avatar} (Path: ${fullPath})`);

        // Debug: List files to see if we can find it
        const { data: listData, error: listError } = await supabaseAdmin.storage.from('cougan').list('avatar');
        if (listData) {
          console.log(
            '[ACTION] 📂 Files in avatar folder:',
            listData.map((f) => f.name),
          );
          const found = listData.find((f) => f.name === existingStreamer.avatar);
          console.log('[ACTION] 🔎 File found in list:', found ? 'YES' : 'NO');
        } else {
          console.log('[ACTION] ⚠️ Failed to list files:', listError);
        }

        const { error: deleteError, data: deleteData } = await supabaseAdmin.storage.from('cougan').remove([fullPath]);

        if (deleteError) {
          console.error('[ACTION] ❌ Failed to delete old avatar:', deleteError);
        } else {
          console.log('[ACTION] ✅ Old avatar deleted successfully from storage. Data:', deleteData);
        }
      } catch (err) {
        console.error('[ACTION] ⚠️ Error initializing Supabase for cleanup:', err);
      }
    }

    revalidatePath('/', 'layout');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Failed to update streamer:', error);
    return { success: false, error: 'Failed to update streamer' };
  }
}

// lib/actions/streamers.ts

export async function deleteStreamer(id: string) {
  await requireAdmin();

  try {
    // 1. Cek apakah data ada
    const existing = await prisma.streamer.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: 'Data tidak ditemukan atau sudah terhapus' };
    }

    // 2. Jika ada, baru hapus
    await prisma.streamer.delete({
      where: { id },
    });

    revalidatePath('/', 'layout');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete streamer:', error);
    return { success: false, error: 'Terjadi kesalahan server' };
  }
}

export async function updateStreamerPositions(items: { id: string; position: number }[]) {
  await requireAdmin();

  try {
    const updates = items.map((item) =>
      prisma.streamer.update({
        where: { id: item.id },
        data: { position: item.position },
      }),
    );
    await Promise.all(updates);
    revalidatePath('/', 'layout');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Failed to reorder streamers:', error);
    return { success: false, error: 'Failed to reorder streamers' };
  }
}
