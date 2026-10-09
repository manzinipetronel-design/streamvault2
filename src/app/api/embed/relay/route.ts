import { NextResponse } from 'next/server';
import {
  BlockedRedirectError,
  fetchResolved,
  isAllowedUrl,
  isIsolatedHost,
} from '@/lib/server/embedProxy';

const MAX_BODY = 256 * 1024;
const MAX_BYTES = 256 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_BUCKETS = new Map<string, number[]>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('cf-connecting-ip') ?? request.headers.get('x-real-ip') ?? 'unknown';
}

function enforceRateLimit(request: Request): boolean {
  const ip = getClientIp(request);
  const now = Date.now();
  const bucket = RATE_LIMIT_BUCKETS.get(ip) ?? [];
  const recent = bucket.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  if (recent.length > RATE_LIMIT_MAX) {
    RATE_LIMIT_BUCKETS.set(ip, recent);
    return false;
  }
  RATE_LIMIT_BUCKETS.set(ip, recent);
  return true;
}

async function handle(request: Request) {
  if (!isIsolatedHost(request)) return new NextResponse('Not available here', { status: 403 });
  if (!enforceRateLimit(request)) {
    return new NextResponse('Too many requests', { status: 429 });
  }

  const target = new URL(request.url).searchParams.get('url');
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

  const method = request.method === 'POST' ? 'POST' : request.method === 'HEAD' ? 'HEAD' : 'GET';
  const headers: Record<string, string> = {
    'User-Agent': request.headers.get('user-agent') ?? 'Mozilla/5.0',
    Accept: request.headers.get('accept') ?? '*/*',
    'Accept-Language': request.headers.get('accept-language') ?? 'en-US,en;q=0.9',
    Origin: parsed.origin,
    Referer: parsed.origin + '/',
  };
  const ctype = request.headers.get('content-type');
  if (ctype) headers['Content-Type'] = ctype;
  const range = request.headers.get('range');
  if (range) headers.Range = range;

  try {
    const body = method === 'POST' ? new Uint8Array(await request.arrayBuffer()) : undefined;
    if (body && body.byteLength > MAX_BODY) {
      return new NextResponse('Too large', { status: 413 });
    }

    const { res } = await fetchResolved(parsed, {
      headers,
      method,
      body,
      signal: AbortSignal.timeout(20000),
    });

    const type = res.headers.get('content-type') ?? '';
    const len = Number(res.headers.get('content-length') ?? 0);
    if (/^(video|audio)\//i.test(type) || len > MAX_BYTES) {
      await res.body?.cancel().catch(() => {});
      return new NextResponse('Relay is for API calls, not media', { status: 413 });
    }

    const out = new Headers({
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': 'sandbox',
    });
    if (type) out.set('Content-Type', type);
    for (const h of ['content-range', 'accept-ranges']) {
      const v = res.headers.get(h);
      if (v) out.set(h, v);
    }

    let sent = 0;
    const cappedBody = res.body?.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          sent += chunk.byteLength;
          if (sent > MAX_BYTES) {
            controller.error(new Error('too large'));
            return;
          }
          controller.enqueue(chunk);
        },
      })
    );

    return new NextResponse(cappedBody ?? null, { status: res.status, headers: out });
  } catch (err) {
    if (err instanceof BlockedRedirectError) {
      return new NextResponse('Blocked redirect', { status: 403 });
    }
    console.error('[Embed relay] Error:', err);
    return new NextResponse('Relay error', { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
export const HEAD = handle;
