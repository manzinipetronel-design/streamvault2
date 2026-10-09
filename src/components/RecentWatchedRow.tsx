'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { userListsService, WatchedItem } from '@/lib/services/userListsService';

export default function RecentWatchedRow() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchedItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const fetchRecent = React.useCallback(async () => {
    try {
      const recent = await userListsService.getRecentWatched(user?.id);
      setItems(recent);
    } catch {
      // silent
    } finally {
      setLoaded(true);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRecent();

    // Re-check when window gains focus or storage changes (e.g. after watching in another tab or navigating back)
    const handleFocus = () => fetchRecent();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'stream_recent_watched_local' || e.key === 'recent_watched') {
        fetchRecent();
      }
    };
    const handleCustomUpdate = () => fetchRecent();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('recent_watched_updated', handleCustomUpdate);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('recent_watched_updated', handleCustomUpdate);
    };
  }, [fetchRecent]);

  const handleRemove = async (e: React.MouseEvent, item: WatchedItem) => {
    e.preventDefault();
    e.stopPropagation();
    setItems((prev) => prev.filter((i) => !(i.media_id === item.media_id && i.media_type === item.media_type)));
    await userListsService.removeRecentWatched(item.media_id, item.media_type, user?.id);
  };

  const scrollRow = (direction: number) => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.8;
      rowRef.current.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
  };

  // Only hide if loaded and empty. Do not render empty skeleton if user has no recent watches.
  if (loaded && items.length === 0) {
    return null;
  }

  // Pre-hydration or initial mount
  if (!loaded && items.length === 0) {
    return null;
  }

  const getPoster = (item: WatchedItem) => {
    if (item.poster_url && item.poster_url.trim()) {
      if (item.poster_url.startsWith('http') || item.poster_url.startsWith('/')) {
        return item.poster_url;
      }
      return `https://image.tmdb.org/t/p/w500${item.poster_url}`;
    }
    return 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600&h=900';
  };

  return (
    <div className="group/row flex flex-col pt-7 pb-2 relative animate-fade-in">
      <div className="flex items-baseline justify-between mb-4 px-4 md:px-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
          <h3 className="font-display text-lg md:text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            Recently watched
            <span className="text-[12px] font-normal text-muted font-sans hidden sm:inline">
              · Continue watching
            </span>
          </h3>
        </div>
        <span className="text-[12px] text-muted-strong font-medium px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border">
          {items.length} {items.length === 1 ? 'title' : 'titles'}
        </span>
      </div>

      <div className="relative">
        {/* Glass scroll buttons */}
        <button
          onClick={() => scrollRow(-1)}
          aria-label="Scroll left"
          className="absolute top-1/2 -translate-y-1/2 -left-2 w-9 h-9 rounded-full bg-void-2/70 backdrop-blur-md border border-glass-border flex items-center justify-center text-foreground opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 hover:border-violet z-20 cursor-pointer"
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
          className="movie-row spotlight-scope flex gap-[14px] overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => {
            const hasProgressBadge =
              item.media_type === 'tv' && item.season !== undefined && item.episode !== undefined;

            return (
              <Link
                key={`${item.media_type}-${item.media_id}`}
                href={`/media/${item.media_type}/${item.media_id}`}
                prefetch={false}
                className="movie-card group/card flex-none w-[130px] sm:w-[155px] md:w-[176px] snap-start relative rounded-[10px]"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-void-2 rounded-[10px] border border-white/[0.07]">
                  <Image
                    src={getPoster(item)}
                    alt={item.title || 'Watched Media'}
                    fill
                    sizes="(max-width: 640px) 130px, (max-width: 1024px) 176px, 176px"
                    className="quiet-media object-cover rounded-[10px] group-hover/card:scale-[1.045]"
                  />

                  {/* Top Type / Episode pill */}
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 pointer-events-none">
                    <span className="text-[9.5px] font-display font-semibold uppercase tracking-wider text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                      {hasProgressBadge ? `S${item.season} E${item.episode}` : item.media_type === 'tv' ? 'Series' : 'Movie'}
                    </span>
                  </div>

                  {/* Remove cross */}
                  <button
                    onClick={(e) => handleRemove(e, item)}
                    title="Remove from recently watched"
                    aria-label="Remove from recently watched"
                    className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/70 hover:bg-rose-500/80 text-white/80 hover:text-white flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-200 cursor-pointer backdrop-blur-sm border border-white/10"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Center Play glyph on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                    <div className="w-10 h-10 rounded-full bg-white/95 text-void flex items-center justify-center shadow-lg transform scale-90 group-hover/card:scale-100 transition-transform duration-200">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-void translate-x-[1px]">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Bottom progress bar */}
                  {item.duration && item.duration > 0 && typeof item.progress === 'number' ? (
                    <div className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-black/60 z-10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet to-cyan transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(3, Math.round((item.progress / item.duration) * 100)))}%`,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/15">
                      <div className="h-full bg-gradient-to-r from-violet to-cyan w-[70%]" />
                    </div>
                  )}

                  {/* Overlay for metadata */}
                  <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-void via-void/15 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <p className="font-display font-semibold text-[13px] leading-tight text-foreground mb-1 line-clamp-2">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      {item.rating && (
                        <span className="flex items-center gap-[3px] text-gold font-semibold">
                          <svg viewBox="0 0 24 24" className="w-[9px] h-[9px] fill-gold">
                            <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.9-6.2 3.9 1.6-7L2 9.2l7.1-.6z" />
                          </svg>
                          {item.rating}
                        </span>
                      )}
                      {item.duration && item.duration > 0 && typeof item.progress === 'number' ? (
                        <span className="text-cyan font-medium">
                          {Math.max(1, Math.round((item.duration - item.progress) / 60))}m left
                        </span>
                      ) : (
                        item.genre && <span>{item.genre}</span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="font-display font-medium text-[13px] text-foreground mt-1.5 leading-tight line-clamp-1">
                  {item.title}
                </p>
                <p className="text-[11px] text-muted leading-tight line-clamp-1 mt-0.5">
                  {hasProgressBadge
                    ? `Season ${item.season}, Ep ${item.episode}`
                    : item.duration && item.duration > 0 && typeof item.progress === 'number'
                      ? `${Math.max(1, Math.round((item.duration - item.progress) / 60))}m left`
                      : item.media_type === 'tv'
                        ? 'Series'
                        : item.year || 'Movie'}
                </p>
              </Link>
            );
          })}
        </div>

        <button
          onClick={() => scrollRow(1)}
          aria-label="Scroll right"
          className="absolute top-1/2 -translate-y-1/2 -right-2 w-9 h-9 rounded-full bg-void-2/70 backdrop-blur-md border border-glass-border flex items-center justify-center text-foreground opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 hover:border-violet z-20 cursor-pointer"
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
    </div>
  );
}
