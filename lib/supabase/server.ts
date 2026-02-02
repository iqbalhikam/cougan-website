import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createSupabaseServer = async () =>
  await createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll: async () => (await cookies()).getAll(),
      setAll: async (cookiesToSet) => {
        cookiesToSet.forEach(async ({ name, value, options }) => (await cookies()).set(name, value, options));
      },
    },
  });
