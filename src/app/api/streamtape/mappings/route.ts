import { NextResponse } from 'next/server';
import {
  createServiceClient,
  getStreamtapeFileInfo,
  isStreamtapeAdmin,
} from '@/lib/server/streamtape';

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get('tmdb_id');
  const mediaType = searchParams.get('type');
  const season = Number(searchParams.get('season') || 0);
  const episode = Number(searchParams.get('episode') || 0);

  if (!tmdbId || !['movie', 'tv'].includes(mediaType || '')) {
    return errorResponse('Required: tmdb_id and type (movie|tv).', 400);
  }

  try {
    const supabase = createServiceClient();
    const query = supabase
      .from('streamtape_files')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .eq('media_type', mediaType)
      .eq('season', season)
      .eq('episode', episode)
      .maybeSingle();
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, mapping: data });
  } catch (error) {
    console.error('[Streamtape mappings] Lookup failed:', error);
    return errorResponse('Could not look up the Streamtape mapping.', 500);
  }
}

export async function POST(request: Request) {
  if (!isStreamtapeAdmin(request)) return errorResponse('Unauthorized.', 401);

  let body: {
    tmdb_id?: string;
    type?: 'movie' | 'tv';
    season?: number;
    episode?: number;
    file?: string;
  };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body.', 400);
  }

  const tmdbId = body.tmdb_id?.trim();
  const mediaType = body.type;
  const season = body.season ?? 0;
  const episode = body.episode ?? 0;
  const file = body.file?.trim();
  const isTv = mediaType === 'tv';

  if (!tmdbId || !mediaType || !file || !['movie', 'tv'].includes(mediaType)) {
    return errorResponse('Required: tmdb_id, type, and file.', 400);
  }
  if (!/^[A-Za-z0-9_-]+$/.test(file)) return errorResponse('Invalid Streamtape file ID.', 400);
  if (isTv ? season < 1 || episode < 1 : season !== 0 || episode !== 0) {
    return errorResponse('TV mappings require season and episode; movies must omit them.', 400);
  }

  try {
    const info = (await getStreamtapeFileInfo([file]))[file];
    if (!info || info.status !== 200) return errorResponse('Streamtape file was not found or is unavailable.', 404);

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('streamtape_files')
      .upsert(
        {
          tmdb_id: tmdbId,
          media_type: mediaType,
          season,
          episode,
          streamtape_file_id: file,
          name: info.name ?? null,
          size: info.size ?? null,
          mime_type: info.type ?? null,
          converted: Boolean(info.converted),
          provider_status: info.status ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tmdb_id,media_type,season,episode' }
      )
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, mapping: data }, { status: 201 });
  } catch (error) {
    console.error('[Streamtape mappings] Upsert failed:', error);
    return errorResponse('Could not save the Streamtape mapping.', 500);
  }
}
