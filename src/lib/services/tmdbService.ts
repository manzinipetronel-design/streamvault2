const TMDB_API_KEY =
  process.env.NEXT_PUBLIC_TMDB_API_KEY || '16c821fbbcf070c4961e6a90863619a8';
const BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Genre ID → name map (TMDB standard)
const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Docs',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War',
};

const ACCENT_COLORS = ['#7B2FFF', '#FF4B6E', '#00E5FF', '#FFB800'];

function getColor(id: number): string {
  return ACCENT_COLORS[id % ACCENT_COLORS.length];
}

function getGenre(genreIds: number[]): string {
  for (const id of genreIds) {
    if (GENRE_MAP[id]) return GENRE_MAP[id];
  }
  return 'Drama';
}

/**
 * Core fetch helper — uses api_key query parameter as per TMDB API v3 docs.
 */
async function tmdbFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API Key is not configured');
  }
  const queryParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'en-US',
    ...params,
  });
  const url = `${BASE_URL}${path}?${queryParams.toString()}`;
  const res = await fetch(url, {
    headers: { accept: 'application/json' },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`TMDB fetch failed: ${res.status} for ${path}`);
  return res.json();
}

export interface TMDBMovie {
  id: number;
  title: string;
  genre: string;
  year: string;
  rating: string;
  color: string;
  img: string;
  alt: string;
  duration: string;
  overview: string;
  backdropImg: string;
}

export interface TMDBShow {
  id: number;
  title: string;
  genre: string;
  year: string;
  rating: string;
  color: string;
  img: string;
  alt: string;
  episodes: string;
  overview: string;
  backdropImg: string;
}

export interface TMDBLineupItem {
  id: number;
  title: string;
  genre: string;
  time: string;
  platform: string;
  views: number;
  color: string;
  img: string;
  alt: string;
  new?: boolean;
  mediaType: 'movie' | 'tv';
}

export interface TMDBForYouCard {
  id: number;
  title: string;
  type: string;
  match: number;
  color: string;
  img: string;
  alt: string;
  tag: string;
}

export interface TMDBSearchResult {
  id: number;
  title: string;
  mediaType: 'movie' | 'tv';
  year: string;
  rating: string;
  img: string;
  alt: string;
  overview: string;
  genre: string;
}

export interface TMDBMovieDetail {
  id: number;
  title: string;
  overview: string;
  releaseDate: string;
  rating: string;
  runtime: number;
  genres: string[];
  img: string;
  backdropImg: string;
  alt: string;
  cast?: string[];
  director?: string;
  certification?: string;
}

export interface TMDBTVDetail {
  id: number;
  name: string;
  overview: string;
  firstAirDate: string;
  rating: string;
  numberOfSeasons: number;
  genres: string[];
  img: string;
  backdropImg: string;
  alt: string;
  cast?: string[];
  creator?: string;
  certification?: string;
}

