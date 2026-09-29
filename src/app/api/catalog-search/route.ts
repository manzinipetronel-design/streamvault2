import { NextRequest, NextResponse } from 'next/server';
import {
  searchMoviesOnProvider,
  searchMoviesByCompany,
  searchMoviesByGenre,
} from '@/lib/services/tmdbService';

// Real search for a channel/studio/genre page: searches TMDB's full catalog
// by title, then cross-checks each candidate against the given provider,
// company, or genre before returning it — not a filter over a preloaded
// sample.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const provider = searchParams.get('provider');
  const company = searchParams.get('company');
  const genre = searchParams.get('genre');

  if (!q) {
    return NextResponse.json({ items: [] });
  }

  try {
    const items = provider
      ? await searchMoviesOnProvider(q, Number(provider))
      : company
        ? await searchMoviesByCompany(q, Number(company))
        : genre
          ? await searchMoviesByGenre(q, Number(genre))
          : [];
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [], error: 'search_failed' }, { status: 500 });
  }
}
