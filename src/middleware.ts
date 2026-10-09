import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

const ISOLATED = (process.env.EMBED_ISOLATED_HOST ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export async function middleware(request: NextRequest) {
  const host = (request.headers.get('host') ?? '').toLowerCase();
  if (ISOLATED.includes(host)) {
    const p = request.nextUrl.pathname;
    if (p !== '/api/embed' && p !== '/api/embed/relay') {
      return new NextResponse('Not found', { status: 404 });
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: '/((?!_next/static|_next/image).*)',
};