// Poster URL helper
export function posterUrl(
  path: string | null,
  size: 'w342' | 'w500' | 'original' = 'w342'
): string {
  if (!path) return '/assets/images/no_image.png';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

// Backdrop URL helper — uses TMDB's largest available size since every call
// site renders this as a full-bleed hero background, often wider than the
// 780px w780 used to provide (which was visibly soft/blurry once stretched
// to fill a desktop viewport).
export function backdropUrl(path: string | null): string {
  if (!path) return '/assets/images/no_image.png';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/original${path}`;
}

// Curated high-quality fallbacks for immediate preview responsiveness
const FALLBACK_MOVIES: TMDBMovie[] = [
  {
    id: 693134,
    title: 'Dune: Part Two',
    genre: 'Sci-Fi',
    year: '2024',
    rating: '8.5',
    color: '#FFB800',
    img: 'https://image.tmdb.org/t/p/w500/1pdfLvk8qq9UPmgBGLy0yU30r9q.jpg',
    backdropImg: 'https://image.tmdb.org/t/p/w780/xOMo8BRK7PfcJv9JCnx7s520b4q.jpg',
    duration: '2h 46m',
    overview:
      'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    alt: 'Dune: Part Two movie poster',
  },
  {
    id: 157336,
    title: 'Interstellar',
    genre: 'Sci-Fi',
    year: '2014',
    rating: '8.4',
    color: '#00E5FF',
    img: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropImg: 'https://image.tmdb.org/t/p/w780/rAiYTsqJJR9voeh8Ntav89HgBDb.jpg',
    duration: '2h 49m',
    overview:
      'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.',
    alt: 'Interstellar movie poster',
  },
  {
    id: 27205,
    title: 'Inception',
    genre: 'Action',
    year: '2010',
    rating: '8.4',
    color: '#7B2FFF',
    img: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    backdropImg: 'https://image.tmdb.org/t/p/w780/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    duration: '2h 28m',
    overview:
      'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life.',
    alt: 'Inception movie poster',
  },
  {
    id: 872585,
    title: 'Oppenheimer',
    genre: 'Drama',
    year: '2023',
    rating: '8.1',
    color: '#FF4B6E',
    img: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropImg: 'https://image.tmdb.org/t/p/w780/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    duration: '3h 01m',
    overview:
      "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    alt: 'Oppenheimer movie poster',
  },
  {
    id: 533535,
    title: 'Deadpool & Wolverine',
    genre: 'Action',
    year: '2024',
    rating: '7.7',
    color: '#FF4B6E',
    img: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdropImg: 'https://image.tmdb.org/t/p/w780/yDHYTfA3R0jFYba16jBB1jv8uaC.jpg',
    duration: '2h 08m',
    overview:
      'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary Deadpool behind him.',
    alt: 'Deadpool & Wolverine movie poster',
  },
  {
    id: 912649,
    title: 'Venom: The Last Dance',
    genre: 'Action',
    year: '2024',
    rating: '6.8',
    color: '#7B2FFF',
    img: 'https://image.tmdb.org/t/p/w500/aosm8Vh9yP2AcioTqflx0LamNXH.jpg',
    backdropImg: 'https://image.tmdb.org/t/p/w780/3V4kLQg0kSqPLctI5ziYWMEAZYF.jpg',
    duration: '1h 49m',
    overview:
      'Eddie and Venom are on the run. Hunted by both of their worlds, the duo are forced into a devastating decision.',
    alt: 'Venom: The Last Dance movie poster',
  },
  {
    id: 1022789,
    title: 'Inside Out 2',
    genre: 'Animation',
    year: '2024',
    rating: '7.6',
    color: '#FFB800',
    img: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    backdropImg: 'https://image.tmdb.org/t/p/w780/p5ozvmdgsmbWe0H8wf4KiSS9euQ.jpg',
    duration: '1h 36m',
    overview:
      "Teenager Riley's mind headquarters is undergoing a sudden demolition to make room for unexpected new Emotions!",
    alt: 'Inside Out 2 movie poster',
  },
  {
    id: 155,
    title: 'The Dark Knight',
    genre: 'Action',
    year: '2008',
    rating: '8.5',
    color: '#00E5FF',
    img: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropImg: 'https://image.tmdb.org/t/p/w780/dqK9Hag1054tghRQSqLSfrkvQnA.jpg',
    duration: '2h 32m',
    overview:
      'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.',
    alt: 'The Dark Knight movie poster',
  },
];

const FALLBACK_SHOWS: TMDBShow[] = [
  {
    id: 1396,
    title: 'Breaking Bad',
    genre: 'Crime',
    year: '2008',
    rating: '8.9',
    color: '#00E5FF',
    img: 'https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
    backdropImg: 'https://image.tmdb.org/t/p/w780/9faGSFi5jam6pDWGNd0p8JcJgXQ.jpg',
    episodes: '5 Seasons',
    overview:
      'Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and begins manufacturing methamphetamine.',
    alt: 'Breaking Bad TV show poster',
  },
  {
    id: 66732,
    title: 'Stranger Things',
    genre: 'Sci-Fi',
    year: '2016',
    rating: '8.6',
    color: '#FF4B6E',
    img: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    backdropImg: 'https://image.tmdb.org/t/p/w780/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    episodes: '4 Seasons',
    overview:
      'When a young boy vanishes, a small town uncovers a mystery involving secret experiments and terrifying supernatural forces.',
    alt: 'Stranger Things TV show poster',
  },
  {
    id: 94605,
    title: 'Arcane',
    genre: 'Animation',
    year: '2021',
    rating: '8.7',
    color: '#7B2FFF',
    img: 'https://image.tmdb.org/t/p/w500/abf8tHznhddYiZUlGBGEBR3A6jw.jpg',
    backdropImg: 'https://image.tmdb.org/t/p/w780/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg',
    episodes: '2 Seasons',
    overview:
      'Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies.',
    alt: 'Arcane TV show poster',
  },
  {
    id: 100088,
    title: 'The Last of Us',
    genre: 'Drama',
    year: '2023',
    rating: '8.6',
    color: '#FFB800',
    img: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2V7JMrRI.jpg',
    backdropImg: 'https://image.tmdb.org/t/p/w780/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
    episodes: '1 Season',
    overview:
      'Twenty years after a fungal outbreak ravages the planet, survivors Joel and Ellie are tasked with a mission that could change the world.',
    alt: 'The Last of Us TV show poster',
  },
];

export const tmdbService = {
  getTrendingMovies,
  getTrendingShows,
  getTonightLineup,
  getForYouCards,
  getFeaturedMovie,
  getPopularMovies,
  getMovieDetails,
  getTVDetails,
  searchMovies,
  searchTVShows,
  searchAll,
  getTrending,
  searchMulti,
  getCredits,
  getRelated,
  getPersonDetails,
  getPersonCredits,
};

// GET /trending/movie/week — weekly trending movies
export async function getTrendingMovies(): Promise<TMDBMovie[]> {
  try {
    const data = await tmdbFetch('/trending/movie/week');
    const items = (data.results || []).slice(0, 10).map((m: any) => ({
      id: m.id,
      title: m.title || m.original_title,
      genre: getGenre(m.genre_ids || []),
      year: m.release_date ? m.release_date.slice(0, 4) : '2025',
      rating: m.vote_average ? m.vote_average.toFixed(1) : 'N/A',
      color: getColor(m.id),
      img: posterUrl(m.poster_path),
      alt: `${m.title || m.original_title} movie poster`,
      duration: '2h 00m',
      overview: m.overview || '',
      backdropImg: backdropUrl(m.backdrop_path),
    }));
    return items.length > 0 ? items : FALLBACK_MOVIES;
  } catch {
    return FALLBACK_MOVIES;
  }
}

// GET /trending/tv/week — weekly trending TV shows
export async function getTrendingShows(): Promise<TMDBShow[]> {
  try {
    const data = await tmdbFetch('/trending/tv/week');
    const items = (data.results || []).slice(0, 10).map((s: any) => ({
      id: s.id,
      title: s.name || s.original_name,
      genre: getGenre(s.genre_ids || []),
      year: s.first_air_date ? s.first_air_date.slice(0, 4) : '2025',
      rating: s.vote_average ? s.vote_average.toFixed(1) : 'N/A',
      color: getColor(s.id),
      img: posterUrl(s.poster_path),
      alt: `${s.name || s.original_name} TV show poster`,
      episodes: 'S1 · New',
      overview: s.overview || '',
      backdropImg: backdropUrl(s.backdrop_path),
    }));
    return items.length > 0 ? items : FALLBACK_SHOWS;
  } catch {
    return FALLBACK_SHOWS;
  }
}

// GET /trending/movie/day + /trending/tv/day — tonight's lineup mix
export async function getTonightLineup(): Promise<TMDBLineupItem[]> {
  try {
    const [movies, shows] = await Promise.all([
      tmdbFetch('/trending/movie/day'),
      tmdbFetch('/trending/tv/day'),
    ]);

    const times = [
      '7:30 PM',
      '8:00 PM',
      '8:30 PM',
      '9:00 PM',
      '9:30 PM',
      '10:00 PM',
      '10:30 PM',
      '11:00 PM',
    ];
    const baseViews = [44200, 67300, 89700, 98400, 142800, 178900, 211500, 250000];

    const movieItems: TMDBLineupItem[] = (movies.results || [])
      .slice(0, 4)
      .map((m: any, i: number) => ({
        id: m.id,
        title: m.title || m.original_title,
        genre: getGenre(m.genre_ids || []),
        time: times[i] || '9:00 PM',
        platform: 'Stream',
        views: baseViews[i] || 100000,
        color: getColor(m.id),
        img: posterUrl(m.poster_path),
        alt: `${m.title || m.original_title} movie poster`,
        new: i < 2,
        mediaType: 'movie',
      }));

    const showItems: TMDBLineupItem[] = (shows.results || [])
      .slice(0, 4)
      .map((s: any, i: number) => ({
        id: s.id,
        title: s.name || s.original_name,
        genre: getGenre(s.genre_ids || []),
        time: times[i + 4] || '10:00 PM',
        platform: 'Stream',
        views: baseViews[i + 4] || 80000,
        color: getColor(s.id),
        img: posterUrl(s.poster_path),
        alt: `${s.name || s.original_name} TV show poster`,
        new: i === 0,
        mediaType: 'tv',
      }));

    const combined = [...movieItems, ...showItems];
    if (combined.length > 0) return combined;
  } catch {
    // fallback below
  }

  const times = [
    '7:30 PM',
    '8:00 PM',
    '8:30 PM',
    '9:00 PM',
    '9:30 PM',
    '10:00 PM',
    '10:30 PM',
    '11:00 PM',
  ];
  const baseViews = [44200, 67300, 89700, 98400, 142800, 178900, 211500, 250000];

  const fallbackMovieItems: TMDBLineupItem[] = FALLBACK_MOVIES.slice(0, 4).map((m, i) => ({
    id: m.id,
    title: m.title,
    genre: m.genre,
    time: times[i],
    platform: 'Stream',
    views: baseViews[i],
    color: m.color,
    img: m.img,
    alt: m.alt,
    new: i < 2,
    mediaType: 'movie',
  }));

  const fallbackShowItems: TMDBLineupItem[] = FALLBACK_SHOWS.slice(0, 4).map((s, i) => ({
    id: s.id,
    title: s.title,
    genre: s.genre,
    time: times[i + 4],
    platform: 'Stream',
    views: baseViews[i + 4],
    color: s.color,
    img: s.img,
    alt: s.alt,
    new: i === 0,
    mediaType: 'tv',
  }));

  return [...fallbackMovieItems, ...fallbackShowItems];
}

// GET /movie/top_rated — top rated movies for For You cards
export async function getForYouCards(): Promise<TMDBForYouCard[]> {
  try {
    const data = await tmdbFetch('/movie/top_rated');
    const tags = ['New Episode', 'Trending', 'Fresh Drop', 'Staff Pick'];
    const matches = [97, 94, 91, 88];
    const items = (data.results || []).slice(0, 4).map((m: any, i: number) => ({
      id: m.id,
      title: m.title || m.original_title,
      type: `Film · ${getGenre(m.genre_ids || [])}`,
      match: matches[i] || 85,
      color: getColor(m.id),
      img: posterUrl(m.poster_path),
      alt: `${m.title || m.original_title} movie poster`,
      tag: tags[i] || 'Trending',
    }));
    if (items.length > 0) return items;
  } catch {
    // fallback below
  }

  const tags = ['New Episode', 'Trending', 'Fresh Drop', 'Staff Pick'];
  const matches = [97, 94, 91, 88];
  return FALLBACK_MOVIES.slice(0, 4).map((m, i) => ({
    id: m.id,
    title: m.title,
    type: `Film · ${m.genre}`,
    match: matches[i] || 85,
    color: m.color,
    img: m.img,
    alt: m.alt,
    tag: tags[i] || 'Trending',
  }));
}

// GET /movie/now_playing — featured movie for hero section
export async function getFeaturedMovie(): Promise<{
  title: string;
  overview: string;
  backdropImg: string;
  rating: string;
} | null> {
  try {
    const data = await tmdbFetch('/movie/now_playing');
    const movie = (data.results || [])[0];
    if (movie) {
      return {
        title: movie.title || movie.original_title,
        overview: movie.overview || '',
        backdropImg: backdropUrl(movie.backdrop_path),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
      };
    }
  } catch {
    // fallback below
  }

  const first = FALLBACK_MOVIES[0];
  return {
    title: first.title,
    overview: first.overview,
    backdropImg: first.backdropImg,
    rating: first.rating,
  };
}

// GET /movie/popular — popular movies list
export async function getPopularMovies(): Promise<TMDBMovie[]> {
  try {
    const data = await tmdbFetch('/movie/popular');
    const items = (data.results || []).slice(0, 20).map((m: any) => ({
      id: m.id,
      title: m.title || m.original_title,
      genre: getGenre(m.genre_ids || []),
      year: m.release_date ? m.release_date.slice(0, 4) : '2025',
      rating: m.vote_average ? m.vote_average.toFixed(1) : 'N/A',
      color: getColor(m.id),
      img: posterUrl(m.poster_path),
      alt: `${m.title || m.original_title} movie poster`,
      duration: '2h 00m',
      overview: m.overview || '',
      backdropImg: backdropUrl(m.backdrop_path),
    }));
    return items.length > 0 ? items : FALLBACK_MOVIES;
  } catch {
    return FALLBACK_MOVIES;
  }
}

// GET /discover/movie with a release-date range — powers era-based rows
export interface TMDBEraRow {
  key: string;
  title: string;
  subtitle: string;
  items: TMDBMovie[];
}

const ERA_RANGES: { key: string; title: string; subtitle: string; from: string; to: string }[] = [
  {
    key: '2020s',
    title: '2020s Standouts',
    subtitle: 'Top-rated releases from 2020–2029',
    from: '2020-01-01',
    to: '2029-12-31',
  },
  {
    key: '2010s',
    title: '2010s Essentials',
    subtitle: 'Top-rated releases from 2010–2019',
    from: '2010-01-01',
    to: '2019-12-31',
  },
  {
    key: '2000s',
    title: '2000s Classics',
    subtitle: 'Top-rated releases from 2000–2009',
    from: '2000-01-01',
    to: '2009-12-31',
  },
  {
    key: 'pre2000',
    title: 'Golden Oldies (pre-2000)',
    subtitle: 'Top-rated releases from 1950–1999',
    from: '1950-01-01',
    to: '1999-12-31',
  },
];

export async function getEraRows(): Promise<TMDBEraRow[]> {
  const rows = await Promise.all(
    ERA_RANGES.map(async (era) => {
      try {
        const data = await tmdbFetch('/discover/movie', {
          'primary_release_date.gte': era.from,
          'primary_release_date.lte': era.to,
          sort_by: 'vote_average.desc',
          'vote_count.gte': '1000',
        });
        const items = (data.results || []).slice(0, 12).map((m: any) => ({
          id: m.id,
          title: m.title || m.original_title,
          genre: getGenre(m.genre_ids || []),
          year: m.release_date ? m.release_date.slice(0, 4) : '',
          rating: m.vote_average ? m.vote_average.toFixed(1) : 'N/A',
          color: getColor(m.id),
          img: posterUrl(m.poster_path),
          alt: `${m.title || m.original_title} movie poster`,
          duration: '2h 00m',
          overview: m.overview || '',
          backdropImg: backdropUrl(m.backdrop_path),
        }));
        return { key: era.key, title: era.title, subtitle: era.subtitle, items };
      } catch {
        return { key: era.key, title: era.title, subtitle: era.subtitle, items: [] };
      }
    })
  );
  return rows.filter((r) => r.items.length > 0);
}

// GET /collection/{id} — franchise collections (Star Wars, LOTR, etc.)
export interface TMDBCollectionCard {
  id: number;
  name: string;
  overview: string;
  backdropImg: string;
  posterImg: string;
  movieCount: number;
}

// Well-known TMDB collection ids
const FEATURED_COLLECTIONS = [
  10, // Star Wars Collection
  1241, // Harry Potter Collection
  119, // The Lord of the Rings Collection
  528, // The Terminator Collection
];

export async function getFeaturedCollections(): Promise<TMDBCollectionCard[]> {
  const results = await Promise.all(
    FEATURED_COLLECTIONS.map(async (id) => {
      try {
        const data = await tmdbFetch(`/collection/${id}`);
        return {
          id: data.id,
          name: data.name,
          overview: data.overview || '',
          backdropImg: backdropUrl(data.backdrop_path),
          posterImg: posterUrl(data.poster_path, 'w500'),
          movieCount: (data.parts || []).length,
        };
      } catch {
        return null;
      }
    })
  );
  return results.filter((c): c is TMDBCollectionCard => c !== null);
}

export interface TMDBLogo {
  name: string;
  logoUrl: string | null;
  /** TMDB's own provider_id (networks) or company id (studios) — lets the
   *  Browse page link to a real filtered catalog instead of a text search. */
  id: number | null;
}

// GET /watch/providers/movie — TMDB's official provider list, including logo_path.
// These logos are hosted by TMDB specifically for apps built on their API to display.
// TMDB's exact provider_name spelling isn't guaranteed to match a single
// guessed string (e.g. it may be "Apple TV+" rather than "Apple TV Plus"),
// so each entry lists every spelling we've seen and matching is done on a
// normalized (lowercased, punctuation-stripped) form.
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const NETWORK_ALIASES: { name: string; aliases: string[] }[] = [
  { name: 'Netflix', aliases: ['Netflix'] },
  { name: 'Disney Plus', aliases: ['Disney Plus', 'Disney+'] },
  { name: 'Amazon Prime Video', aliases: ['Amazon Prime Video', 'Prime Video'] },
  { name: 'Max', aliases: ['Max', 'HBO Max'] },
  { name: 'Apple TV Plus', aliases: ['Apple TV Plus', 'Apple TV+'] },
  { name: 'Hulu', aliases: ['Hulu'] },
  { name: 'Crunchyroll', aliases: ['Crunchyroll'] },
  {
    name: 'Paramount Plus',
    aliases: ['Paramount Plus', 'Paramount+', 'Paramount Plus with Showtime', 'Paramount+ with Showtime'],
  },
];
const NETWORK_NAMES = NETWORK_ALIASES.map((n) => n.name);

export async function getNetworkLogos(): Promise<TMDBLogo[]> {
  try {
    const data = await tmdbFetch('/watch/providers/movie', { watch_region: 'US' });
    const providers = data.results || [];
    return NETWORK_ALIASES.map(({ name, aliases }) => {
      const normalizedAliases = aliases.map(normalize);
      // Substring match rather than exact equality — TMDB renames providers
      // over time (e.g. "Paramount+" became "Paramount+ with Showtime"), so
      // matching on "does the provider name contain our alias" survives
      // suffixes/rebrands better than requiring an exact match.
      const match = providers.find((p: any) => {
        const providerNormalized = normalize(p.provider_name || '');
        return normalizedAliases.some((alias) => providerNormalized.includes(alias));
      });
      return {
        name,
        logoUrl: match ? `${TMDB_IMAGE_BASE}/w200${match.logo_path}` : null,
        id: match ? match.provider_id : null,
      };
    });
  } catch {
    return NETWORK_NAMES.map((name) => ({ name, logoUrl: null, id: null }));
  }
}

// GET /search/company — looked up by name at request time (cached) rather than
// hardcoded ids, since TMDB company ids aren't guaranteed stable to guess correctly.
const STUDIO_NAMES = [
  'Marvel Studios',
  'Pixar',
  'Walt Disney Pictures',
  'Warner Bros. Pictures',
  'Universal Pictures',
  'DreamWorks Animation',
  'Paramount',
  'Columbia Pictures',
  '20th Century Studios',
  'Legendary Pictures',
];

export async function getStudioLogos(): Promise<TMDBLogo[]> {
  const results = await Promise.all(
    STUDIO_NAMES.map(async (name) => {
      try {
        const data = await tmdbFetch('/search/company', { query: name });
        const best = (data.results || [])[0];
        return {
          name,
          logoUrl: best?.logo_path ? `${TMDB_IMAGE_BASE}/w200${best.logo_path}` : null,
          id: best?.id ?? null,
        };
      } catch {
        return { name, logoUrl: null, id: null };
      }
    })
  );
  return results;
}

// GET /discover/{movie|tv} filtered by a real watch provider or production
// company — powers the "channel" pages that open when clicking a
// network/studio on Browse. Covers both movies and TV shows, since a real
// streaming service's catalog is a mix of both (e.g. Apple TV+ is known as
// much for shows like Severance as for its movies).
export interface TMDBCatalogItem {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  mediaType: 'movie' | 'tv';
}

function toCatalogItem(m: any, mediaType: 'movie' | 'tv'): TMDBCatalogItem {
  return {
    id: m.id,
    title: (mediaType === 'movie' ? m.title || m.original_title : m.name || m.original_name) || '',
    overview: m.overview || '',
    poster_path: m.poster_path,
    vote_average: m.vote_average || 0,
    release_date: (mediaType === 'movie' ? m.release_date : m.first_air_date) || '',
    mediaType,
  };
}

function mapDiscoverResults(data: any, mediaType: 'movie' | 'tv'): TMDBCatalogItem[] {
  return (data.results || [])
    .filter((m: any) => m.poster_path)
    .map((m: any) => toCatalogItem(m, mediaType));
}

// Real search, not a filter over a preloaded sample: searches TMDB's full
// catalog (movies AND shows) by title, then cross-checks each candidate's
// actual watch providers to confirm it's genuinely available on the given
// service before including it. Capped at the top 20 text-search results per
// type per query to keep the fan-out of per-title lookups reasonable.
const SEARCH_CANDIDATE_LIMIT = 20;

async function checkProviderMatch(
  id: number,
  mediaType: 'movie' | 'tv',
  providerId: number
): Promise<boolean> {
  try {
    const wp = await tmdbFetch(`/${mediaType}/${id}/watch/providers`, {});
    const region = wp.results?.US;
    const availableIds = [
      ...(region?.flatrate || []),
      ...(region?.ads || []),
      ...(region?.free || []),
    ].map((p: any) => p.provider_id);
    return availableIds.includes(providerId);
  } catch {
    return false;
  }
}

async function checkCompanyMatch(
  id: number,
  mediaType: 'movie' | 'tv',
  companyId: number
): Promise<boolean> {
  try {
    const details = await tmdbFetch(`/${mediaType}/${id}`, {});
    const companyIds = (details.production_companies || []).map((c: any) => c.id);
    return companyIds.includes(companyId);
  } catch {
    return false;
  }
}

async function searchBothTypes(query: string): Promise<{ movie: any[]; tv: any[] }> {
  const [movieData, tvData] = await Promise.all([
    tmdbFetch('/search/movie', { query, include_adult: 'false' }),
    tmdbFetch('/search/tv', { query, include_adult: 'false' }),
  ]);
  return {
    movie: (movieData.results || []).filter((m: any) => m.poster_path).slice(0, SEARCH_CANDIDATE_LIMIT),
    tv: (tvData.results || []).filter((m: any) => m.poster_path).slice(0, SEARCH_CANDIDATE_LIMIT),
  };
}

export async function searchMoviesOnProvider(
  query: string,
  providerId: number
): Promise<TMDBCatalogItem[]> {
  if (!query.trim()) return [];
  try {
    const { movie, tv } = await searchBothTypes(query);

    const [movieChecked, tvChecked] = await Promise.all([
      Promise.all(movie.map(async (m) => ((await checkProviderMatch(m.id, 'movie', providerId)) ? m : null))),
      Promise.all(tv.map(async (m) => ((await checkProviderMatch(m.id, 'tv', providerId)) ? m : null))),
    ]);

    return [
      ...movieChecked.filter((m): m is any => m !== null).map((m) => toCatalogItem(m, 'movie')),
      ...tvChecked.filter((m): m is any => m !== null).map((m) => toCatalogItem(m, 'tv')),
    ];
  } catch {
    return [];
  }
}

export async function searchMoviesByCompany(
  query: string,
  companyId: number
): Promise<TMDBCatalogItem[]> {
  if (!query.trim()) return [];
  try {
    const { movie, tv } = await searchBothTypes(query);

    const [movieChecked, tvChecked] = await Promise.all([
      Promise.all(movie.map(async (m) => ((await checkCompanyMatch(m.id, 'movie', companyId)) ? m : null))),
      Promise.all(tv.map(async (m) => ((await checkCompanyMatch(m.id, 'tv', companyId)) ? m : null))),
    ]);

    return [
      ...movieChecked.filter((m): m is any => m !== null).map((m) => toCatalogItem(m, 'movie')),
      ...tvChecked.filter((m): m is any => m !== null).map((m) => toCatalogItem(m, 'tv')),
    ];
  } catch {
    return [];
  }
}

// Genre search is simpler than provider/company: TMDB's search results
// already include genre_ids directly, so no per-title lookup call is needed.
export async function searchMoviesByGenre(query: string, genreId: number): Promise<TMDBCatalogItem[]> {
  if (!query.trim()) return [];
  try {
    const { movie, tv } = await searchBothTypes(query);
    return [
      ...movie.filter((m) => (m.genre_ids || []).includes(genreId)).map((m) => toCatalogItem(m, 'movie')),
      ...tv.filter((m) => (m.genre_ids || []).includes(genreId)).map((m) => toCatalogItem(m, 'tv')),
    ];
  } catch {
    return [];
  }
}

// Fetches several discover pages up front for both movies and shows (rather
// than just the first ~20 movie results) so the in-page search box on a
// channel/studio page has a large enough pool to actually find a match. TMDB
// has no single endpoint that combines full-text search with a
// watch-provider or company filter, so this "search a preloaded sample"
// approach is the practical fallback — not a live full-catalog search, just
// a bigger, more useful sample of one. Real search (above) covers the gap.
const CATALOG_PAGES_TO_FETCH = 3; // ~60 titles per media type, ~120 total

async function fetchDiscoverPages(
  mediaType: 'movie' | 'tv',
  extraParams: Record<string, string>
): Promise<{ items: TMDBCatalogItem[]; totalResults: number }> {
  try {
    const firstPage = await tmdbFetch(`/discover/${mediaType}`, {
      ...extraParams,
      sort_by: 'popularity.desc',
      page: '1',
    });
    const totalPages = Math.min(firstPage.total_pages || 1, CATALOG_PAGES_TO_FETCH);
    const restPages =
      totalPages > 1
        ? await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              tmdbFetch(`/discover/${mediaType}`, {
                ...extraParams,
                sort_by: 'popularity.desc',
                page: String(i + 2),
              })
            )
          )
        : [];

    const items = [firstPage, ...restPages].flatMap((d) => mapDiscoverResults(d, mediaType));
    return { items, totalResults: firstPage.total_results || 0 };
  } catch {
    return { items: [], totalResults: 0 };
  }
}

async function fetchCatalogPages(extraParams: Record<string, string>): Promise<TMDBCatalogResult> {
  const [movies, shows] = await Promise.all([
    fetchDiscoverPages('movie', extraParams),
    fetchDiscoverPages('tv', extraParams),
  ]);

  const allItems = [...movies.items, ...shows.items];
  const seen = new Set<string>();
  const items = allItems.filter((m) => {
    const key = `${m.mediaType}-${m.id}`;
    return seen.has(key) ? false : (seen.add(key), true);
  });

  return {
    items,
    totalResults: movies.totalResults + shows.totalResults,
    totalPages: CATALOG_PAGES_TO_FETCH,
  };
}

export interface TMDBCatalogResult {
  items: TMDBCatalogItem[];
  totalResults: number;
  totalPages: number;
}

export async function getMoviesByProvider(providerId: number): Promise<TMDBCatalogResult> {
  return fetchCatalogPages({ with_watch_providers: String(providerId), watch_region: 'US' });
}

export async function getMoviesByCompany(companyId: number): Promise<TMDBCatalogResult> {
  return fetchCatalogPages({ with_companies: String(companyId) });
}

export async function getMoviesByGenre(genreId: number): Promise<TMDBCatalogResult> {
  return fetchCatalogPages({ with_genres: String(genreId) });
}

// Movie-only genre discovery. The general catalog function above combines
// movie and TV results, but movie genre IDs are not valid TV genre filters.
export async function getMovieOnlyByGenre(genreId: number): Promise<TMDBCatalogResult> {
  const { items, totalResults } = await fetchDiscoverPages('movie', {
    with_genres: String(genreId),
  });
  return { items, totalResults, totalPages: CATALOG_PAGES_TO_FETCH };
}

// TV uses a separate genre-id scheme from movies, so query only the TV
// discover endpoint for series genre results.
export async function getSeriesByGenre(genreId: number): Promise<TMDBCatalogResult> {
  const { items, totalResults } = await fetchDiscoverPages('tv', {
    with_genres: String(genreId),
  });
  return { items, totalResults, totalPages: CATALOG_PAGES_TO_FETCH };
}

export interface TMDBGenreTile {
  id: number;
  name: string;
  posters: string[];
  totalResults: number;
}

// Curated genre set for the Browse page — id must match TMDB's genre ids
const BROWSE_GENRES: { id: number; name: string }[] = [
  { id: 28, name: 'Action' },
  { id: 27, name: 'Horror' },
  { id: 878, name: 'Sci-Fi' },
  { id: 10749, name: 'Romance' },
  { id: 16, name: 'Animation' },
  { id: 53, name: 'Thriller' },
  { id: 14, name: 'Fantasy' },
  { id: 9648, name: 'Mystery' },
];

// GET /discover/movie?with_genres=X — a few posters per genre for background collages
export async function getGenreTiles(): Promise<TMDBGenreTile[]> {
  const results = await Promise.all(
    BROWSE_GENRES.map(async (g) => {
      try {
        const data = await tmdbFetch('/discover/movie', {
          with_genres: String(g.id),
          sort_by: 'popularity.desc',
        });
        const posters = (data.results || [])
          .slice(0, 3)
          .map((m: any) => posterUrl(m.poster_path, 'w342'))
          .filter((p: string) => !p.includes('no_image'));
        return { id: g.id, name: g.name, posters, totalResults: data.total_results || 0 };
      } catch {
        return { id: g.id, name: g.name, posters: [], totalResults: 0 };
      }
    })
  );
  return results;
}

// GET /movie/{movie_id} — full movie details (optionally with append_to_response)
export async function getMovieDetails(
  movieId: number,
  appendToResponse?: string
): Promise<TMDBMovieDetail | null> {
  try {
    const params: Record<string, string> = {
      append_to_response: appendToResponse || 'credits,release_dates',
    };
    const m = await tmdbFetch(`/movie/${movieId}`, params);

    const cast = (m.credits?.cast || [])
      .slice(0, 5)
      .map((c: any) => c.name)
      .filter(Boolean);

    const director =
      m.credits?.crew?.find((c: any) => c.job === 'Director')?.name || undefined;

    const usRelease = (m.release_dates?.results || []).find((r: any) => r.iso_3166_1 === 'US');
    const cert =
      usRelease?.release_dates?.find((d: any) => d.certification)?.certification || undefined;

    return {
      id: m.id,
      title: m.title || m.original_title,
      overview: m.overview || '',
      releaseDate: m.release_date || '',
      rating: m.vote_average ? m.vote_average.toFixed(1) : 'N/A',
      runtime: m.runtime || 0,
      genres: (m.genres || []).map((g: any) => g.name),
      img: posterUrl(m.poster_path, 'w500'),
      backdropImg: backdropUrl(m.backdrop_path),
      alt: `${m.title || m.original_title} movie poster`,
      cast: cast.length > 0 ? cast : undefined,
      director,
      certification: cert,
    };
  } catch {
    const match = FALLBACK_MOVIES.find((f) => f.id === movieId);
    if (!match) return null;
    return {
      id: match.id,
      title: match.title,
      overview: match.overview,
      releaseDate: `${match.year}-01-01`,
      rating: match.rating,
      runtime: 130,
      genres: [match.genre],
      img: match.img,
      backdropImg: match.backdropImg,
      alt: match.alt,
      cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'],
      director: 'Denis Villeneuve',
      certification: 'PG-13',
    };
  }
}

// GET /tv/{tv_id} — full TV show details (optionally with append_to_response)
export async function getTVDetails(
  tvId: number,
  appendToResponse?: string
): Promise<TMDBTVDetail | null> {
  try {
    const params: Record<string, string> = {
      append_to_response: appendToResponse || 'credits,content_ratings',
    };
    const s = await tmdbFetch(`/tv/${tvId}`, params);

    const cast = (s.credits?.cast || [])
      .slice(0, 5)
      .map((c: any) => c.name)
      .filter(Boolean);

    const creator =
      (s.created_by && s.created_by.length > 0 ? s.created_by[0].name : undefined) ||
      s.credits?.crew?.find((c: any) => c.job === 'Executive Producer' || c.job === 'Director')?.name ||
      undefined;

    const usRating = (s.content_ratings?.results || []).find((r: any) => r.iso_3166_1 === 'US');
    const cert = usRating?.rating || undefined;

    return {
      id: s.id,
      name: s.name || s.original_name,
      overview: s.overview || '',
      firstAirDate: s.first_air_date || '',
      rating: s.vote_average ? s.vote_average.toFixed(1) : 'N/A',
      numberOfSeasons: s.number_of_seasons || 1,
      genres: (s.genres || []).map((g: any) => g.name),
      img: posterUrl(s.poster_path, 'w500'),
      backdropImg: backdropUrl(s.backdrop_path),
      alt: `${s.name || s.original_name} TV show poster`,
      cast: cast.length > 0 ? cast : undefined,
      creator,
      certification: cert,
    };
  } catch {
    const match = FALLBACK_SHOWS.find((f) => f.id === tvId);
    if (!match) return null;
    return {
      id: match.id,
      name: match.title,
      overview: match.overview,
      firstAirDate: `${match.year}-01-01`,
      rating: match.rating,
      numberOfSeasons: 3,
      genres: [match.genre],
      img: match.img,
      backdropImg: match.backdropImg,
      alt: match.alt,
      cast: ['Pedro Pascal', 'Bella Ramsey', 'Gabriel Luna'],
      creator: 'Craig Mazin',
      certification: 'TV-MA',
    };
  }
}

export interface TMDBEpisode {
  id: number;
  episodeNumber: number;
  name: string;
  overview: string;
  stillImg: string | null;
  runtime: number | null;
  airDate: string;
}

// GET /tv/{id}/season/{season_number} — real per-episode data (stills,
// synopses, runtimes) for browsing a season's episode list.
export async function getSeasonEpisodes(
  tvId: number,
  seasonNumber: number
): Promise<TMDBEpisode[]> {
  try {
    const data = await tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`, {});
    return (data.episodes || []).map((ep: any) => ({
      id: ep.id,
      episodeNumber: ep.episode_number,
      name: ep.name || `Episode ${ep.episode_number}`,
      overview: ep.overview || '',
      stillImg: ep.still_path ? `${TMDB_IMAGE_BASE}/w300${ep.still_path}` : null,
      runtime: ep.runtime || null,
      airDate: ep.air_date || '',
    }));
  } catch {
    return [];
  }
}

