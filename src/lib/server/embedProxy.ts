// Shared helpers for the embed proxy (/api/embed and /api/embed/relay).
//
// Idea: every redirect an embed host tries to hand out is resolved HERE, on
// the server. The browser only ever receives the final, cleaned page, so the
// viewer never sees a redirect, a flash of an ad site, or a navigation.

const BASE_ALLOWED_HOSTS = ['moviesapi.to', 'vidcore.org', 'vidcore.net', 'vidsrc.sh', 'vidsrc2.ru'];

// Extra hosts (mirrors etc.) can be added without a code change:
//   EMBED_EXTRA_ALLOWED_HOSTS=vidsrc.xx,vidsrc.cc
export function allowedHosts(): string[] {
  const extra = (process.env.EMBED_EXTRA_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return [...BASE_ALLOWED_HOSTS, ...extra];
}

export function isAllowedHost(host: string): boolean {
  host = host.toLowerCase();
  return allowedHosts().some((d) => host === d || host.endsWith('.' + d));
}

export function isAllowedUrl(u: URL): boolean {
  return (
    u.protocol === 'https:' &&
    !u.username &&
    !u.password &&
    u.port === '' &&
    isAllowedHost(u.hostname)
  );
}

export const AD_HOSTS = [
  'exoclick.com', 'exosrv.com', 'trafficjunky.net', 'adnxs.com',
  'doubleclick.net', 'googlesyndication.com', 'popads.net', 'popcash.net',
  'propellerads.com', 'hilltopads.net', 'adsterra.com', 'juicyads.com',
  'plugrush.com', 'revcontent.com', 'outbrain.com', 'taboola.com', 'mgid.com',
  'zedo.com', 'clickadu.com', 'adcash.com', 'adskeeper.co.uk',
  'bidvertiser.com', 'yllix.com', 'popunder.net', 'pop.cash',
  'popuptraffic.com', 'clkmon.com', 'clkrev.com', 'go2speed.org',
];

const AD_PATTERN = AD_HOSTS.map((h) => h.replace(/\./g, '\\.')).join('|');
const AD_URL = `(?:https?:)?//(?:[^/"']*\.)?(?:${AD_PATTERN})(?=[/:?#"'])`;

// ── Isolation ───────────────────────────────────────────────────────────────
// "compat" mode serves third-party HTML WITHOUT a CSP sandbox (some players,
// vidsrc.sh among them, refuse to run when sandboxed). That is only safe on an
// origin that holds none of our cookies / storage, so it is refused unless the
// request arrived on a host listed in EMBED_ISOLATED_HOST.
export function isIsolatedHost(request: Request): boolean {
  const configured = (process.env.EMBED_ISOLATED_HOST ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  if (configured.length === 0) return false;
  const trustProxy = process.env.EMBED_TRUST_PROXY === '1';
  const raw =
    (trustProxy ? request.headers.get('x-forwarded-host') : null) ??
    request.headers.get('host') ??
    '';
  const host = raw.split(',')[0].trim().toLowerCase();
  return configured.includes(host);
}

export function embedSecurityHeaders(compat: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  if (compat) {
    const parents = (process.env.EMBED_PARENT_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    headers['Content-Security-Policy'] = `frame-ancestors ${parents.length ? parents.join(' ') : "'none'"}`;
    headers['Referrer-Policy'] = 'origin';
  } else {
    headers['Content-Security-Policy'] =
      "sandbox allow-scripts allow-forms allow-presentation; frame-ancestors 'self'";
    headers['Referrer-Policy'] = 'no-referrer';
  }
  return headers;
}

// ── Bounded body reading ────────────────────────────────────────────────────
export async function readTextCapped(res: Response, max = 3 * 1024 * 1024): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => {});
      throw new Error('Upstream too large');
    }
    chunks.push(value);
  }
  return new TextDecoder('utf-8').decode(Buffer.concat(chunks));
}

// ── Server-side redirect resolution ─────────────────────────────────────────
export class BlockedRedirectError extends Error {
  constructor(public target: string) {
    super(`Blocked redirect to ${target}`);
  }
}

export interface ResolvedResponse {
  res: Response;
  url: URL;
}

