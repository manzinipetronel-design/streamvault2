// Server-side helpers for the "Max shield" embed proxy (/api/embed).
//
// Three jobs:
//   1. sanitizeEmbedHtml()  – strip ad scripts / iframes / pixels / meta-refresh
//                             from the fetched embed page (host-based, so it
//                             can't be fooled by quoting style or URL tricks).
//   2. buildGuardScript()   – the script injected at the very top of <head>
//                             that neutralises popups, link hijacks and
//                             redirects from inside the frame and reports
//                             what it blocked back to the parent page.
//   3. buildEmbedCsp()      – response CSP (sandbox + a few hardening rules).
//
// Nothing in here is a security boundary on its own. The real boundary is the
// CSP `sandbox` header (opaque origin, no allow-popups, no allow-top-navigation).

export const AD_HOSTS = [
  // pop / push / direct-response networks
  'exoclick.com', 'exosrv.com', 'exdynsrv.com', 'magsrv.com', 'realsrv.com',
  'trafficjunky.net', 'popads.net', 'popcash.net', 'pop.cash', 'popunder.net',
  'popuptraffic.com', 'propellerads.com', 'hilltopads.net', 'adsterra.com',
  'highperformanceformat.com', 'juicyads.com', 'plugrush.com', 'clickadu.com',
  'adcash.com', 'bidvertiser.com', 'yllix.com', 'clkmon.com', 'clkrev.com',
  'go2speed.org', 'tsyndicate.com', 'trafficstars.com', 'onclickads.net',
  'ad-maven.com', 'admaven.com', 'monetag.com', 'a-ads.com', 'zedo.com',
  // programmatic / display / native
  'adnxs.com', 'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
  'amazon-adsystem.com', 'rubiconproject.com', 'pubmatic.com', 'openx.net',
  'criteo.com', 'criteo.net', 'smartadserver.com', 'adform.net',
  'casalemedia.com', 'moatads.com', '2mdn.net', 'serving-sys.com',
  'revcontent.com', 'outbrain.com', 'taboola.com', 'mgid.com', 'adskeeper.co.uk',
];

export function isAdHost(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, '');
  return AD_HOSTS.some((d) => h === d || h.endsWith('.' + d));
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Matches an ad host appearing as a whole hostname inside arbitrary text
// (used to drop inline <script> blocks that bootstrap an ad network).
const INLINE_AD_RE = new RegExp(
  '(?:^|[^a-z0-9-])(?:' + AD_HOSTS.map(escapeRe).join('|') + ')(?![a-z0-9-])',
  'i'
);

function getAttr(attrs: string, name: string): string | undefined {
  const m = new RegExp(
    '\\s' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))',
    'i'
  ).exec(' ' + attrs);
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}

function urlIsAd(raw: string | undefined, base: URL): boolean {
  if (!raw) return false;
  try {
    const u = new URL(raw.trim(), base); // resolves //protocol-relative and relative URLs
    return (u.protocol === 'http:' || u.protocol === 'https:') && isAdHost(u.hostname);
  } catch {
    return false;
  }
}

export interface SanitizeResult {
  html: string;
  removed: number;
}

export function sanitizeEmbedHtml(input: string, base: URL): SanitizeResult {
  let removed = 0;
  const drop = () => {
    removed++;
    return '';
  };
  let html = input;

  // <script src=ad> and inline scripts that bootstrap an ad network
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (full, attrs: string, body: string) => {
    const src = getAttr(attrs, 'src');
    if (src !== undefined) return urlIsAd(src, base) ? drop() : full;
    return body && INLINE_AD_RE.test(body) ? drop() : full;
  });

  // <iframe src=ad>
  html = html.replace(/<iframe\b([^>]*)>[\s\S]*?<\/iframe\s*>/gi, (full, attrs: string) =>
    urlIsAd(getAttr(attrs, 'src'), base) ? drop() : full
  );

  // <link href=ad> (preload/prefetch/preconnect) and <img src=ad> (tracking pixels)
  html = html.replace(/<(link|img)\b([^>]*)>/gi, (full, tag: string, attrs: string) =>
    urlIsAd(getAttr(attrs, tag.toLowerCase() === 'link' ? 'href' : 'src'), base) ? drop() : full
  );

  // <meta http-equiv="refresh"> is a no-JS redirect
  html = html.replace(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, drop);

  // The embed's own <base> would fight the one we inject.
  html = html.replace(/<base\b[^>]*>/gi, '');

  return { html, removed };
}