export interface TMDBVideo {
  id: string;
  key: string; // YouTube video id
  name: string;
  thumbnailImg: string;
}

// GET /{movie|tv}/{id}/videos — real trailers/teasers from YouTube, filtered
// to actual trailers (not every behind-the-scenes clip TMDB has on file).
export async function getVideos(
  mediaId: number,
  mediaType: 'movie' | 'tv'
): Promise<TMDBVideo[]> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${mediaId}/videos`, {});
    return (data.results || [])
      .filter((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
      .map((v: any) => ({
        id: v.id,
        key: v.key,
        name: v.name || 'Trailer',
        thumbnailImg: `https://img.youtube.com/vi/${v.key}/hqdefault.jpg`,
      }));
  } catch {
    return [];
  }
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profileImg: string | null;
}

// GET /{movie|tv}/{id}/credits — real cast with photos and character names,
// richer than the name-only `cast` array already used in the top credits
// block (that one has no photos or character names, just a plain list).
export async function getCredits(
  mediaId: number,
  mediaType: 'movie' | 'tv'
): Promise<TMDBCastMember[]> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${mediaId}/credits`, {});
    return (data.cast || []).slice(0, 12).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character || '',
      profileImg: c.profile_path ? `${TMDB_IMAGE_BASE}/w200${c.profile_path}` : null,
    }));
  } catch {
    return [];
  }
}

// GET /{movie|tv}/{id}/recommendations — "Related" titles. Falls back to
// /similar if TMDB has no recommendations on file for this title (common for
// newer or less mainstream releases).
export async function getRelated(
  mediaId: number,
  mediaType: 'movie' | 'tv'
): Promise<TMDBCatalogItem[]> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${mediaId}/recommendations`, {});
    const items = (data.results || [])
      .filter((m: any) => m.poster_path)
      .map((m: any) => toCatalogItem(m, mediaType));
    if (items.length > 0) return items;

    const fallback = await tmdbFetch(`/${mediaType}/${mediaId}/similar`, {});
    return (fallback.results || [])
      .filter((m: any) => m.poster_path)
      .map((m: any) => toCatalogItem(m, mediaType));
  } catch {
    return [];
  }
}

