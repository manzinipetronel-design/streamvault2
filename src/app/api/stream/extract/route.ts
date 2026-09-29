import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tmdb_id = searchParams.get('tmdb_id');
  const type = searchParams.get('type');
  const season = searchParams.get('season') ? Number(searchParams.get('season')) : 1;
  const episode = searchParams.get('episode') ? Number(searchParams.get('episode')) : 1;

  if (!tmdb_id || !type || !['movie', 'tv'].includes(type)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing or invalid parameters. Required: tmdb_id, type (movie|tv). For TV: season, episode.',
      },
      { status: 400 }
    );
  }

  const isMovie = type === 'movie';
  const sources = [
    {
      name: 'MoviesAPI',
      url: isMovie
        ? `https://moviesapi.to/movie/${tmdb_id}`
        : `https://moviesapi.to/tv/${tmdb_id}/${season}/${episode}`,
      type: 'iframe',
    },
    {
      name: 'VidCore',
      url: isMovie
        ? `https://vidcore.org/embed/movie/${tmdb_id}?theme=7B2FFF&autoplay=true`
        : `https://vidcore.org/embed/tv/${tmdb_id}/${season}/${episode}?theme=7B2FFF&autoplay=true`,
      type: 'iframe',
    },
    {
      name: 'VidCore.io',
      url: isMovie
        ? `https://vidcore.net/movie/${tmdb_id}?theme=7B2FFF&autoPlay=true`
        : `https://vidcore.net/tv/${tmdb_id}/${season}/${episode}?theme=7B2FFF&autoPlay=true&nextButton=true`,
      type: 'iframe',
    },
  ];

  return NextResponse.json(
    { success: true, sources },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
