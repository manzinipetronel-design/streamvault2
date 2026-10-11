import HeaderAvatar from '@/components/HeaderAvatar';
import KidsCatalog from '@/components/KidsCatalog';
import FeaturedBanner from '@/components/FeaturedBanner';
import GenreBrowser, { RowSection } from '@/components/GenreBrowser';
import { getIsKidsProfile } from '@/lib/profileAccess';

const SERIES_CHIP_GENRES = [
  { id: 18, label: 'Drama' },
  { id: 35, label: 'Comedy' },
  { id: 10765, label: 'Sci-Fi & Fantasy' },
  { id: 16, label: 'Animation' },
  { id: 80, label: 'Crime' },
  { id: 9648, label: 'Mystery' },
  { id: 10759, label: 'Action & Adventure' },
  { id: 99, label: 'Documentary' },
];

const mockSeries = [
  {
    id: 101,
    title: 'Starline Echoes',
    name: 'Starline Echoes',
    overview: '',
    backdrop_path: '',
    poster_path:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=600&h=900',
    vote_average: 8.7,
    first_air_date: '2024-01-01',
  },
  {
    id: 102,
    title: 'Glass Horizon',
    name: 'Glass Horizon',
    overview: '',
    backdrop_path: '',
    poster_path:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=600&h=900',
    vote_average: 8.1,
    first_air_date: '2023-01-01',
  },
  {
    id: 103,
    title: 'The Hollow Circuit',
    name: 'The Hollow Circuit',
    overview: '',
    backdrop_path: '',
    poster_path:
      'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=600&h=900',
    vote_average: 7.9,
    first_air_date: '2025-01-01',
  },
  {
    id: 104,
    title: 'Velvet Signal',
    name: 'Velvet Signal',
    overview: '',
    backdrop_path: '',
    poster_path:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600&h=900',
    vote_average: 8.3,
    first_air_date: '2024-01-01',
  },
];

async function fetchSeries(genreId?: number, endpoint?: string) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || '16c821fbbcf070c4961e6a90863619a8';
  const baseUrl = 'https://api.themoviedb.org/3';

  if (!apiKey) return [];

  const url = genreId
    ? `${baseUrl}/discover/tv?api_key=${apiKey}&with_genres=${genreId}&sort_by=popularity.desc&include_adult=false`
    : `${baseUrl}${endpoint}?api_key=${apiKey}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ genre?: string }>;
}

export default async function SeriesPage({ searchParams }: PageProps) {
  if (await getIsKidsProfile()) return <KidsCatalog page="series" />;

  const { genre } = await searchParams;
  const initialGenre = genre ? Number(genre) : undefined;

  let popular: any[] = [];
  let drama: any[] = [];
  let scifi: any[] = [];
  let comedy: any[] = [];

  try {
    [popular, drama, scifi, comedy] = await Promise.all([
      fetchSeries(undefined, '/tv/popular'),
      fetchSeries(18),
      fetchSeries(10765),
      fetchSeries(35),
    ]);
  } catch {
    // fall back to mock data if TMDB is unavailable
  }

  const popularItems = popular.length > 0 ? popular : mockSeries;
  const dramaItems = drama.length > 0 ? drama : mockSeries.map((m) => ({ ...m, id: m.id + 100 }));
  const scifiItems = scifi.length > 0 ? scifi : mockSeries.map((m) => ({ ...m, id: m.id + 200 }));
  const comedyItems = comedy.length > 0 ? comedy : mockSeries.map((m) => ({ ...m, id: m.id + 300 }));

  const sections: RowSection[] = [
    {
      title: 'Popular Series',
      items: popularItems,
      isMock: popularItems === mockSeries,
      showRank: true,
      viewAllHref: '/browse/catalog?collection=popular-tv&name=Popular%20Series',
    },
    {
      title: 'Drama Series',
      items: dramaItems,
      isMock: dramaItems.length > 0 && dramaItems[0].id > 300 && dramaItems[0].id < 410,
      viewAllHref: '/browse/catalog?genre=18&type=tv&name=Drama%20Series',
    },
    {
      title: 'Sci-Fi & Fantasy Series',
      items: scifiItems,
      isMock: scifiItems.length > 0 && scifiItems[0].id > 400 && scifiItems[0].id < 510,
      viewAllHref: '/browse/catalog?genre=10765&type=tv&name=Sci-Fi%20%26%20Fantasy%20Series',
    },
    {
      title: 'Comedy Series',
      items: comedyItems,
      isMock: comedyItems.length > 0 && comedyItems[0].id > 500 && comedyItems[0].id < 610,
      viewAllHref: '/browse/catalog?genre=35&type=tv&name=Comedy%20Series',
    },
  ];

  return (
    <div className="page-enter min-h-screen bg-void text-foreground font-sans antialiased selection:bg-violet selection:text-white sv-page">
      <div className="sv-page-inner">
        <div className="sv-page-head sv-catalog">
          <div>
            <h1 className="sv-page-title font-display">Series</h1>
            <p className="sv-page-sub">Shows and series, browsable by genre</p>
          </div>
          <HeaderAvatar />
        </div>

        {popularItems[0] && (
          <FeaturedBanner
            items={popularItems.slice(0, 6).map((m) => ({
              id: m.id,
              title: m.title || m.name || 'Untitled',
              overview: m.overview,
              backdropPath: m.backdrop_path,
              posterPath: m.poster_path,
              year: (m.first_air_date || '').split('-')[0],
              rating: m.vote_average,
            }))}
            mediaType="tv"
            eyebrow="Popular this week"
          />
        )}

        <GenreBrowser
          mediaType="tv"
          genres={SERIES_CHIP_GENRES}
          sections={sections}
          initialGenre={initialGenre}
        />
      </div>
    </div>
  );
}
