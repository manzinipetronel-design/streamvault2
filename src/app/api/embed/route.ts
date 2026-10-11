import { NextResponse } from 'next/server';
import { sanitizeEmbedHtml, buildGuardScript, buildEmbedCsp } from '@/lib/embedShield';

// "Max shield" embed proxy.
// Fetches an embed page server-side, strips ad scripts/iframes/pixels (matched
// by hostname, not by regex-on-URL), injects a guard script that neutralises
// popups, hijacked links and script redirects, then serves it.
//
// SECURITY: the response carries a CSP `sandbox` header WITHOUT allow-same-origin,
// so third-party code runs in an opaque origin and can never touch this site's
// cookies / localStorage / Supabase session. See buildEmbedCsp().

const ALLOWED_HOSTS = ['moviesapi.to', 'vidcore.org', 'vidcore.net', 'vidsrc.sh', 'vidsrc2.ru'];
const MAX_HOPS = 3;
const MAX_HTML_BYTES = 2_000_000;

function isAllowedHost(host: string) {
  host = host.toLowerCase();
  return ALLOWED_HOSTS.some((d) => host === d || host.endsWith('.' + d));
}

function shieldError(status: number, reason: string) {
  const body =
    `<!doctype html><meta charset="utf-8">` +
    `<body style="margin:0;background:#000;color:#aaa;font:13px system-ui;display:flex;align-items:center;justify-content:center;height:100vh">` +
    `Max shield unavailable: ${reason}` +
    `<script>try{parent.postMessage({type:'sv-shield',kind:'proxy-error',status:${status},reason:${JSON.stringify(reason)}},'*')}catch(e){}</script>`;
  return new NextResponse(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': `sandbox allow-scripts; frame-ancestors ${process.env.APP_ORIGIN ?? "'self'"}`,
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  const hop = Number(searchParams.get('hop') ?? '0') || 0;
  const host = request.headers.get('host') ?? '';
  const isolated =
    !!process.env.EMBED_ISOLATED_HOST && host === process.env.EMBED_ISOLATED_HOST;
  if (!target) return shieldError(400, 'Missing url');
  if (hop > MAX_HOPS) return shieldError(508, 'Too many redirects');

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return shieldError(400, 'Invalid url');
  }
  if (parsed.protocol !== 'https:' || !isAllowedHost(parsed.hostname)) {
    return shieldError(403, 'Host not allowed');
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': request.headers.get('user-agent') ?? 'Mozilla/5.0',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': request.headers.get('accept-language') ?? 'en-US,en;q=0.9',
        Referer: new URL(request.url).origin + '/',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });

    if (upstream.status >= 300 && upstream.status < 400) {
      const loc = upstream.headers.get('location');
      if (loc) {
        const next = new URL(loc, parsed);
        if (next.protocol === 'https:' && isAllowedHost(next.hostname)) {
          return NextResponse.redirect(
            new URL(
              `/api/embed?url=${encodeURIComponent(next.toString())}&hop=${hop + 1}`,
              request.url
            )
          );
        }
      }
      return shieldError(403, 'Upstream redirected somewhere not allowed');
    }

    const ct = upstream.headers.get('content-type') ?? '';
    if (!upstream.ok || !ct.includes('text/html')) {
      return shieldError(502, `Upstream returned ${upstream.status} (not HTML)`);
    }

    const raw = await upstream.text();
    if (raw.length > MAX_HTML_BYTES) return shieldError(502, 'Upstream too large');

    const { html: clean, removed } = sanitizeEmbedHtml(raw, parsed);

    const inject = `<base href="${parsed.origin}/">` + buildGuardScript(parsed.origin);
    const html = /<head[^>]*>/i.test(clean)
      ? clean.replace(/<head[^>]*>/i, (m) => m + inject)
      : inject + clean;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Security-Policy': buildEmbedCsp(parsed.origin, {
          isolated,
          appOrigin: process.env.APP_ORIGIN,
        }),
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
        'X-Shield-Removed': String(removed),
      },
    });
  } catch (err) {
    console.error('[Embed proxy] Error:', err);
    return shieldError(502, 'Could not reach upstream');
  }
}
