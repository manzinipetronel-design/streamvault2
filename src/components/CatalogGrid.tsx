'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

interface CatalogMovie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  mediaType: 'movie' | 'tv';
}

interface CatalogGridProps {
  items: CatalogMovie[];
  /** TMDB provider id (e.g. Netflix) — enables real cross-catalog search. */
  providerId?: number | null;
  /** TMDB company id (e.g. Marvel Studios) — enables real cross-catalog search. */
  companyId?: number | null;
  /** TMDB genre id (e.g. Action) — enables real cross-catalog search. */
  genreId?: number | null;
}

export default function CatalogGrid({ items, providerId, companyId, genreId }: CatalogGridProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CatalogMovie[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const canRealSearch = providerId != null || companyId != null || genreId != null;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults(null);
      setIsSearching(false);
      setSearchFailed(false);
      return;
    }

    if (!canRealSearch) return; // no id to search against — local filter handles it below

    setIsSearching(true);
    setSearchFailed(false);
    const thisRequestId = ++requestIdRef.current;

    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed });
        if (providerId != null) params.set('provider', String(providerId));
        if (companyId != null) params.set('company', String(companyId));
        if (genreId != null) params.set('genre', String(genreId));

        const res = await fetch(`/api/catalog-search?${params.toString()}`);
        if (!res.ok) throw new Error('search request failed');
        const data = await res.json();

        if (thisRequestId === requestIdRef.current) {
          setSearchResults(data.items || []);
          setIsSearching(false);
        }
      } catch {
        if (thisRequestId === requestIdRef.current) {
          setSearchFailed(true);
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, providerId, companyId, genreId, canRealSearch]);

  // Fallback: local filter over the preloaded pool, used when there's no
  // provider/company id to search against, or the network search failed.
  const localFiltered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((m) => m.title.toLowerCase().includes(q));
  }, [items, query]);

  const showing = query.trim()
    ? searchResults !== null
      ? searchResults
      : searchFailed
        ? localFiltered
        : []
    : items;

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies..."
            className="w-full bg-void-2 border border-glass-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder-muted focus:outline-none focus:border-violet transition-colors"
          />
        </div>
      </div>

      {query.trim() && !isSearching && (
        <p className="text-[12.5px] text-muted mb-6">
          {searchFailed
            ? 'Search is temporarily unavailable — showing matches from what\u2019s already loaded.'
            : canRealSearch
              ? `${showing.length} result${showing.length === 1 ? '' : 's'}`
              : `${showing.length} result${showing.length === 1 ? '' : 's'} from what\u2019s loaded below`}
        </p>
      )}
      {query.trim() && isSearching && (
        <div className="h-4 mb-6" aria-hidden="true" />
      )}

      {isSearching ? (
        <div
          id="catalog-loading-skeletons"
          aria-busy="true"
          aria-label="Loading catalog results"
          className="spotlight-scope grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={`catalog-skeleton-${index}`}
              id={`catalog-skeleton-item-${index}`}
              className="relative aspect-[2/3] w-full rounded-[10px] overflow-hidden bg-void-2 border border-glass-border/30 shimmer-wave p-3 flex flex-col justify-between"
            >
              {/* Type pill skeleton */}
              <div className="w-10 h-3.5 rounded bg-white/[0.06]" />

              {/* Bottom metadata skeleton */}
              <div className="space-y-2">
                <div className="h-3 w-4/5 rounded bg-white/[0.08]" />
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-1/3 rounded bg-white/[0.05]" />
                  <div className="h-2.5 w-1/4 rounded bg-white/[0.04]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : showing.length === 0 && query.trim() ? (
        <p className="text-muted text-sm py-16 text-center">No titles match &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="spotlight-scope grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {showing.map((m) => {
            const year = m.release_date ? m.release_date.slice(0, 4) : '';
            return (
              <Link
                key={m.id}
                id={`catalog-item-${m.id}`}
                href={`/media/${m.mediaType}/${m.id}`}
                prefetch={false}
                className="group relative rounded-[10px] overflow-hidden"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-void-2">
                  <span className="absolute top-2 left-2 z-10 text-[9px] font-display font-semibold uppercase tracking-wide text-foreground/80 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded">
                    {m.mediaType === 'tv' ? 'Series' : 'Movie'}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
                    alt={m.title}
                    loading="lazy"
                    className="quiet-media object-cover w-full h-full group-hover:scale-[1.045]"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-void via-void/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="font-display font-semibold text-[13px] leading-tight mb-1 line-clamp-2">
                      {m.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      {m.vote_average > 0 && (
                        <span className="flex items-center gap-[3px] text-gold font-semibold">
                          <svg viewBox="0 0 24 24" className="w-[9px] h-[9px] fill-gold">
                            <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.9-6.2 3.9 1.6-7L2 9.2l7.1-.6z" />
                          </svg>
                          {m.vote_average.toFixed(1)}
                        </span>
                      )}
                      <span>{year}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
