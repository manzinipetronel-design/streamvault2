'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { EyeOff } from 'lucide-react';
import type { TMDBCatalogCollection, TMDBEraKey, TMDBKidsCollection } from '@/lib/services/tmdbService';
import UpcomingBadge from '@/components/UpcomingBadge';
import { useKidsControls } from '@/contexts/KidsControlsContext';

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
  mediaType?: 'movie' | 'tv';
  collection?: TMDBCatalogCollection;
  era?: TMDBEraKey;
  kidsCollection?: TMDBKidsCollection;
  totalResults: number;
  totalPages: number;
}

export default function CatalogGrid({
  items,
  providerId,
  companyId,
  genreId,
  mediaType,
  collection,
  era,
  kidsCollection,
  totalResults,
  totalPages,
}: CatalogGridProps) {
  const [loadedItems, setLoadedItems] = useState(items);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedTotalPages, setLoadedTotalPages] = useState(totalPages);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CatalogMovie[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [busyTitle, setBusyTitle] = useState<string | null>(null);
  const {
    isHidden,
    hideTitle,
    error: kidsControlsError,
    loadError: kidsControlsLoadError,
    loading: kidsControlsLoading,
  } = useKidsControls();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const canRealSearch = providerId != null || companyId != null || genreId != null;
  const canLoadMore = !query.trim() && currentPage < loadedTotalPages;

  const loadMore = async () => {
    if (isLoadingMore || !canLoadMore) return;

    setIsLoadingMore(true);
    setLoadMoreFailed(false);
    try {
      const params = new URLSearchParams({ page: String(currentPage + 1) });
      if (providerId != null) params.set('provider', String(providerId));
      if (companyId != null) params.set('company', String(companyId));
      if (genreId != null) params.set('genre', String(genreId));
      if (mediaType) params.set('type', mediaType);
      if (collection) params.set('collection', collection);
      if (era) params.set('era', era);
      if (kidsCollection) params.set('kids', kidsCollection);

      const response = await fetch(`/api/catalog-page?${params.toString()}`);
      if (!response.ok) throw new Error('catalog page request failed');
      const result = await response.json();
      const nextItems = (result.items || []) as CatalogMovie[];
      setLoadedItems((currentItems) => {
        const existing = new Set(currentItems.map((item) => `${item.mediaType}-${item.id}`));
        return [
          ...currentItems,
          ...nextItems.filter((item) => !existing.has(`${item.mediaType}-${item.id}`)),
        ];
      });
      setCurrentPage(currentPage + 1);
      setLoadedTotalPages(result.totalPages || loadedTotalPages);
    } catch {
      setLoadMoreFailed(true);
    } finally {
      setIsLoadingMore(false);
    }
  };

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
        if (mediaType) params.set('type', mediaType);

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
  }, [query, providerId, companyId, genreId, mediaType, canRealSearch]);

  // Fallback: local filter over the preloaded pool, used when there's no
  // provider/company id to search against, or the network search failed.
  const localFiltered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return loadedItems.filter((m) => m.title.toLowerCase().includes(q));
  }, [items, loadedItems, query]);

  const showing = query.trim()
    ? searchResults !== null
      ? searchResults
      : searchFailed
        ? localFiltered
        : []
    : loadedItems;
  const visibleItems = kidsCollection
    ? kidsControlsLoading || kidsControlsLoadError
      ? []
      : showing.filter((item) => !isHidden(item.id, item.mediaType))
    : showing;

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
      ) : kidsCollection && (kidsControlsLoading || kidsControlsLoadError) ? (
        <p role="status" className="py-16 text-center text-sm text-muted">
          {kidsControlsLoading
            ? 'Loading Kids settings…'
            : 'Kids titles are hidden because saved settings could not be loaded.'}
        </p>
      ) : visibleItems.length === 0 && query.trim() ? (
        <p className="text-muted text-sm py-16 text-center">No titles match &ldquo;{query}&rdquo;.</p>
      ) : visibleItems.length === 0 && kidsCollection ? (
        <p className="text-muted text-sm py-16 text-center">
          {showing.length > 0
            ? 'All titles here are hidden. Parents can restore titles in Account Settings.'
            : 'No titles are available for this catalog right now.'}
        </p>
      ) : (
        <div className="spotlight-scope grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {visibleItems.map((m) => {
            const year = m.release_date ? m.release_date.slice(0, 4) : '';
            const mediaKey = `${m.mediaType}:${m.id}`;
            return (
              <div
                key={m.id}
                className="group/card relative overflow-hidden rounded-[10px]"
              >
                <Link
                  id={`catalog-item-${m.id}`}
                  href={`/media/${m.mediaType}/${m.id}`}
                  prefetch={false}
                  className="group relative block rounded-[10px] overflow-hidden"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-void-2">
                  <span className="absolute top-2 left-2 z-10 text-[9px] font-display font-semibold uppercase tracking-wide text-foreground/80 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded">
                    {m.mediaType === 'tv' ? 'Series' : 'Movie'}
                  </span>
                  <div className="absolute top-2 right-2 z-10">
                    <UpcomingBadge releaseDate={m.release_date} />
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                    alt={m.title}
                    loading="lazy"
                    decoding="async"
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
                {kidsCollection && (
                  <button
                    type="button"
                    aria-label={`Hide ${m.title} from Kids`}
                    title="Hide this title from Kids"
                    disabled={busyTitle === mediaKey}
                    onClick={async () => {
                      setBusyTitle(mediaKey);
                      await hideTitle({
                        media_id: String(m.id),
                        media_type: m.mediaType,
                        title: m.title,
                        poster_path: m.poster_path || null,
                      });
                      setBusyTitle(null);
                    }}
                    className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/75 text-white opacity-100 backdrop-blur-sm transition hover:bg-rose-600 disabled:opacity-50 md:opacity-0 md:group-hover/card:opacity-100"
                  >
                    <EyeOff className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {kidsCollection && kidsControlsError && (
        <p role="alert" className="mt-3 text-xs text-rose-400">{kidsControlsError}</p>
      )}
      {canLoadMore && (
        <div className="flex flex-col items-center gap-2 py-10">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            aria-busy={isLoadingMore}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-6 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.12] disabled:cursor-wait disabled:opacity-60"
          >
            {isLoadingMore ? 'Loading…' : loadMoreFailed ? 'Try again' : 'Load more'}
          </button>
          {loadMoreFailed && (
            <p className="text-xs text-muted" role="status">
              Couldn’t load more titles. Please try again.
            </p>
          )}
        </div>
      )}
      {!query.trim() && totalResults > 0 && !canLoadMore && (
        <p className="py-8 text-center text-xs text-muted">You’ve reached the end.</p>
      )}
    </div>
  );
}
