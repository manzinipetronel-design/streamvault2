import { NextRequest, NextResponse } from 'next/server';
import { searchMulti } from '@/lib/services/tmdbService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const data = await searchMulti(q);
    const rawResults = Array.isArray(data?.results) ? data.results : [];

    const results = rawResults.map((item: any) => {
      const media_type = item.media_type === 'tv' ? 'tv' : 'movie';
      const title = item.title || item.name || 'Untitled';
      let poster_path = item.poster_path || '';
      if (poster_path && !poster_path.startsWith('http')) {
        poster_path = `https://image.tmdb.org/t/p/w500${poster_path.startsWith('/') ? '' : '/'}${poster_path}`;
      }
      return {
        id: item.id,
        title,
        media_type,
        poster_path,
        vote_average: typeof item.vote_average === 'number' ? item.vote_average : undefined,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
