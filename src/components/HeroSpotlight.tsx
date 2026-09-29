'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Play, Info, Heart, Bookmark, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userListsService } from '@/lib/services/userListsService';
import { genreNames } from '@/lib/genreMap';

interface SpotlightItem {
  id: number;
  title?: string;
  name?: string;
  mediaType?: 'movie' | 'tv';
  overview: string;
  backdrop_path?: string;
  poster_path?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
}

interface HeroSpotlightProps {
  items: SpotlightItem[];
  mockHero: SpotlightItem;
  /** Fallback for items without their own mediaType. */
  mediaType?: 'movie' | 'tv';
  /** Extra classes on the outer <section>, e.g. negative margins so the
   *  page can break the hero out of <main>'s padding for a full-bleed look. */
  className?: string;
}

// Shared glass treatment for every quick-action / icon button in the hero —
// kept as one constant so the search bar, nav rail and this file all render
// the exact same "material" instead of three slightly different greys.
const GLASS =
  'bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)]';

export default function HeroSpotlight({
  items,
  mockHero,
  mediaType = 'movie',
  className = '',
}: HeroSpotlightProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [busy, setBusy] = useState<'fav' | 'list' | null>(null);
  const { user } = useAuth();

  const hasItems = items.length > 0;
  const display = hasItems ? items[currentIndex] : mockHero;
  const displayTitle = display.title || display.name || 'Untitled';
  const displayMediaType = display.mediaType || mediaType;

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [items.length]);

  // Reset quick-action state whenever the featured title changes, then check
  // real status for the signed-in user.
  useEffect(() => {
    setIsFavorite(false);
    setIsWatchlisted(false);
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const mediaId = String(display.id);
      const [fav, wl] = await Promise.all([
        userListsService.isFavorite(user.id, mediaId, displayMediaType).catch(() => false),
        userListsService.isInWatchlist(user.id, mediaId, displayMediaType).catch(() => false),
      ]);
      if (!cancelled) {
        setIsFavorite(fav);
        setIsWatchlisted(wl);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display.id, displayMediaType, user?.id]);

  const backdrop =
    display.backdrop_path && display.backdrop_path !== '/placeholder-hero'
      ? `https://image.tmdb.org/t/p/original${display.backdrop_path}`
      : '';

  const releaseDate = display.release_date || display.first_air_date;
  const formattedDate = releaseDate
    ? new Date(releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';
  const genres = genreNames(display.genre_ids, displayMediaType, 2);

  const mediaPayload = {
    mediaId: String(display.id),
    mediaType: displayMediaType,
    title: displayTitle,
    posterUrl: display.poster_path ? `https://image.tmdb.org/t/p/w500${display.poster_path}` : '',
    genre: genres[0] || '',
    year: (releaseDate || '').split('-')[0],
    rating: display.vote_average ? display.vote_average.toFixed(1) : '',
  };

  const toggleFavorite = async () => {
    if (!user?.id || busy) return;
    setBusy('fav');
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      if (next) await userListsService.addFavorite(user.id, mediaPayload);
      else await userListsService.removeFavorite(user.id, mediaPayload.mediaId, displayMediaType);
    } catch {
      setIsFavorite(!next);
    } finally {
      setBusy(null);
    }
  };

  const toggleWatchlist = async () => {
    if (!user?.id || busy) return;
    setBusy('list');
    const next = !isWatchlisted;
    setIsWatchlisted(next);
    try {
      if (next) await userListsService.addToWatchlist(user.id, mediaPayload);
      else await userListsService.removeFromWatchlist(user.id, mediaPayload.mediaId, displayMediaType);
    } catch {
      setIsWatchlisted(!next);
    } finally {
      setBusy(null);
    }
  };

  const strip = items.slice(0, 6);

  return (
    <section className={`relative min-h-[640px] overflow-hidden bg-void ${className}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence>
          {backdrop ? (
            <motion.div
              key={display.id}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <Image
                src={backdrop}
                alt={displayTitle}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </motion.div>
          ) : (
            <motion.div
              key="fallback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0"
            >
              <div className="absolute top-[12%] right-[22%] h-[560px] w-[470px] rounded-[50%] bg-gradient-to-br from-violet/45 via-violet/20 to-transparent blur-[1px] opacity-90 rotate-[-8deg]" />
              <div className="absolute top-[16%] right-[24%] h-[510px] w-[420px] rounded-[50%] bg-gradient-to-br from-white/20 via-violet/15 to-transparent blur-[32px] opacity-70 rotate-[-8deg]" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void via-void/30 to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Text-legibility fade — clear well before the right edge so the
          rest of the backdrop stays vivid instead of carrying a faint wash. */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,13,13,0.95)_0%,rgba(13,13,13,0.55)_50%,rgba(13,13,13,0.15)_78%,transparent_100%)] md:bg-[linear-gradient(90deg,rgba(13,13,13,0.96)_0%,rgba(13,13,13,0.55)_24%,rgba(13,13,13,0.15)_40%,transparent_58%)]" />
        {/* Footer-legibility fade — dark behind the poster strip and buttons,
          then clear well above them. */}
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(13,13,13,0.9)_0%,rgba(13,13,13,0.4)_16%,rgba(13,13,13,0.1)_32%,transparent_46%)]" />
      </div>

      {/* Foreground: a column, not vertical-centering-over-the-whole-section.
          The text block flexes and centers within whatever room it has;
          the footer (poster strip / dots / quick actions) keeps its own
          natural height below it in normal flow. That way the two can
          never overlap on a short viewport — they just compress toward
          each other instead of the footer punching through the buttons. */}
      <div className="relative z-20 min-h-[92vh] flex flex-col">
        <div className="flex-1 flex flex-col justify-center pl-5 pr-5 md:pl-28 md:pr-12 pt-24 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={display.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="max-w-[600px]"
            >
              <div className="flex items-center gap-3 text-[13px] font-medium text-muted mb-4">
                {formattedDate && <span>{formattedDate}</span>}
                {formattedDate && genres.length > 0 && <span className="w-1 h-1 rounded-full bg-muted-2" />}
                {genres.length > 0 && <span className="lowercase">{genres.join(', ')}</span>}
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-[4.5rem] lg:text-[5.25rem] font-extrabold tracking-tight text-foreground leading-[0.92] mb-5 uppercase">
                {displayTitle}
              </h1>

              {display.overview && (
                <p className="text-[13px] md:text-sm text-muted font-medium line-clamp-2 leading-relaxed mb-7 max-w-[440px]">
                  {display.overview}
                </p>
              )}

              <div className="flex items-center gap-3">
                <Link
                  href={`/media/${displayMediaType}/${display.id}`}
                  prefetch={false}
                  className="inline-flex items-center gap-2 justify-center px-6 py-3.5 rounded-full text-void font-display font-semibold text-[14px] bg-foreground transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-8px_rgba(255,255,255,0.25)] active:translate-y-0 active:scale-[0.97]"
                >
                  <Play className="w-[14px] h-[14px] fill-void" />
                  Watch now
                </Link>
                <Link
                  href={`/media/${displayMediaType}/${display.id}`}
                  prefetch={false}
                  className="inline-flex items-center gap-2 justify-center px-6 py-3.5 rounded-full text-foreground font-display font-semibold text-[14px] bg-white/[0.06] hover:bg-white/[0.12] border border-glass-border hover:border-white/25 backdrop-blur-md transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
                >
                  <Info className="w-[14px] h-[14px]" />
                  Trailer
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer — strip/dots on the left, quick actions on the right,
            both in normal flow so they sit below the text block, never
            over it. Hidden strip on phones where there isn't room above
            the mobile nav bar; actions stay visible everywhere. */}
        <div className="flex-none flex items-end justify-between gap-4 pl-5 pr-5 md:pl-28 md:pr-12 pb-24 sm:pb-8">
          <div className="hidden sm:flex flex-col gap-2.5">
            {strip.length > 1 && (
              <div className="flex items-end gap-2.5">
                {strip.map((item, i) => {
                  const poster = item.poster_path
                    ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                    : '';
                  const active = i === currentIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentIndex(i)}
                      aria-label={`Show ${item.title || item.name}`}
                      className={`relative flex-none rounded-[7px] overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        active
                          ? 'w-[64px] h-[92px] ring-2 ring-foreground shadow-[0_10px_24px_rgba(0,0,0,0.5)]'
                          : 'w-[50px] h-[74px] opacity-55 hover:opacity-85 hover:-translate-y-0.5'
                      }`}
                    >
                      {poster ? (
                        <Image src={poster} alt={item.title || item.name || ''} fill sizes="64px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-void-3" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {strip.length > 1 && (
              <div className="flex items-center gap-1.5">
                {strip.map((item, i) => (
                  <span
                    key={item.id}
                    className={`h-[3px] rounded-full transition-all duration-300 ${
                      i === currentIndex ? 'w-5 bg-foreground' : 'w-2.5 bg-white/25'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex-none flex items-center gap-2.5">
            <button
              onClick={toggleFavorite}
              disabled={!user?.id}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              title={user?.id ? undefined : 'Sign in to save favorites'}
              className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] disabled:opacity-40 active:scale-95 ${
                isFavorite
                  ? 'bg-foreground text-void'
                  : `${GLASS} text-foreground hover:border-white/20 hover:bg-gradient-to-b hover:from-white/[0.13] hover:to-white/[0.04] hover:-translate-y-0.5`
              }`}
            >
              <Heart className={`w-[17px] h-[17px] ${isFavorite ? 'fill-void' : ''}`} />
            </button>
            <button
              onClick={toggleWatchlist}
              disabled={!user?.id}
              aria-label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
              title={user?.id ? undefined : 'Sign in to save your list'}
              className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] disabled:opacity-40 active:scale-95 ${
                isWatchlisted
                  ? 'bg-foreground text-void'
                  : `${GLASS} text-foreground hover:border-white/20 hover:bg-gradient-to-b hover:from-white/[0.13] hover:to-white/[0.04] hover:-translate-y-0.5`
              }`}
            >
              <Bookmark className={`w-[17px] h-[17px] ${isWatchlisted ? 'fill-void' : ''}`} />
            </button>
            <Link
              href={`/media/${displayMediaType}/${display.id}`}
              prefetch={false}
              aria-label="More info"
              className={`flex items-center justify-center w-11 h-11 rounded-full text-foreground transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/20 hover:bg-gradient-to-b hover:from-white/[0.13] hover:to-white/[0.04] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${GLASS}`}
            >
              <Plus className="w-[18px] h-[18px]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
