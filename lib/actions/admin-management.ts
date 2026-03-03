'use server';

import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/admin-auth';
import { revalidatePath } from 'next/cache';

export async function getAdmins() {
  await requireSuperAdmin();
  return prisma.admin.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

import { createSupabaseAdmin } from '@/lib/supabase/admin';

export async function addAdmin(email: string, password?: string) {
  await requireSuperAdmin();

  // 1. Create User in Supabase Auth (if password provided)
  if (password) {
    const supabaseAdmin = createSupabaseAdmin();
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      // Ignore if user already exists, otherwise throw
      if (!error.message.includes('already been registered')) {
        throw new Error('Failed to create user in Auth: ' + error.message);
      }
    }
  }

  // 2. Add to Whitelist
  const existingAdmin = await prisma.admin.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    throw new Error('Admin already exists in whitelist');
  }

  await prisma.admin.create({
    data: { email },
  });

  revalidatePath('/admin');
}

export async function removeAdmin(id: string) {
  await requireSuperAdmin();

  // 1. Get the admin email first
  const adminToDelete = await prisma.admin.findUnique({
    where: { id },
  });

  if (!adminToDelete) {
    throw new Error('Admin not found');
  }

  // 2. Delete from Supabase Auth (Best Effort)
  try {
    const supabaseAdmin = createSupabaseAdmin();
    // Search for user by email using listUsers
    const {
      data: { users },
      error: listError,
    } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (!listError && users) {
      const userToDelete = users.find((u) => u.email === adminToDelete.email);
      if (userToDelete) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
        if (deleteError) {
          console.error('Failed to delete Supabase Auth user:', deleteError);
        } else {
          console.log(`Deleted Supabase Auth user: ${adminToDelete.email}`);
        }
      } else {
        console.warn(`User not found in Supabase Auth: ${adminToDelete.email}`);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup Supabase Auth user:', error);
    // Continue to delete from whitelist so we don't block
  }

  // 3. Delete from Whitelist
  await prisma.admin.delete({
    where: { id },
  });

  revalidatePath('/admin');
}
