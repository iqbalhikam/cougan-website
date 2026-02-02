import { createSupabaseServer } from '@/lib/supabase/server';

export async function isAdmin() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return false;

  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return adminEmails.includes(user.email);
}

export async function requireAdmin() {
  const isAuthorized = await isAdmin();
  if (!isAuthorized) {
    throw new Error('Unauthorized: Admin access required');
  }
}