// Runs inside the (sandboxed, opaque-origin) embed document.
// Plain ES5 on purpose: it executes before anything else on the page.
const GUARD_SOURCE = `(function(){
if(window.__svGuard)return;window.__svGuard=1;
var ALLOWED=__ALLOWED__;
var last=0;
function post(m){try{parent.postMessage(m,'*');}catch(e){}}
function report(kind){var n=Date.now();if(n-last<250)return;last=n;post({type:'sv-shield',kind:kind});}
post({type:'sv-shield',kind:'ready'});

/* 1. Storage / cookie shims: an opaque origin makes these throw, which
      crashes a lot of players. Give them in-memory versions instead. */
function mem(){var d={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null;},setItem:function(k,v){d[k]=String(v);},removeItem:function(k){delete d[k];},clear:function(){d={};},key:function(i){return Object.keys(d)[i]||null;},get length(){return Object.keys(d).length;}};}
['localStorage','sessionStorage'].forEach(function(n){
  try{void window[n];}catch(e){try{Object.defineProperty(window,n,{configurable:true,get:(function(s){return function(){return s;};})(mem())});}catch(_){} }
});
try{void document.cookie;}catch(e){try{var cj={};Object.defineProperty(document,'cookie',{configurable:true,get:function(){return Object.keys(cj).map(function(k){return k+'='+cj[k];}).join('; ');},set:function(v){var p=String(v).split(';')[0],i=p.indexOf('=');if(i>0)cj[p.slice(0,i).trim()]=p.slice(i+1);}});}catch(_){} }

/* 2. window.open -> decoy window. Returning null makes popup scripts fall
      back to redirecting the page; a believable fake makes them stand down. */
function decoy(){var d={write:function(){},writeln:function(){},close:function(){},open:function(){return d;}};var w={closed:false,focus:function(){},blur:function(){},close:function(){w.closed=true;},postMessage:function(){},document:d,location:{href:'',assign:function(){},replace:function(){}}};return w;}
var fakeOpen=function(){report('popup');return decoy();};
try{Object.defineProperty(window,'open',{value:fakeOpen,writable:false,configurable:false});}catch(e){try{window.open=fakeOpen;}catch(_){} }

/* 3. Links: block anything that leaves the embed's origin or targets a new
      browsing context. Covers real clicks, middle-clicks, a.click() and
      synthetic click events on detached anchors. */
function bad(a){try{var u=new URL(a.href,location.href);if(u.protocol!=='http:'&&u.protocol!=='https:')return false;return u.origin!==ALLOWED||(!!a.target&&a.target!=='_self');}catch(_){return false;}}
function onClick(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(a&&bad(a)){e.preventDefault();report('link');}}
document.addEventListener('click',onClick,true);
document.addEventListener('auxclick',onClick,true);
try{var ac=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(bad(this)){report('link');return;}return ac.apply(this,arguments);};}catch(e){}
try{var de=EventTarget.prototype.dispatchEvent;EventTarget.prototype.dispatchEvent=function(ev){try{if(ev&&ev.type==='click'&&this instanceof HTMLAnchorElement&&bad(this)){report('link');return false;}}catch(_){}return de.apply(this,arguments);};}catch(e){}
try{var fs=HTMLFormElement.prototype.submit;HTMLFormElement.prototype.submit=function(){try{var u=new URL(this.action||location.href,location.href);if((this.target&&this.target!=='_self')||(u.origin!==ALLOWED&&u.origin!==location.origin)){report('form');return;}}catch(_){}return fs.apply(this,arguments);};}catch(e){}

/* 4. Script-driven redirects (Chromium Navigation API; other browsers rely on
      the parent page's redirect recovery). */
try{if(window.navigation&&navigation.addEventListener){navigation.addEventListener('navigate',function(e){try{if(!e.cancelable)return;var u=new URL(e.destination.url);if((u.protocol==='http:'||u.protocol==='https:')&&u.origin!==ALLOWED&&u.origin!==location.origin){e.preventDefault();report('redirect');}}catch(_){}});}}catch(e){}

/* 5. Click-hijack overlays and injected meta-refresh. Deliberately
      conservative so a player's own transparent click layer survives:
      only (a) cross-origin <a> covering the viewport, or (b) an empty,
      media-less, max-z-index layer covering the viewport. */
function suspect(el){
  if(!el||el.nodeType!==1)return false;
  var tn=el.tagName;
  if(tn==='SCRIPT'||tn==='STYLE'||tn==='VIDEO'||tn==='IFRAME'||tn==='BODY'||tn==='HTML'||tn==='HEAD')return false;
  var cs;try{cs=getComputedStyle(el);}catch(_){return false;}
  if(cs.position!=='fixed'&&cs.position!=='absolute')return false;
  var r=el.getBoundingClientRect();
  if(r.width<(innerWidth||1)*0.5||r.height<(innerHeight||1)*0.5)return false;
  if(tn==='A'){try{var u=new URL(el.href,location.href);if((u.protocol==='http:'||u.protocol==='https:')&&u.origin!==ALLOWED)return true;}catch(_){} }
  var z=parseInt(cs.zIndex,10);
  if(z>=2147483000&&!(el.textContent||'').trim()&&!el.querySelector('video,canvas,svg,img,button,input,audio,iframe'))return true;
  return false;
}
function kill(n){try{if(n.parentNode){n.parentNode.removeChild(n);report('overlay');}}catch(_){} }
function check(n){
  if(!n||n.nodeType!==1)return;
  if(n.tagName==='META'&&/refresh/i.test(n.getAttribute('http-equiv')||'')){kill(n);return;}
  if(suspect(n)){kill(n);return;}
  if(n.querySelectorAll){var as=n.querySelectorAll('a[href]');for(var i=0;i<as.length;i++){if(suspect(as[i]))kill(as[i]);}}
}
try{
  new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var ad=ms[i].addedNodes;for(var j=0;j<ad.length;j++){(function(n){setTimeout(function(){check(n);},0);})(ad[j]);}}}).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(function(){var b=document.body;if(!b)return;var c=b.children;for(var i=0;i<c.length;i++)check(c[i]);},2000);
}catch(e){}
})();`;

export function buildGuardScript(allowedOrigin: string): string {
  return '<script>' + GUARD_SOURCE.replace('__ALLOWED__', JSON.stringify(allowedOrigin)) + '</script>';
}

export function buildEmbedCsp(
  allowedOrigin: string,
  opts?: { isolated?: boolean; appOrigin?: string }
): string {
  const parts: string[] = [
    opts?.isolated
      ? // Isolated host: same-origin is safe here (no app cookies), so storage
        // works and fewer players detect the sandbox. Still no popups / top-nav,
        // and nested ad frames inherit these restrictions.
        'sandbox allow-scripts allow-same-origin allow-forms allow-presentation'
      : 'sandbox allow-scripts allow-forms allow-presentation',
    "object-src 'none'",
    `base-uri ${allowedOrigin}`,
    `form-action ${allowedOrigin}`,
    `frame-ancestors ${opts?.isolated && opts.appOrigin ? opts.appOrigin : "'self'"}`
  ];
  return parts.join('; ');
}
