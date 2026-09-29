// TMDB's genre list is effectively static, so we keep a local copy instead of
// firing a /genre/movie/list + /genre/tv/list request on every page just to
// label a hero card or row item that only carries genre_ids.

export const MOVIE_GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
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
};

export const TV_GENRES: Record<number, string> = {
  10759: 'Action & Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  10762: 'Kids',
  9648: 'Mystery',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
  37: 'Western',
};

export function genreNames(
  genreIds: number[] | undefined,
  mediaType: 'movie' | 'tv' = 'movie',
  max = 2
): string[] {
  if (!genreIds || genreIds.length === 0) return [];
  const map = mediaType === 'tv' ? TV_GENRES : MOVIE_GENRES;
  return genreIds
    .map((id) => map[id])
    .filter((name): name is string => Boolean(name))
    .slice(0, max);
}