export interface TMDBPersonDetail {
  id: number;
  name: string;
  biography: string;
  profileImg: string | null;
  backdropImg: string | null;
}

// GET /person/{person_id} — bio, photo, for the actor/crew detail page.
export async function getPersonDetails(personId: number): Promise<TMDBPersonDetail | null> {
  try {
    const data = await tmdbFetch(`/person/${personId}`, {});
    return {
      id: data.id,
      name: data.name || '',
      biography: data.biography || '',
      profileImg: data.profile_path ? `${TMDB_IMAGE_BASE}/w500${data.profile_path}` : null,
      backdropImg: data.profile_path ? `${TMDB_IMAGE_BASE}/original${data.profile_path}` : null,
    };
  } catch {
    return null;
  }
}

// GET /person/{person_id}/combined_credits — everything they've been in
export async function getPersonCredits(
  personId: number
): Promise<{ movies: TMDBCatalogItem[]; shows: TMDBCatalogItem[] }> {
  try {
    const data = await tmdbFetch(`/person/${personId}/combined_credits`, {});
    const cast = (data.cast || []) as any[];
    const dedup = (items: any[]) => {
      const seen = new Set<number>();
      return items.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
    };
    const movies = dedup(cast.filter((c) => c.media_type === 'movie' && c.poster_path))
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .map((m) => toCatalogItem(m, 'movie'));
    const shows = dedup(cast.filter((c) => c.media_type === 'tv' && c.poster_path))
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .map((m) => toCatalogItem(m, 'tv'));
    return { movies, shows };
  } catch {
    return { movies: [], shows: [] };
  }
}

