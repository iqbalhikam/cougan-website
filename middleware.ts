import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Check for maintenance mode
  const isMaintenance = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  if (isMaintenance) {
    const { pathname } = request.nextUrl;

    // Allow access to maintenance page
    if (pathname === '/maintenance') {
      return NextResponse.next();
    }

    // Allow static files and API
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/static') ||
      /\.(.+)$/.test(pathname) // Only allow if it has a file extension at the end
    ) {
      return await updateSession(request);
    }

    // Redirect everything else to maintenance
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
