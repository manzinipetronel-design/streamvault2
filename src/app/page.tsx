import React from 'react';
import MovieRow from '@/components/MovieRow';
import HeroSpotlight from '@/components/HeroSpotlight';
import TopSearchBar from '@/components/TopSearchBar';
import RecentWatchedRow from '@/components/RecentWatchedRow';

const mockHero = {
  id: 1,
  title: 'CHRONO LOCK',
  overview:
    'When a breakthrough quantum experiment ruptures the timeline loop network, a team of rogue spatial extraction engineers must execute a dark heist across historical timelines before the fabric collapses permanently.',
  backdrop_path: '/placeholder-hero',
  poster_path: '',
  vote_average: 8.8,
  release_date: '2026-05-12',
  genre_ids: [28, 878],
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
  {
    id: 105,
    title: 'Silent Echoes',
    overview: '',
    backdrop_path: '',
    poster_path:
      'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&q=80&w=600&h=900',
    vote_average: 8.1,
    release_date: '2026-01-01',
  },
  {
    id: 106,
    title: 'Dark Horizons',
    overview: '',
    backdrop_path: '',
    poster_path:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600&h=900',
    vote_average: 8.6,
    release_date: '2026-01-01',
  },
];

async function fetchGenreMovies(genreId?: number, endpoint?: string) {
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

export default async function HomePage() {
  let trending: any[] = [];
  let action: any[] = [];
  let scifi: any[] = [];
  let comedy: any[] = [];
  let trendingTV: any[] = [];
  try {
    [trending, action, scifi, comedy, trendingTV] = await Promise.all([
      fetchGenreMovies(undefined, '/trending/movie/week'),
      fetchGenreMovies(28),
      fetchGenreMovies(878),
      fetchGenreMovies(35),
      fetchGenreMovies(undefined, '/trending/tv/week'),
    ]);
  } catch {}

  const trendingItems = trending.length > 0 ? trending : mockMovies;
  const actionItems =
    action.length > 0 ? action : mockMovies.map((m) => ({ ...m, id: m.id + 100 }));
  const scifiItems =
    scifi.length > 0 ? scifi : mockMovies.map((m) => ({ ...m, id: m.id + 200 }));
  const comedyItems =
    comedy.length > 0 ? comedy : mockMovies.map((m) => ({ ...m, id: m.id + 300 }));
  const trendingTVItems =
    trendingTV.length > 0 ? trendingTV : mockMovies.map((m) => ({ ...m, id: m.id + 400 }));

  const heroItems = [];
  for (let i = 0; i < 3; i++) {
    if (trendingItems[i]) heroItems.push({ ...trendingItems[i], mediaType: 'movie' as const });
    if (trendingTVItems[i]) heroItems.push({ ...trendingTVItems[i], mediaType: 'tv' as const });
  }

  return (
    <div className="page-enter min-h-screen bg-void text-foreground overflow-x-hidden font-sans antialiased selection:bg-violet selection:text-white">
      <TopSearchBar />

      {/* Spotlight hero — main has no padding anymore, so this is
          naturally full-bleed with no negative-margin trick needed.
          Left-aligned title block, poster-strip switcher, quick
          favorite/watchlist actions wired to Supabase-backed lists. */}
      <HeroSpotlight items={heroItems} mockHero={mockHero} />

      {/* Rows of content — this is the one part of the page that DOES need
          its own safe-area padding, since main no longer provides any and
          row titles/cards shouldn't start directly under the floating rail. */}
      <div className="relative z-20 pb-16 pt-8 flex flex-col px-5 md:pl-28 md:pr-10">
        <RecentWatchedRow />
        <MovieRow
          title="Trending now"
          items={trendingItems}
          isMock={trendingItems === mockMovies}
          showRank={true}
          viewAllHref="/new"
        />
        <MovieRow
          title="Popular series"
          items={trendingTVItems}
          isMock={trendingTVItems.length > 0 && trendingTVItems[0].id > 400 && trendingTVItems[0].id < 510}
          mediaType="tv"
          viewAllHref="/series"
        />
        <MovieRow
          title="Mind-bending sci-fi"
          items={scifiItems}
          isMock={scifiItems.length > 0 && scifiItems[0].id > 200 && scifiItems[0].id < 310}
          viewAllHref="/browse/catalog?genre=878&name=Mind-bending%20sci-fi"
        />
        <MovieRow
          title="Blockbuster action"
          items={actionItems}
          isMock={actionItems.length > 0 && actionItems[0].id > 100 && actionItems[0].id < 210}
          viewAllHref="/browse/catalog?genre=28&name=Blockbuster%20action"
        />
        <MovieRow
          title="Top-rated comedies"
          items={comedyItems}
          isMock={comedyItems.length > 0 && comedyItems[0].id > 300 && comedyItems[0].id < 410}
          viewAllHref="/browse/catalog?genre=35&name=Top-rated%20comedies"
        />
      </div>
    </div>
  );
}
