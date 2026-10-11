import { NextRequest, NextResponse } from 'next/server';
import {
  getMoviesByProvider,
  getMoviesByCompany,
  getMoviesByGenre,
  getMovieOnlyByGenre,
  getSeriesByGenre,
  getCatalogCollection,
  getMoviesByEra,
  getKidsCatalog,
  KIDS_CATALOGS,
  type TMDBCatalogCollection,
  type TMDBEraKey,
  type TMDBKidsCollection,
} from '@/lib/services/tmdbService';

const COLLECTIONS: TMDBCatalogCollection[] = [
  'trending-movies',
  'trending-tv',
  'popular-movies',
  'popular-tv',
  'upcoming-movies',
  'now-playing-movies',
];

const ERAS: TMDBEraKey[] = ['2020s', '2010s', '2000s', 'pre2000'];

function positiveInteger(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = positiveInteger(params.get('page')) ?? 1;
  const providerId = positiveInteger(params.get('provider'));
  const companyId = positiveInteger(params.get('company'));
  const genreId = positiveInteger(params.get('genre'));
  const type = params.get('type');
  const collection = COLLECTIONS.find((item) => item === params.get('collection'));
  const era = ERAS.find((item) => item === params.get('era'));
  const kidsParam = params.get('kids');
  const kidsCollection = Object.keys(KIDS_CATALOGS).find(
    (item) => item === kidsParam
  ) as TMDBKidsCollection | undefined;

  if (page < 1 || page > 500) {
    return NextResponse.json({ error: 'invalid_page' }, { status: 400 });
  }
  if (kidsParam !== null && !kidsCollection) {
    return NextResponse.json({ error: 'invalid_catalog' }, { status: 400 });
  }

  try {
    const result = kidsCollection
      ? await getKidsCatalog(kidsCollection, page)
      : providerId
      ? await getMoviesByProvider(providerId, page)
      : companyId
        ? await getMoviesByCompany(companyId, page)
        : genreId
          ? type === 'movie'
            ? await getMovieOnlyByGenre(genreId, page)
            : type === 'tv'
              ? await getSeriesByGenre(genreId, page)
              : await getMoviesByGenre(genreId, page)
          : collection
            ? await getCatalogCollection(collection, page)
            : era
              ? await getMoviesByEra(era, page)
              : null;

    if (!result) return NextResponse.json({ error: 'invalid_catalog' }, { status: 400 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'catalog_fetch_failed' }, { status: 500 });
  }
}