export async function fetchResolved(
  start: URL,
  init: {
    headers: Record<string, string>;
    method?: string;
    body?: Uint8Array;
    signal?: AbortSignal;
  },
  maxHops = 6
): Promise<ResolvedResponse> {
  const jars = new Map<string, Map<string, string>>();
  const baseHeaders: Record<string, string> = { ...init.headers };
  let url = start;
  let method = init.method ?? 'GET';
  let body = init.body;

  for (let hop = 0; hop <= maxHops; hop++) {
    if (!isAllowedUrl(url)) {
      throw new BlockedRedirectError(url.toString());
    }

    const headers = { ...baseHeaders };
    const jar = jars.get(url.hostname);
    if (jar?.size) headers.Cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body as BodyInit | undefined,
      redirect: 'manual',
      signal: init.signal,
    });

    const setCookies: string[] =
      (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
    if (setCookies.length) {
      let jarMap = jars.get(url.hostname);
      if (!jarMap) jars.set(url.hostname, (jarMap = new Map()));
      for (const c of setCookies) {
        const [pair] = c.split(';');
        const eq = pair.indexOf('=');
        if (eq > 0) jarMap.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) return { res, url };
      await res.body?.cancel().catch(() => {});
      const next = new URL(loc, url);
      if (next.origin !== url.origin) delete baseHeaders.Origin;
      url = next;
      if (res.status === 303 || ((res.status === 301 || res.status === 302) && method === 'POST')) {
        method = 'GET';
        body = undefined;
        delete baseHeaders['Content-Type'];
      }
      continue;
    }
    return { res, url };
  }
  throw new Error('Too many redirects');
}

// ── HTML sanitising ─────────────────────────────────────────────────────────
export function sanitizeHtml(html: string, pageUrl: URL): string {
  html = html.replace(
    new RegExp(`<script\\b[^>]*\\bsrc=["']\\s*${AD_URL}[^"']*["'][^>]*>\\s*</script>`, 'gi'),
    ''
  );
  html = html.replace(
    new RegExp(`<iframe\\b[^>]*\\bsrc=["']\\s*${AD_URL}[^"']*["'][^>]*>(?:\\s*</iframe>)?`, 'gi'),
    ''
  );
  html = html.replace(/<meta\b[^>]*http-equiv=["']?refresh["']?[^>]*>/gi, (tag) => {
    const m = tag.match(/content=["']?\s*\d*\s*;?\s*url=([^"'>\s]+)/i);
    if (!m) return tag;
    try {
      return isAllowedUrl(new URL(m[1], pageUrl)) ? tag : '';
    } catch {
      return '';
    }
  });
  return html;
}

// ── Scripts injected into the served document ───────────────────────────────
export function guardScript(): string {
  const hosts = JSON.stringify(allowedHosts());
  return `<script>(function(){
var HOSTS=${hosts};
function off(href){
  try{var u=new URL(href,location.href);
    if(u.protocol!=='http:'&&u.protocol!=='https:')return false;
    var h=u.hostname.toLowerCase();
    return !HOSTS.some(function(d){return h===d||h.endsWith('.'+d);});
  }catch(_){return false;}
}
try{window.open=function(){return null;};}catch(e){}
document.addEventListener('click',function(e){
  var a=e.target&&e.target.closest&&e.target.closest('a[href]');
  if(a&&off(a.href)){e.preventDefault();e.stopImmediatePropagation();}
},true);
try{var _click=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){if(off(this.href))return;return _click.apply(this,arguments);};}catch(e){}
try{var _submit=HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit=function(){if(off(this.action))return;return _submit.apply(this,arguments);};
  document.addEventListener('submit',function(e){if(off(e.target.action)){e.preventDefault();e.stopImmediatePropagation();}},true);}catch(e){}
try{if(window.navigation&&navigation.addEventListener){
  navigation.addEventListener('navigate',function(e){
    if(e.cancelable&&off(e.destination.url)){e.preventDefault();}
  });
}}catch(e){}
})();</script>`;
}

// Same-site fetch/XHR from the proxied document would be cross-origin (the
// document lives on our isolated host, not the embed's), so API calls to the
// embed's own host are bounced through /api/embed/relay, where the server adds
// the right Origin/Referer. Media segments are left alone so video bytes never
// flow through our server.
export function relayShim(embedOrigin: string): string {
  return `<script>(function(){
var EMBED=${JSON.stringify(embedOrigin)};
var MEDIA=/\\.(ts|m4s|mp4|webm|aac|mp3|m4a|key|vtt|srt|jpg|jpeg|png|gif|webp|svg|css|js|woff2?)(\\?|$)/i;
function rw(u){
  try{var x=new URL(u,EMBED+'/');
    if(x.origin===EMBED&&!MEDIA.test(x.pathname))return '/api/embed/relay?url='+encodeURIComponent(x.toString());
  }catch(_){ }
  return null;
}
try{var _f=window.fetch;
  window.fetch=function(input,init){
    try{
      var raw=typeof input==='string'||input instanceof URL?input:input&&input.url;
      var r=rw(raw||'');
      if(r){
        if(typeof input==='string'||input instanceof URL)return _f.call(this,r,init);
        return _f.call(this,new Request(r,input),init);
      }
    }catch(_){ }
    return _f.apply(this,arguments);
  };}catch(e){}
try{var _o=XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(m,u){
    var r=rw(u);var a=Array.prototype.slice.call(arguments);
    if(r)a[1]=r;
    return _o.apply(this,a);
  };}catch(e){}
})();</script>`;
}

export function noticePage(message: string): string {
  return `<!doctype html><meta charset="utf-8"><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#9ca3af;font:14px system-ui,sans-serif;text-align:center;padding:24px">${message}</body>`;
}
