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

  const response = await updateSession(request);
  if (request.nextUrl.pathname.startsWith('/media/')) {
    const frameSources = [
      "'self'",
      'https://vidsrc.to',
      'https://*.vidsrc.to',
      'https://vidsrc.me',
      'https://*.vidsrc.me',
      'https://vidsrc.xyz',
      'https://*.vidsrc.xyz',
      'https://vidsrc.cc',
      'https://*.vidsrc.cc',
      'https://vidsrc.in',
      'https://*.vidsrc.in',
      'https://vidsrc.net',
      'https://*.vidsrc.net',
      'https://vidsrc.sh',
      'https://vidsrc2.ru',
      'https://moviesapi.to',
      'https://vidcore.org',
      'https://vidcore.net',
      'https://www.youtube.com',
    ];
    const embedOrigin = process.env.NEXT_PUBLIC_EMBED_ORIGIN;
    if (embedOrigin) {
      try {
        const url = new URL(embedOrigin);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') {
          throw new Error('NEXT_PUBLIC_EMBED_ORIGIN must use HTTP or HTTPS');
        }
        frameSources.push(url.origin);
      } catch (error) {
        console.error('[CSP] Invalid NEXT_PUBLIC_EMBED_ORIGIN:', error);
      }
    }
    response.headers.set('Content-Security-Policy', `frame-src ${frameSources.join(' ')};`);
  }

  return response;
}

export const config = {
  matcher: '/((?!_next/static|_next/image).*)',
};
