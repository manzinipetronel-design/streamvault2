'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import SearchOverlay from './SearchOverlay';
import { MOVIE_GENRES, TV_GENRES } from '@/lib/genreMap';

/** Floating search and catalog-filter controls for the hero. */
export default function TopSearchBar() {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [genreId, setGenreId] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  const genres = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (Math.abs(scrollDelta) > 4) {
        setIsHidden(currentScrollY > 80 && scrollDelta > 0);
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isFilterOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFilterOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterOpen]);

  const browseFilteredTitles = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedGenreName = genreId ? genres[Number(genreId)] : undefined;
    const params = new URLSearchParams({ type: mediaType });
    if (genreId && selectedGenreName) {
      params.set('genre', genreId);
      params.set('name', selectedGenreName);
    } else {
      params.set(
        'collection',
        mediaType === 'movie' ? 'trending-movies' : 'trending-tv',
      );
      params.set('name', mediaType === 'movie' ? 'Trending Movies' : 'Trending Series');
    }
    setIsFilterOpen(false);
    router.push(`/browse/catalog?${params.toString()}`);
  };

  const glass =
    'bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)]';

  return (
    <>
      <div
        className={`fixed top-5 right-4 md:right-8 z-40 flex items-center gap-2.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isHidden ? '-translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <button
          onClick={() => setIsSearchOpen(true)}
          aria-label="Search"
          className={`flex items-center gap-2.5 pl-4 pr-3 h-11 sm:w-[220px] md:w-[280px] rounded-full text-muted transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-foreground hover:border-white/20 hover:bg-gradient-to-b hover:from-white/[0.11] hover:to-white/[0.04] ${glass}`}
        >
          <Search className="w-[17px] h-[17px] shrink-0" />
          <span className="hidden sm:inline text-[13px] font-medium truncate">
            Search for Movie
          </span>
        </button>
        <button
          onClick={() => setIsFilterOpen(true)}
          aria-label="Filter"
          className={`flex items-center justify-center w-11 h-11 rounded-full text-foreground shrink-0 transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/20 hover:bg-gradient-to-b hover:from-white/[0.13] hover:to-white/[0.04] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_22px_rgba(0,0,0,0.45)] active:translate-y-0 active:scale-95 ${glass}`}
        >
          <SlidersHorizontal className="w-[16px] h-[16px]" />
        </button>
      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      {isFilterOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center md:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsFilterOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="title-filter-heading"
            className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-zinc-950 p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl md:rounded-3xl md:p-7"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                  Find your next watch
                </p>
                <h2
                  id="title-filter-heading"
                  className="mt-1 font-display text-xl font-bold text-white"
                >
                  Browse by type and genre
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                aria-label="Close filters"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            </div>

            <form onSubmit={browseFilteredTitles} className="space-y-5">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-white/80">
                  What are you in the mood for?
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['movie', 'Movies'],
                    ['tv', 'Series'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={mediaType === value}
                      onClick={() => {
                        setMediaType(value);
                        setGenreId('');
                      }}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        mediaType === value
                          ? 'border-violet-400/50 bg-violet-500/15 text-white'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.08]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="block text-sm font-medium text-white/80">
                Genre
                <select
                  value={genreId}
                  onChange={(event) => setGenreId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-violet-400"
                >
                  <option value="">Trending {mediaType === 'movie' ? 'movies' : 'series'}</option>
                  {Object.entries(genres)
                    .sort(([, a], [, b]) => a.localeCompare(b))
                    .map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                </select>
              </label>

              <button
                type="submit"
                className="w-full rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-violet-500 active:scale-[0.99]"
              >
                Show titles
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setIsFilterOpen(false);
                router.push('/browse');
              }}
              className="mt-4 w-full py-2 text-center text-sm font-medium text-white/55 transition hover:text-white"
            >
              Explore all browse categories
            </button>
          </section>
        </div>
      )}
    </>
  );
}
