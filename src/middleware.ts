import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next (static files, image optimization, data)
     * - favicon.ico and static assets
     * - media and api routes which don't require middleware session checks
     */
    '/((?!_next|favicon.ico|media|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