// GET /search/movie?query={text} — search movies by title
export async function searchMovies(query: string): Promise<TMDBSearchResult[]> {
  if (!query.trim()) return [];
  try {
    const data = await tmdbFetch('/search/movie', { query: query.trim() });
    return (data.results || []).slice(0, 10).map((m: any) => ({
      id: m.id,
      title: m.title || m.original_title,
      mediaType: 'movie' as const,
      year: m.release_date ? m.release_date.slice(0, 4) : '',
      rating: m.vote_average ? m.vote_average.toFixed(1) : 'N/A',
      img: posterUrl(m.poster_path),
      alt: `${m.title || m.original_title} movie poster`,
      overview: m.overview || '',
      genre: getGenre(m.genre_ids || []),
    }));
  } catch {
    const q = query.toLowerCase();
    return FALLBACK_MOVIES.filter(
      (m) => m.title.toLowerCase().includes(q) || m.genre.toLowerCase().includes(q)
    ).map((m) => ({
      id: m.id,
      title: m.title,
      mediaType: 'movie' as const,
      year: m.year,
      rating: m.rating,
      img: m.img,
      alt: m.alt,
      overview: m.overview,
      genre: m.genre,
    }));
  }
}

// GET /search/tv?query={text} — search TV shows by title
export async function searchTVShows(query: string): Promise<TMDBSearchResult[]> {
  if (!query.trim()) return [];
  try {
    const data = await tmdbFetch('/search/tv', { query: query.trim() });
    return (data.results || []).slice(0, 10).map((s: any) => ({
      id: s.id,
      title: s.name || s.original_name,
      mediaType: 'tv' as const,
      year: s.first_air_date ? s.first_air_date.slice(0, 4) : '',
      rating: s.vote_average ? s.vote_average.toFixed(1) : 'N/A',
      img: posterUrl(s.poster_path),
      alt: `${s.name || s.original_name} TV show poster`,
      overview: s.overview || '',
      genre: getGenre(s.genre_ids || []),
    }));
  } catch {
    const q = query.toLowerCase();
    return FALLBACK_SHOWS.filter(
      (s) => s.title.toLowerCase().includes(q) || s.genre.toLowerCase().includes(q)
    ).map((s) => ({
      id: s.id,
      title: s.title,
      mediaType: 'tv' as const,
      year: s.year,
      rating: s.rating,
      img: s.img,
      alt: s.alt,
      overview: s.overview,
      genre: s.genre,
    }));
  }
}

