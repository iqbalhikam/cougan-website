import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Optional: Double check admin email here if you want strict layout protection
  // const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  // if (!adminEmails.includes(user.email!)) {
  //   return <div>Unauthorized Access</div>;
  // }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gold">Cougan Admin</h1>
        <div className="text-sm text-zinc-400">Logged in as {user.email}</div>
      </div>

      <main className="p-8 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
