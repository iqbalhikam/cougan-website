import { createSupabaseServer } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | null;

export async function getAdminRole(): Promise<AdminRole> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  const superAdminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  if (superAdminEmails.includes(user.email)) {
    return 'SUPER_ADMIN';
  }

  const admin = await prisma.admin.findUnique({
    where: { email: user.email },
  });

  if (admin) {
    return 'ADMIN';
  }

  return null;
}

export async function isAdmin() {
  const role = await getAdminRole();
  return role !== null;
}

export async function requireAdmin() {
  const isAuthorized = await isAdmin();
  if (!isAuthorized) {
    throw new Error('Unauthorized: Admin access required');
  }
}

export async function requireSuperAdmin() {
  const role = await getAdminRole();
  if (role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized: Super Admin access required');
  }
}
