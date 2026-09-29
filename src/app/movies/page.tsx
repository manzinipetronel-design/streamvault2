import HeaderAvatar from '@/components/HeaderAvatar';
import GenreBrowser, { RowSection } from '@/components/GenreBrowser';
import FeaturedBanner from '@/components/FeaturedBanner';

const MOVIE_CHIP_GENRES = [
  { id: 28, label: 'Action' },
  { id: 878, label: 'Sci-Fi' },
  { id: 35, label: 'Comedy' },
  { id: 27, label: 'Horror' },
  { id: 18, label: 'Drama' },
  { id: 16, label: 'Animation' },
  { id: 53, label: 'Thriller' },
  { id: 10749, label: 'Romance' },
];

const mockMovies = [
  {
    id: 101,
    title: 'Nebula Matrix',
    overview: '',
    backdrop_path: '',
    poster_path:
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=600&h=900',
    vote_average: 8.4,
    release_date: '2026-01-01',
  },
  {
    id: 102,
    title: 'Shadow Protocol',
    overview: '',
    backdrop_path: '',
    poster_path:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600&h=900',
    vote_average: 7.9,
    release_date: '2025-01-01',
  },
  {
    id: 103,
    title: 'The Whispering',
    overview: '',
    backdrop_path: '',
    poster_path:
      'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?auto=format&fit=crop&q=80&w=600&h=900',
    vote_average: 8.2,
    release_date: '2026-01-01',
  },
  {
    id: 104,
    title: 'Eldoria Dominion',
    overview: '',
    backdrop_path: '',
    poster_path:
      'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&q=80&w=600&h=900',
    vote_average: 7.5,
    release_date: '2025-01-01',
  },
];

async function fetchMovies(genreId?: number, endpoint?: string) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || '16c821fbbcf070c4961e6a90863619a8';
  const baseUrl = 'https://api.themoviedb.org/3';
  if (!apiKey) return [];
  const url = genreId
    ? `${baseUrl}/discover/movie?api_key=${apiKey}&with_genres=${genreId}&sort_by=popularity.desc&include_adult=false`
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

export default async function MoviesPage() {
  let popular: any[] = [];
  let action: any[] = [];
  let scifi: any[] = [];
  let comedy: any[] = [];
  try {
    [popular, action, scifi, comedy] = await Promise.all([
      fetchMovies(undefined, '/movie/popular'),
      fetchMovies(28),
      fetchMovies(878),
      fetchMovies(35),
    ]);
  } catch {}

  const popularItems = popular.length > 0 ? popular : mockMovies;
  const actionItems =
    action.length > 0 ? action : mockMovies.map((m) => ({ ...m, id: m.id + 100 }));
  const scifiItems =
    scifi.length > 0 ? scifi : mockMovies.map((m) => ({ ...m, id: m.id + 200 }));
  const comedyItems =
    comedy.length > 0 ? comedy : mockMovies.map((m) => ({ ...m, id: m.id + 300 }));

  const sections: RowSection[] = [
    { title: 'Popular Movies', items: popularItems, isMock: popularItems === mockMovies, showRank: true, viewAllHref: '/new' },
    { title: 'Action & Adventure', items: actionItems, isMock: actionItems.length > 0 && actionItems[0].id > 100 && actionItems[0].id < 210, viewAllHref: '/browse/catalog?genre=28&name=Action%20%26%20Adventure' },
    { title: 'Sci-Fi & Fantasy', items: scifiItems, isMock: scifiItems.length > 0 && scifiItems[0].id > 200 && scifiItems[0].id < 310, viewAllHref: '/browse/catalog?genre=878&name=Sci-Fi%20%26%20Fantasy' },
    { title: 'Comedy Hits', items: comedyItems, isMock: comedyItems.length > 0 && comedyItems[0].id > 300 && comedyItems[0].id < 410, viewAllHref: '/browse/catalog?genre=35&name=Comedy%20Hits' },
  ];

  return (
    <div className="page-enter min-h-screen bg-void text-foreground font-sans antialiased selection:bg-violet selection:text-white sv-page">
      <div className="sv-page-inner">
        <div className="sv-page-head sv-catalog">
          <div>
            <h1 className="sv-page-title font-display">Movies</h1>
            <p className="sv-page-sub">Everything to watch, browsable by genre</p>
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
              year: (m.release_date || '').split('-')[0],
              rating: m.vote_average,
            }))}
            mediaType="movie"
            eyebrow="Popular this week"
          />
        )}
        <GenreBrowser mediaType="movie" genres={MOVIE_CHIP_GENRES} sections={sections} />
      </div>
    </div>
  );
}
