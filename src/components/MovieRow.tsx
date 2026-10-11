'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { EyeOff } from 'lucide-react';
import UpcomingBadge from '@/components/UpcomingBadge';
import { useKidsControls } from '@/contexts/KidsControlsContext';

interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  backdrop_path?: string;
  poster_path?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

interface MovieRowProps {
  title: string;
  items: Movie[];
  isMock?: boolean;
  /** 'movie' (default) or 'tv' — determines whether cards link to
   *  /media/movie/{id} or /media/tv/{id}. TMDB movie and TV ids are
   *  separate sequences that can collide, so getting this wrong sends
   *  people to a completely unrelated title. */
  mediaType?: 'movie' | 'tv';
  /** Show a bold rank number (1, 2, 3…) in the corner — reserve this for
   *  genuinely ranked rows like "Trending now", not every row in the app. */
  showRank?: boolean;
  spotlightStyles?: boolean;
  /** Where "View all" goes — e.g. /browse/catalog?genre=28&name=Action.
   *  Defaults to /browse when a row has no natural drill-down target. */
  viewAllHref?: string;
  /** Optional one-liner shown under the title (e.g. "Top-rated releases from 2020–2029"). */
  subtitle?: string;
  /** Enables parent controls for titles displayed in Kids mode. */
  enableKidsControls?: boolean;
}

export default function MovieRow({
  title,
  items,
  isMock,
  mediaType = 'movie',
  showRank,
  spotlightStyles = false,
  viewAllHref = '/browse',
  subtitle,
  enableKidsControls = false,
}: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [busyTitle, setBusyTitle] = useState<string | null>(null);
  const { isHidden, hideTitle, error, loadError, loading: kidsSettingsLoading } = useKidsControls();
  const kidsSettingsUnavailable = kidsSettingsLoading || loadError;
  const visibleItems =
    enableKidsControls && !kidsSettingsUnavailable
      ? items.filter((movie) => !isHidden(movie.id, mediaType))
      : enableKidsControls
        ? []
        : items;

  const getImageUrl = (movie: Movie) => {
    if (isMock && movie.poster_path) return movie.poster_path;
    if (movie.poster_path) return `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    return 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600&h=900'; // Fallback
  };

  const scrollRow = (direction: number) => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.8;
      rowRef.current.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="group/row flex flex-col pt-9 pb-1 relative">
      <div className={`flex items-baseline justify-between mb-5 px-4 md:px-0${spotlightStyles ? ' sv-row-head' : ''}`}>
        <div>
          <h3 className="font-display text-lg md:text-xl font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          {subtitle && <p className="text-[13px] text-muted mt-1">{subtitle}</p>}
        </div>
        <Link href={viewAllHref} className="link-sweep text-[13px]">
          View all
        </Link>
      </div>

      <div className="relative">
        {enableKidsControls && kidsSettingsUnavailable && (
          <p role="status" className="px-4 py-8 text-sm text-muted md:px-0">
            {kidsSettingsLoading
              ? 'Loading Kids settings…'
              : 'Could not load Kids settings. Kids titles are hidden until settings load.'}
          </p>
        )}
        {/* glass scroll buttons — fade in on row hover, not always visible */}
        <button
          onClick={() => scrollRow(-1)}
          aria-label="Scroll left"
          className="absolute top-1/2 -translate-y-1/2 -left-2 hidden h-9 w-9 items-center justify-center rounded-full border border-glass-border bg-void-2/70 text-foreground opacity-0 backdrop-blur-md transition-opacity duration-200 hover:border-violet group-hover/row:opacity-100 md:flex z-10"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="w-[15px] h-[15px]"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div
          ref={rowRef}
          className="movie-row spotlight-scope flex gap-3 md:gap-[14px] overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {visibleItems.map((movie, i) => {
            const releaseYear = (movie.release_date || movie.first_air_date || '2026').split(
              '-'
            )[0];
            const cleanRating = movie.vote_average ? movie.vote_average.toFixed(1) : '7.0';
            const title = movie.title || movie.name || 'Media Poster';
            const mediaId = `${mediaType}:${movie.id}`;

            return (
              <div
                key={movie.id}
                className="group/card relative flex-none w-[clamp(112px,31vw,150px)] snap-start md:w-[172px]"
              >
                <Link
                  href={`/media/${mediaType}/${movie.id}`}
                  prefetch={false}
                  className="movie-card group block relative rounded-[8px] transition-transform duration-200 active:scale-[0.96] md:active:scale-100"
                >
                {/* Same hover as the media page: the poster zooms slightly and a
                    soft gradient fades in with the details. No lift, no ring,
                    and nothing dims the neighbouring cards. */}
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[8px] bg-void-2">
                  <Image
                    src={getImageUrl(movie)}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 130px, (max-width: 1024px) 172px, 172px"
                    className="quiet-media object-cover group-hover:scale-[1.045]"
                  />

                  {showRank && (
                    <div className="absolute top-2 left-2 flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-md bg-void/70 backdrop-blur-md border border-white/10 font-display font-extrabold text-[12px] text-foreground z-20">
                      {i + 1}
                    </div>
                  )}

                  <div className="absolute top-2 right-2 z-10">
                    <UpcomingBadge releaseDate={movie.release_date || movie.first_air_date} />
                  </div>

                  <div className="absolute inset-0 flex flex-col justify-end p-2.5 bg-gradient-to-t from-void via-void/15 to-transparent opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                    <p className="font-display font-semibold text-[12.5px] leading-tight text-foreground line-clamp-2">
                      {title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted mt-1">
                      <span className="flex items-center gap-[3px] text-gold font-semibold">
                        <svg viewBox="0 0 24 24" className="w-[9px] h-[9px] fill-gold">
                          <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.9-6.2 3.9 1.6-7L2 9.2l7.1-.6z" />
                        </svg>
                        {cleanRating}
                      </span>
                      <span>{releaseYear}</span>
                    </div>
                  </div>
                </div>
                </Link>
                {enableKidsControls && (
                  <button
                    type="button"
                    aria-label={`Hide ${title} from Kids`}
                    title="Hide this title from Kids"
                    disabled={busyTitle === mediaId}
                    onClick={async () => {
                      setBusyTitle(mediaId);
                      try {
                        await hideTitle({
                          media_id: String(movie.id),
                          media_type: mediaType,
                          title,
                          poster_path: movie.poster_path ?? null,
                        });
                      } finally {
                        setBusyTitle(null);
                      }
                    }}
                    className="absolute right-2 top-2 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white opacity-100 backdrop-blur-sm transition hover:bg-rose-600 disabled:opacity-50 md:opacity-0 md:group-hover/card:opacity-100"
                  >
                    <EyeOff className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => scrollRow(1)}
          aria-label="Scroll right"
          className="absolute top-1/2 -translate-y-1/2 -right-2 hidden h-9 w-9 items-center justify-center rounded-full border border-glass-border bg-void-2/70 text-foreground opacity-0 backdrop-blur-md transition-opacity duration-200 hover:border-violet group-hover/row:opacity-100 md:flex z-10"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="w-[15px] h-[15px]"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      {enableKidsControls && error && (
        <p role="status" className="px-4 pt-2 text-xs text-rose-400 md:px-0">
          {error}
        </p>
      )}
    </div>
  );
}
