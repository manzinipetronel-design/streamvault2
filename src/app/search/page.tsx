'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import HeaderAvatar from '@/components/HeaderAvatar';
import { tmdbService } from '@/lib/services/tmdbService';

type SearchItem = {
  id: number;
  title: string;
  name?: string;
  mediaType?: string;
  type?: string;
  media_type?: 'movie' | 'tv';
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  air_date?: string;
};

const posterUrl = (path?: string | null, size: 'w342' | 'w500' | 'original' = 'w342') => {
  if (!path) return '/assets/images/no_image.png';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'movie', label: 'Movies' },
  { key: 'tv', label: 'Series' },
] as const;

export default function BrowseSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadTrending() {
      if (searchQuery.trim() !== '') return;

      setLoading(true);
      try {
        const data = await tmdbService.getTrending('all', 'day');
        const validMedia = (data.results || []).filter((item: SearchItem) => item.poster_path);
        setMovies(validMedia);
      } catch (error) {
        console.error('Failed to load catalog:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTrending();
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const data = await tmdbService.searchMulti(searchQuery);
      const searchResults = (data.results || []).filter(
        (item: SearchItem) =>
          (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
      );
      setMovies(searchResults);
    } catch (error) {
      console.error('Search query fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovies = movies.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'movie') return item.media_type === 'movie' || !item.media_type;
    if (activeFilter === 'tv') return item.media_type === 'tv';
    return true;
  });

  const handleCardClick = (mediaType: string, id: string) => {
    if (isRedirecting) return;
    setIsRedirecting(id);
    router.push(`/media/${mediaType}/${id}`);
  };

  const activeFilterLabel = FILTERS.find((f) => f.key === activeFilter)?.label ?? 'All';

  return (
    <div className="page-enter min-h-screen bg-void text-foreground font-sans antialiased selection:bg-violet selection:text-white sv-page">
      <div className="sv-page-inner">
        <div className="sv-page-head">
          <h1 className="sv-page-title font-display">Search</h1>
          <HeaderAvatar />
        </div>

        <form onSubmit={handleSearchSubmit} className="sv-search-row">
          <div className="sv-glass sv-search-pill sv-inline">
            <Search className="shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for Movie"
            />
          </div>

          <div ref={filterRef} className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              aria-label="Filter results"
              aria-expanded={filterOpen}
              className={`sv-glass sv-icon-btn sv-inline ${filterOpen ? 'sv-on' : ''}`}
            >
              <SlidersHorizontal />
            </button>

            {filterOpen && (
              <div className="sv-glass sv-filter-dropdown">
                {FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActiveFilter(key);
                      setFilterOpen(false);
                    }}
                    className={`sv-filter-option ${activeFilter === key ? 'sv-active' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        <p className="sv-results-meta">
          {activeFilterLabel !== 'All' && `${activeFilterLabel} · `}
          <b>{filteredMovies.length}</b> results
        </p>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-[8px] bg-void-2 animate-pulse" />
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <p className="sv-empty">No matches found — try widening your search terms.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredMovies.map((item) => {
              const title = item.title || item.name || 'Untitled';
              const releaseDate = item.release_date || item.first_air_date || '';
              const year = releaseDate ? releaseDate.split('-')[0] : '';
              const rating = item.vote_average || 0;
              const explicitType = item.mediaType || item.media_type;
              let safeType = explicitType?.toLowerCase() || 'movie';

              if (!explicitType && item.type?.toLowerCase().includes('tv')) {
                safeType = 'tv';
              } else if (!explicitType && (item.first_air_date || item.air_date)) {
                safeType = 'tv';
              }

              if (safeType !== 'tv' && safeType !== 'movie') {
                safeType = 'movie';
              }

              const isThisCardLoading = isRedirecting === item.id.toString();

              return (
                <button
                  key={item.id}
                  onClick={() => handleCardClick(safeType, item.id.toString())}
                  className="sv-card text-left cursor-pointer"
                >
                  <div className="sv-poster bg-void-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={posterUrl(item.poster_path)}
                      alt={title}
                      loading="lazy"
                      className={`quiet-media absolute inset-0 w-full h-full object-cover ${isThisCardLoading ? 'blur-[2px]' : ''}`}
                    />

                    <span className="sv-type-badge font-display">
                      {safeType === 'tv' ? 'Series' : 'Movie'}
                    </span>

                    {isThisCardLoading && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-void/70 backdrop-blur-sm">
                        <div className="w-7 h-7 rounded-full border-2 border-t-transparent border-violet animate-spin" />
                        <span className="text-[10px] font-medium tracking-wider uppercase text-muted">
                          Loading...
                        </span>
                      </div>
                    )}

                    <div className="sv-poster-info">
                      <p className="sv-poster-title line-clamp-2 font-display">{title}</p>
                      <div className="sv-poster-meta">
                        {rating > 0 && (
                          <span className="sv-rating">
                            <svg viewBox="0 0 24 24">
                              <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.9-6.2 3.9 1.6-7L2 9.2l7.1-.6z" />
                            </svg>
                            {rating.toFixed(1)}
                          </span>
                        )}
                        <span>{year}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
