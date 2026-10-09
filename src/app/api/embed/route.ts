import { NextResponse } from 'next/server';
import {
  BlockedRedirectError,
  embedSecurityHeaders,
  fetchResolved,
  guardScript,
  isAllowedUrl,
  isIsolatedHost,
  noticePage,
  readTextCapped,
  relayShim,
  sanitizeHtml,
} from '@/lib/server/embedProxy';

// Embed proxy.
//
//  mode=strict (default, what "Clean mode" uses): page is served with a CSP
//    `sandbox` header and no allow-same-origin, so third-party code can never
//    touch this site's cookies / storage.
//
//  mode=compat (used by sources that refuse to run when sandboxed, e.g.
//    vidsrc.sh): NO sandbox header. Only served on an isolated host
//    (EMBED_ISOLATED_HOST) that shares no cookies/storage with the main app.
//
// In both modes every HTTP / meta-refresh redirect is resolved server-side:
// the browser only receives the final cleaned page.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  const compat = searchParams.get('mode') === 'compat';
  if (!target) return new NextResponse('Missing url', { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }
  if (!isAllowedUrl(parsed)) {
    return new NextResponse('Host not allowed', { status: 403 });
  }
  if (compat && !isIsolatedHost(request)) {
    return new NextResponse(
      'compat mode is only served from an isolated host (set EMBED_ISOLATED_HOST)',
      { status: 403 }
    );
  }

  // Send the same Referer the browser would have sent for a direct iframe:
  // the page that embeds us (the main site), not the proxy host.
  let referer = new URL(request.url).origin + '/';
  try {
    const r = request.headers.get('referer');
    if (r) referer = new URL(r).origin + '/';
  } catch {
    /* keep default */
  }

  try {
    const { res: upstream, url: finalUrl } = await fetchResolved(parsed, {
      headers: {
        'User-Agent': request.headers.get('user-agent') ?? 'Mozilla/5.0',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': request.headers.get('accept-language') ?? 'en-US,en;q=0.9',
        Referer: referer,
      },
      signal: AbortSignal.timeout(15000),
    });

    const ct = upstream.headers.get('content-type') ?? '';
    if (!upstream.ok || !ct.includes('text/html')) {
      return new NextResponse('Upstream not HTML', { status: 502 });
    }

    let html = sanitizeHtml(await readTextCapped(upstream), finalUrl);

    // <base> so relative assets still load from the embed's own origin.
    const inject =
      `<base href="${finalUrl.origin}/">` +
      guardScript() +
      (compat ? relayShim(finalUrl.origin) : '');
    const HEAD_RE = /<head(?:\s[^>]*)?>/i;
    html = HEAD_RE.test(html) ? html.replace(HEAD_RE, (m) => m + inject) : inject + html;

    return new NextResponse(html, {
      status: 200,
      headers: embedSecurityHeaders(compat),
    });
  } catch (err) {
    if (err instanceof BlockedRedirectError) {
      // The host tried to bounce us somewhere off the allow-list (an ad, or a
      // mirror you may want to add via EMBED_EXTRA_ALLOWED_HOSTS).
      console.warn('[Embed proxy] blocked redirect to', err.target);
      return new NextResponse(
        noticePage('This source tried to redirect away and was blocked.<br>Try another source.'),
        { status: 502, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
      );
    }
    console.error('[Embed proxy] Error:', err);
    return new NextResponse('Proxy error', { status: 502 });
  }
}
