'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function getRoles() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
    return roles;
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return [];
  }
}

export async function createRole(name: string) {
  await requireAdmin();
  try {
    const role = await prisma.role.create({
      data: { name },
    });
    return { success: true, data: role };
  } catch (error) {
    console.error('Failed to create role:', error);
    return { success: false, error: 'Failed to create role' };
  }
}
