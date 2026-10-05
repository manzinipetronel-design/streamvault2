import { NextResponse } from 'next/server';

// "Clean mode" embed proxy.
// Fetches an embed page server-side, strips known ad scripts, injects a guard
// script (blocks window.open, cross-site link clicks and — in browsers that
// support the Navigation API — script-driven redirects), then serves it.
//
// SECURITY: the response is served with a CSP `sandbox` header WITHOUT
// allow-same-origin, so third-party code runs in an opaque origin and can
// never touch this site's cookies / localStorage / Supabase session.

const ALLOWED_HOSTS = ['moviesapi.to', 'vidcore.org', 'vidcore.net', 'vidsrc.sh'];

const AD_HOSTS = [
  'exoclick.com', 'exosrv.com', 'trafficjunky.net', 'adnxs.com',
  'doubleclick.net', 'googlesyndication.com', 'popads.net', 'popcash.net',
  'propellerads.com', 'hilltopads.net', 'adsterra.com', 'juicyads.com',
  'plugrush.com', 'revcontent.com', 'outbrain.com', 'taboola.com', 'mgid.com',
  'zedo.com', 'clickadu.com', 'adcash.com', 'adskeeper.co.uk',
  'bidvertiser.com', 'yllix.com', 'popunder.net', 'pop.cash',
  'popuptraffic.com', 'clkmon.com', 'clkrev.com', 'go2speed.org',
];

function isAllowedHost(host: string) {
  host = host.toLowerCase();
  return ALLOWED_HOSTS.some((d) => host === d || host.endsWith('.' + d));
}

function guardScript(allowedOrigin: string) {
  return `<script>(function(){
var ALLOWED=${JSON.stringify(allowedOrigin)};
try{window.open=function(){return null;};}catch(e){}
document.addEventListener('click',function(e){
  var a=e.target&&e.target.closest&&e.target.closest('a[href]');
  if(!a)return;
  try{var u=new URL(a.href,location.href);
    if(u.origin!==ALLOWED&&(a.target==='_blank'||a.target==='_top'||a.target==='_parent')){
      e.preventDefault();e.stopImmediatePropagation();}
  }catch(_){
  }
},true);
try{if(window.navigation&&navigation.addEventListener){
  navigation.addEventListener('navigate',function(e){
    try{var u=new URL(e.destination.url);
      if(e.cancelable&&u.origin!==ALLOWED&&u.protocol.indexOf('http')===0&&u.origin!==location.origin){e.preventDefault();}
    }catch(_){
    }
  });
}}catch(_){
}
})();</script>`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  if (!target) return new NextResponse('Missing url', { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }
  if (parsed.protocol !== 'https:' || !isAllowedHost(parsed.hostname)) {
    return new NextResponse('Host not allowed', { status: 403 });
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

    // Don't follow redirects blindly — only allow redirects to allowed hosts.
    if (upstream.status >= 300 && upstream.status < 400) {
      const loc = upstream.headers.get('location');
      if (loc) {
        const next = new URL(loc, parsed);
        if (isAllowedHost(next.hostname)) {
          return NextResponse.redirect(
            new URL(`/api/embed?url=${encodeURIComponent(next.toString())}`, request.url)
          );
        }
      }
      return new NextResponse('Blocked redirect', { status: 403 });
    }

    const ct = upstream.headers.get('content-type') ?? '';
    if (!upstream.ok || !ct.includes('text/html')) {
      return new NextResponse('Upstream not HTML', { status: 502 });
    }

    let html = await upstream.text();

    // Strip external ad scripts.
    const adPattern = AD_HOSTS.map((h) => h.replace(/\./g, '\\.')).join('|');
    html = html.replace(
      new RegExp(`<script\\b[^>]*\\bsrc=["'][^"']*(?:${adPattern})[^"']*["'][^>]*>\\s*</script>`, 'gi'),
      ''
    );

    // <base> so relative assets still load from the embed's origin, plus guard.
    const inject = `<base href="${parsed.origin}/">` + guardScript(parsed.origin);
    html = /<head[^>]*>/i.test(html)
      ? html.replace(/<head[^>]*>/i, (m) => m + inject)
      : inject + html;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Security-Policy':
          'sandbox allow-scripts allow-forms allow-presentation',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (err) {
    console.error('[Embed proxy] Error:', err);
    return new NextResponse('Proxy error', { status: 502 });
  }
}
