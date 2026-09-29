'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';

interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
}

interface HeroCarouselProps {
  movies: Movie[];
  mockHero: Movie;
  /** 'movie' (default) or 'tv' — same collision risk as MovieRow: TMDB
   *  movie and TV ids overlap, so the hero's buttons need to know which. */
  mediaType?: 'movie' | 'tv';
  spotlightStyles?: boolean;
}

export default function HeroCarousel({
  movies,
  mockHero,
  mediaType = 'movie',
  spotlightStyles = false,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayHero = movies.length > 0 ? movies[currentIndex] : mockHero;

  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [movies.length]);

  const heroBg =
    displayHero.backdrop_path && displayHero.backdrop_path !== '/placeholder-hero'
      ? `https://image.tmdb.org/t/p/original${displayHero.backdrop_path}`
      : '';

  return (
    <section
      className={
        spotlightStyles
          ? 'sv-hero select-none'
          : 'featured-banner relative w-full h-[70vh] md:h-[80vh] flex flex-col justify-end px-6 md:px-12 pt-0 pb-16 select-none overflow-hidden bg-void'
      }
    >
      <div className="absolute inset-0 z-0">
        <AnimatePresence>
          {heroBg ? (
            <motion.div
              key={displayHero.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <Image
                src={heroBg}
                alt={displayHero.title || displayHero.name || 'Hero'}
                fill
                priority
                className="object-cover brightness-[0.35] contrast-[1.05]"
              />
            </motion.div>
          ) : (
            <motion.div
              key="fallback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              {/* Fallback gradient mesh */}
              <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-gradient-to-b from-[#b347ff]/40 to-transparent rounded-full blur-[120px]" />
              <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[80%] bg-gradient-to-t from-[#0b5c66]/40 to-void rounded-full blur-[140px]" />
            </motion.div>
          )}
        </AnimatePresence>
        {spotlightStyles ? (
          <>
            <div className="sv-hero-fade-x" />
            <div className="sv-hero-fade-y" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-void/90 via-transparent to-transparent z-10" />
          </>
        )}
      </div>

      <div className={spotlightStyles ? 'sv-hero-fg' : 'relative z-20 max-w-[560px]'}>
        <div className={spotlightStyles ? 'sv-hero-content-wrap' : undefined}>
          <div className={spotlightStyles ? 'sv-hero-content' : undefined}>
            <AnimatePresence mode="wait">
              <motion.div
                key={displayHero.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={spotlightStyles ? undefined : 'flex flex-col'}
              >
                {spotlightStyles ? (
                  <div className="sv-hero-meta">
                    <span>New &amp; Popular</span>
                    <span className="sv-hero-dot" />
                    <span>
                      {displayHero.release_date?.slice(0, 4) || 'Coming soon'}
                      {displayHero.vote_average ? ` · ${displayHero.vote_average.toFixed(1)}` : ''}
                    </span>
                  </div>
                ) : (
                  <span className="text-[13px] font-medium text-muted mb-3">Featured</span>
                )}
                <h1
                  className={
                    spotlightStyles
                      ? 'sv-hero-title font-display'
                      : 'font-display text-3xl md:text-5xl font-extrabold tracking-tight text-foreground drop-shadow-lg mb-4'
                  }
                >
                  {displayHero.title || displayHero.name}
                </h1>
                <p
                  className={
                    spotlightStyles
                      ? 'sv-hero-sub'
                      : 'text-[13px] md:text-sm text-muted drop-shadow-md font-medium line-clamp-3 leading-relaxed mb-7 max-w-[440px]'
                  }
                >
                  {displayHero.overview}
                </p>

                <div className={spotlightStyles ? 'sv-hero-buttons' : 'featured-buttons flex items-center gap-3 w-full'}>
              <Link
                href={`/media/${mediaType}/${displayHero.id}`}
                prefetch={false}
                className={
                  spotlightStyles
                    ? 'sv-btn sv-btn-primary sv-btn-sm'
                    : 'inline-flex items-center gap-2 justify-center px-7 py-3.5 rounded-[10px] text-void font-display font-semibold text-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:opacity-90 active:scale-95 transition-all duration-150'
                }
                style={{ background: 'linear-gradient(180deg, #ffffff, #e8e6ea)' }}
              >
                <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] fill-void">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play
              </Link>
              <Link
                href={`/media/${mediaType}/${displayHero.id}`}
                prefetch={false}
                className={
                  spotlightStyles
                    ? 'sv-btn sv-btn-ghost sv-btn-sm'
                    : 'inline-flex items-center gap-2 justify-center px-7 py-3.5 rounded-[10px] text-foreground font-display font-semibold text-[14px] bg-white/[0.04] hover:bg-white/[0.08] border border-glass-border hover:border-violet/50 backdrop-blur-md transition-colors duration-200'
                }
              >
                <svg viewBox="0 0 24 24" className="w-[13px] h-[13px]" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                More info
              </Link>
            </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
