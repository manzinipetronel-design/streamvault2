'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X, Film, Tv, Star, Loader2 } from 'lucide-react';

export interface SearchResult {
  id: number | string;
  title: string;
  media_type: 'movie' | 'tv';
  poster_path: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

export interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen, onClose]);

  // Fetch search results when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const filteredResults = results.filter((item) => {
    if (filter === 'all') return true;
    return item.media_type === filter;
  });

  if (!isOpen) return null;

  const resolvePoster = (path?: string) => {
    if (!path) return '/assets/images/no_image.png';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w200${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center pt-16 px-4 transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Search Container */}
      <div className="w-full max-w-3xl relative">
        <div className="relative flex items-center border-b-2 border-zinc-700 focus-within:border-violet-500 transition-colors pb-2">
          <Search className="w-6 h-6 text-zinc-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV shows, actors..."
            className="w-full bg-transparent text-xl md:text-2xl text-white placeholder-zinc-500 focus:outline-none"
          />
          {loading && <Loader2 className="w-5 h-5 text-violet-500 animate-spin mr-2 flex-shrink-0" />}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-zinc-400 hover:text-white transition-colors"
              aria-label="Clear query"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-4 px-3 py-1 text-xs uppercase font-bold text-zinc-400 border border-zinc-700 rounded-md hover:bg-zinc-800 hover:text-white transition-colors"
            aria-label="Close search overlay"
          >
            ESC
          </button>
        </div>

        {/* Filter Pills */}
        {query && (
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              All Results
            </button>
            <button
              onClick={() => setFilter('movie')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === 'movie'
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              <Film className="w-3.5 h-3.5" /> Movies
            </button>
            <button
              onClick={() => setFilter('tv')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === 'tv'
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              <Tv className="w-3.5 h-3.5" /> Series
            </button>
          </div>
        )}

        {/* Results Grid */}
        <div className="mt-6 max-h-[70vh] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {filteredResults.length > 0 ? (
            filteredResults.map((item) => (
              <Link
                key={`${item.media_type}-${item.id}`}
                href={`/media/${item.media_type}/${item.id}`}
                prefetch={false}
                onClick={onClose}
                className="flex items-center gap-4 p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-700 group"
              >
                <img
                  src={resolvePoster(item.poster_path)}
                  alt={item.title}
                  className="w-12 h-16 object-cover rounded-md flex-none bg-zinc-800"
                />
                <div className="flex-grow min-w-0">
                  <h4 className="text-sm font-semibold text-white group-hover:text-violet-400 transition-colors truncate">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                    <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {item.media_type}
                    </span>
                    {(item.release_date || item.first_air_date) && (
                      <span>{(item.release_date || item.first_air_date)?.split('-')[0]}</span>
                    )}
                    {typeof item.vote_average === 'number' && item.vote_average > 0 && (
                      <span className="flex items-center gap-1 text-amber-400 font-medium">
                        <Star className="w-3 h-3 fill-current" />
                        {item.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : query && !loading ? (
            <p className="text-center text-zinc-500 py-10">No matches found for &quot;{query}&quot;</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
