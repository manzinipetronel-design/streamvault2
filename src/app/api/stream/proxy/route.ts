import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const referer = searchParams.get('referer') ?? 'https://vidsrc.net/';

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  const allowedDomains = [
    'vidsrc.net',
    'vidsrc.me',
    'vidsrc.xyz',
    'vidsrc.in',
    'vidsrc.io',
    'whisperingauroras.com',
    'vidplay.online',
    'vidplay.site',
  ];

  const domainAllowed =
    allowedDomains.some(
      (d) => parsedUrl.hostname === d || parsedUrl.hostname.endsWith('.' + d)
    ) ||
    parsedUrl.pathname.endsWith('.m3u8') ||
    parsedUrl.pathname.endsWith('.ts') ||
    parsedUrl.pathname.endsWith('.vtt') ||
    parsedUrl.pathname.endsWith('.srt') ||
    ['m3u8', 'ts', 'vtt', 'srt', 'key'].includes(
      parsedUrl.pathname.split('.').pop()?.toLowerCase() ?? ''
    );

  if (!domainAllowed) {
    return new NextResponse('Domain not allowed', { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: referer,
        Origin: new URL(referer).origin,
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
    const buffer = await res.arrayBuffer();

    if (
      contentType.includes('mpegurl') ||
      contentType.includes('x-mpegurl') ||
      url.endsWith('.m3u8')
    ) {
      let text = new TextDecoder().decode(buffer);
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      text = text.replace(/^(?!#)(.+\.(?:ts|m3u8|key))(\?.*)?$/gm, (_, relPath, query) => {
        const full = relPath.startsWith('http')
          ? relPath + (query ?? '')
          : baseUrl + relPath + (query ?? '');
        return `/api/stream/proxy?url=${encodeURIComponent(full)}&referer=${encodeURIComponent(
          referer
        )}`;
      });

      return new NextResponse(text, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[Stream Proxy] Error:', err);
    return new NextResponse('Proxy error', { status: 502 });
  }
}
