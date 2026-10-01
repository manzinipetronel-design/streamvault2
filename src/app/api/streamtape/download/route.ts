import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/server/streamtape';

const STREAMTAPE_API = 'https://api.streamtape.com/file';
const MAX_WAIT_SECONDS = 30;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let file = searchParams.get('file')?.trim();
  const tmdbId = searchParams.get('tmdb_id')?.trim();
  const mediaType = searchParams.get('type');
  const season = Number(searchParams.get('season') || 0);
  const episode = Number(searchParams.get('episode') || 0);
  const captchaResponse = searchParams.get('captcha_response')?.trim();
  const login = process.env.STREAMTAPE_LOGIN;
  const key = process.env.STREAMTAPE_KEY || process.env.STREAMTAPE_API_PASSWORD;

  if (!file && (!tmdbId || !['movie', 'tv'].includes(mediaType || ''))) {
    return errorResponse('Provide file, or tmdb_id and type (movie|tv).', 400);
  }
  if (!login || !key) {
    console.error('[Streamtape] Missing STREAMTAPE_LOGIN or STREAMTAPE_KEY.');
    return errorResponse('Streamtape is not configured.', 503);
  }

  try {
    if (!file && tmdbId && mediaType) {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('streamtape_files')
        .select('streamtape_file_id')
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType)
        .eq('season', season)
        .eq('episode', episode)
        .maybeSingle();
      if (error) throw error;
      file = data?.streamtape_file_id;
    }

    if (!file) return errorResponse('No Streamtape file is mapped to this media.', 404);
    if (!/^[A-Za-z0-9_-]+$/.test(file)) return errorResponse('Invalid file parameter.', 400);

    const ticketParams = new URLSearchParams({ file, login, key });
    const ticketResponse = await fetch(`${STREAMTAPE_API}/dlticket?${ticketParams}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const ticketData = await ticketResponse.json();

    if (!ticketResponse.ok || ticketData.status !== 200 || !ticketData.result?.ticket) {
      console.error('[Streamtape] Ticket request failed:', ticketData);
      return errorResponse(ticketData.msg || 'Could not prepare the download.', 502);
    }

    const waitSeconds = Math.min(
      MAX_WAIT_SECONDS,
      Math.max(0, Number(ticketData.result.wait_time) || 0)
    );
    if (waitSeconds > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
    }

    const downloadParams = new URLSearchParams({
      file,
      ticket: ticketData.result.ticket,
    });
    if (captchaResponse) downloadParams.set('captcha_response', captchaResponse);

    const downloadResponse = await fetch(`${STREAMTAPE_API}/dl?${downloadParams}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const downloadData = await downloadResponse.json();

    if (!downloadResponse.ok || downloadData.status !== 200 || !downloadData.result?.url) {
      console.error('[Streamtape] Download-link request failed:', downloadData);
      return errorResponse(downloadData.msg || 'Could not create the download link.', 502);
    }

    return NextResponse.json(
      {
        success: true,
        name: downloadData.result.name,
        size: downloadData.result.size,
        url: downloadData.result.url,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[Streamtape] Request failed:', error);
    return errorResponse('Streamtape request failed.', 502);
  }
}