// Search both movies and TV shows simultaneously
export async function searchAll(query: string): Promise<TMDBSearchResult[]> {
  if (!query.trim()) return [];
  try {
    const [movies, shows] = await Promise.all([searchMovies(query), searchTVShows(query)]);
    return [...movies, ...shows].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  } catch {
    return [];
  }
}

// Trending and multi-search helpers for the live browse/search UI
export async function getTrending(
  type: 'all' | 'movie' | 'tv' = 'all',
  timeWindow: 'day' | 'week' = 'day'
): Promise<any> {
  try {
    const mediaType = type === 'all' ? 'all' : type;
    const data = await tmdbFetch(`/trending/${mediaType}/${timeWindow}`);
    if (data.results && data.results.length > 0) return data;
  } catch {
    // fallback
  }

  const movieResults = FALLBACK_MOVIES.map((m) => ({
    id: m.id,
    title: m.title,
    media_type: 'movie',
    poster_path: m.img.replace('https://image.tmdb.org/t/p/w500', ''),
    backdrop_path: m.backdropImg.replace('https://image.tmdb.org/t/p/w780', ''),
    vote_average: parseFloat(m.rating),
    release_date: `${m.year}-01-01`,
  }));

  const showResults = FALLBACK_SHOWS.map((s) => ({
    id: s.id,
    name: s.title,
    title: s.title,
    media_type: 'tv',
    poster_path: s.img.replace('https://image.tmdb.org/t/p/w500', ''),
    backdrop_path: s.backdropImg.replace('https://image.tmdb.org/t/p/w780', ''),
    vote_average: parseFloat(s.rating),
    first_air_date: `${s.year}-01-01`,
  }));

  if (type === 'movie') return { results: movieResults };
  if (type === 'tv') return { results: showResults };
  return { results: [...movieResults, ...showResults] };
}

