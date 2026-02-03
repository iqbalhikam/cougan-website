'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getBacksounds() {
  try {
    const backsounds = await prisma.backsound.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return backsounds;
  } catch (error) {
    console.error('Error fetching backsounds:', error);
    return [];
  }
}

export async function createBacksound(data: { name: string; url: string }) {
  try {
    const backsound = await prisma.backsound.create({
      data: {
        name: data.name,
        url: data.url,
        isActive: true,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/'); // Update global player
    return { success: true, data: backsound };
  } catch (error) {
    console.error('Error creating backsound:', error);
    return { success: false, error: 'Failed to create backsound' };
  }
}

export async function deleteBacksound(id: string) {
  try {
    await prisma.backsound.delete({
      where: { id },
    });

    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting backsound:', error);
    return { success: false, error: 'Failed to delete backsound' };
  }
}

export async function toggleBacksoundStatus(id: string, isActive: boolean) {
  try {
    await prisma.backsound.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating backsound status:', error);
    return { success: false, error: 'Failed to update backsound' };
  }
}
