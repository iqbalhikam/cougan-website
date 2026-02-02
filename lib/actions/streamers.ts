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
    console.error('Failed to fetch streamers for admin:', error);
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
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, data: newStreamer };
  } catch (error) {
    console.error('Failed to create streamer:', error);
    return { success: false, error: 'Failed to create streamer' };
  }
}

export async function updateStreamer(id: string, data: Partial<StreamerInput>) {
  await requireAdmin();

  try {
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
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Failed to update streamer:', error);
    return { success: false, error: 'Failed to update streamer' };
  }
}

export async function deleteStreamer(id: string) {
  await requireAdmin();

  try {
    await prisma.streamer.delete({
      where: { id },
    });
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete streamer:', error);
    return { success: false, error: 'Failed to delete streamer' };
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
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Failed to reorder streamers:', error);
    return { success: false, error: 'Failed to reorder streamers' };
  }
}