export async function searchMulti(query: string): Promise<any> {
  if (!query.trim()) return { results: [] };
  try {
    const data = await tmdbFetch('/search/multi', { query: query.trim() });
    const res = (data.results || []).filter(
      (item: any) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
    );
    if (res.length > 0) return { results: res };
  } catch {
    // fallback
  }

  const q = query.toLowerCase();
  const matchedMovies = FALLBACK_MOVIES.filter(
    (m) => m.title.toLowerCase().includes(q) || m.genre.toLowerCase().includes(q)
  ).map((m) => ({
    id: m.id,
    title: m.title,
    media_type: 'movie',
    poster_path: m.img.replace('https://image.tmdb.org/t/p/w500', ''),
    vote_average: parseFloat(m.rating),
    release_date: `${m.year}-01-01`,
  }));
  const matchedShows = FALLBACK_SHOWS.filter(
    (s) => s.title.toLowerCase().includes(q) || s.genre.toLowerCase().includes(q)
  ).map((s) => ({
    id: s.id,
    name: s.title,
    media_type: 'tv',
    poster_path: s.img.replace('https://image.tmdb.org/t/p/w500', ''),
    vote_average: parseFloat(s.rating),
    first_air_date: `${s.year}-01-01`,
  }));
  return { results: [...matchedMovies, ...matchedShows] };
}
