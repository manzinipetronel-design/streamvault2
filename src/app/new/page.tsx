import { HeaderAvatar } from '@/components/HeaderAvatar';
import FeaturedBanner from '@/components/FeaturedBanner';
import TypeFilterRows, { TypedRowSection } from '@/components/TypeFilterRows';

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

async function fetchNew(endpoint: string) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || '16c821fbbcf070c4961e6a90863619a8';
  const baseUrl = 'https://api.themoviedb.org/3';
  try {
    const res = await fetch(`${baseUrl}${endpoint}?api_key=${apiKey}`, {
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
        fetchNew('/movie/upcoming'),
        fetchNew('/movie/now_playing'),
        fetchNew('/trending/movie/day'),
        fetchNew('/trending/tv/day'),
      ]);
    } catch {}

  const upcomingItems = upcoming.length > 0 ? upcoming : mockMovies;
  const nowPlayingItems =
    nowPlaying.length > 0 ? nowPlaying : mockMovies.map((m) => ({ ...m, id: m.id + 100 }));
  const trendingMoviesItems =
    trendingMovies.length > 0 ? trendingMovies : mockMovies.map((m) => ({ ...m, id: m.id + 200 }));
  const trendingTVItems =
    trendingTV.length > 0 ? trendingTV : mockMovies.map((m) => ({ ...m, id: m.id + 300 }));

    const featuredItems = [];
    for (let i = 0; i < 3; i++) {
      if (trendingMoviesItems[i]) {
        const movie = trendingMoviesItems[i];
        featuredItems.push({
          id: movie.id,
          title: movie.title || movie.name || 'Untitled',
          overview: movie.overview,
          backdropPath: movie.backdrop_path,
          posterPath: movie.poster_path,
          year: (movie.release_date || '').split('-')[0],
          rating: movie.vote_average,
          mediaType: 'movie' as const,
        });
      }
      if (trendingTVItems[i]) {
        const tv = trendingTVItems[i];
        featuredItems.push({
          id: tv.id,
          title: tv.title || tv.name || 'Untitled',
          overview: tv.overview,
          backdropPath: tv.backdrop_path,
          posterPath: tv.poster_path,
          year: (tv.first_air_date || '').split('-')[0],
          rating: tv.vote_average,
          mediaType: 'tv' as const,
        });
      }
    }

    const sections: TypedRowSection[] = [
      {
        title: 'Trending Movies Today',
        items: trendingMoviesItems,
        isMock: trendingMoviesItems.length > 0 && trendingMoviesItems[0].id > 200 && trendingMoviesItems[0].id < 310,
        showRank: true,
        mediaType: 'movie',
        viewAllHref: '/movies',
      },
      {
        title: 'Trending TV Today',
        items: trendingTVItems,
        isMock: trendingTVItems.length > 0 && trendingTVItems[0].id > 300 && trendingTVItems[0].id < 410,
        showRank: true,
        mediaType: 'tv',
        viewAllHref: '/series',
      },
      {
        title: 'Upcoming Hits',
        items: upcomingItems,
        isMock: upcomingItems === mockMovies,
        mediaType: 'movie',
        viewAllHref: '/movies',
      },
      {
        title: 'In Theaters Now',
        items: nowPlayingItems,
        isMock: nowPlayingItems.length > 0 && nowPlayingItems[0].id > 100 && nowPlayingItems[0].id < 210,
        mediaType: 'movie',
        viewAllHref: '/movies',
      },
    ];
    return (
      <div className="page-enter min-h-screen bg-void text-foreground font-sans antialiased selection:bg-violet selection:text-white sv-page">
        <div className="sv-page-inner">
          {featuredItems.length > 0 && (
            <FeaturedBanner items={featuredItems} mediaType="movie" eyebrow="New this week" />
          )}

          <div className="sv-page-head sv-catalog">
            <div>
              <h1 className="sv-page-title font-display">New &amp; Popular</h1>
              <p className="sv-page-sub">Fresh arrivals and what everyone&#8217;s watching right now</p>
            </div>
            <HeaderAvatar />
          </div>

          <TypeFilterRows sections={sections} />
        </div>
      </div>
    );
}
