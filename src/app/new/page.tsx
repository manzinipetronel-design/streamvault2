import Link from 'next/link';
import MovieRow from '@/components/MovieRow';
import HeroCarousel from '@/components/HeroCarousel';
import HeaderAvatar from '@/components/HeaderAvatar';

const mockHero = {
  id: 4,
  title: 'QUANTUM PULSE',
  overview:
    'Fresh arrivals and high-octane premieres. Experience tomorrow’s blockbusters today with uncompressed spatial fidelity.',
  backdrop_path: '/placeholder-hero',
  poster_path: '',
  vote_average: 8.9,
  release_date: '2026-05-01',
};

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
];

async function fetchNew(genreId?: number, endpoint?: string) {
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

export default async function NewAndPopularPage() {
  let upcoming: any[] = [];
  let nowPlaying: any[] = [];
  let trendingMovies: any[] = [];
  let trendingTV: any[] = [];
  try {
    [upcoming, nowPlaying, trendingMovies, trendingTV] = await Promise.all([
      fetchNew(undefined, '/movie/upcoming'),
      fetchNew(undefined, '/movie/now_playing'),
      fetchNew(undefined, '/trending/movie/day'),
      fetchNew(undefined, '/trending/tv/day'),
    ]);
  } catch {}

  const upcomingItems = upcoming.length > 0 ? upcoming : mockMovies;
  const nowPlayingItems =
    nowPlaying.length > 0 ? nowPlaying : mockMovies.map((m) => ({ ...m, id: m.id + 100 }));
  const trendingMoviesItems =
    trendingMovies.length > 0 ? trendingMovies : mockMovies.map((m) => ({ ...m, id: m.id + 200 }));
  const trendingTVItems =
    trendingTV.length > 0 ? trendingTV : mockMovies.map((m) => ({ ...m, id: m.id + 300 }));

  return (
    <div className="page-enter min-h-screen bg-void text-foreground overflow-x-hidden font-sans antialiased selection:bg-violet selection:text-white pb-20">
      <div className="sv-page-inner pt-20 md:pt-14 px-4 md:px-0">
        <div className="sv-page-head sv-catalog mb-6 md:mb-8">
          <div>
            <h1 className="sv-page-title font-display">New &amp; Popular</h1>
            <p className="sv-page-sub">Fresh arrivals, trending hits, and this week&apos;s must-watch picks</p>
          </div>
          <HeaderAvatar />
        </div>
      </div>

      <HeroCarousel movies={upcoming.slice(0, 5)} mockHero={mockHero} spotlightStyles />

      <div className="relative z-20 pb-32 -mt-8 flex flex-col">
        <MovieRow
          title="Upcoming Hits"
          items={upcomingItems}
          isMock={upcomingItems === mockMovies}
          spotlightStyles
        />
        <MovieRow
          title="In Theaters Now"
          items={nowPlayingItems}
          isMock={nowPlayingItems.length > 0 && nowPlayingItems[0].id > 100 && nowPlayingItems[0].id < 210}
          spotlightStyles
        />
        <MovieRow
          title="Trending Movies Today"
          items={trendingMoviesItems}
          isMock={trendingMoviesItems.length > 0 && trendingMoviesItems[0].id > 200 && trendingMoviesItems[0].id < 310}
          mediaType="movie"
          spotlightStyles
        />
        <MovieRow
          title="Trending TV Today"
          items={trendingTVItems}
          isMock={trendingTVItems.length > 0 && trendingTVItems[0].id > 300 && trendingTVItems[0].id < 410}
          mediaType="tv"
          spotlightStyles
        />
      </div>
    </div>
  );
}
