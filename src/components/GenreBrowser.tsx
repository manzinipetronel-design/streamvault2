'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MovieRow from '@/components/MovieRow';
import {
  getMovieOnlyByGenre,
  getSeriesByGenre,
  type TMDBCatalogItem,
} from '@/lib/services/tmdbService';

export interface RowSection {
  title: string;
  items: any[];
  isMock?: boolean;
  showRank?: boolean;
  viewAllHref: string;
}

interface GenreBrowserProps {
  mediaType: 'movie' | 'tv';
  genres: { id: number; label: string }[];
  sections: RowSection[];
  initialGenre?: number;
}

const posterUrl = (path?: string | null) =>
  path ? `https://image.tmdb.org/t/p/w342${path}` : '/assets/images/no_image.png';

export default function GenreBrowser({ mediaType, genres, sections, initialGenre }: GenreBrowserProps) {
  const [activeGenre, setActiveGenre] = useState<number | null>(initialGenre ?? null);
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState<Record<number, TMDBCatalogItem[]>>({});

  const selectGenre = async (genreId: number | null) => {
    setActiveGenre(genreId);
    if (genreId === null || cache[genreId]) return;

    setLoading(true);
    try {
      const fetcher = mediaType === 'tv' ? getSeriesByGenre : getMovieOnlyByGenre;
      const result = await fetcher(genreId);
      setCache((prev) => ({ ...prev, [genreId]: result.items }));
    } catch {
      setCache((prev) => ({ ...prev, [genreId]: [] }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialGenre !== undefined) void selectGenre(initialGenre);
    // The initial URL value is only used when the component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeItems = activeGenre !== null ? cache[activeGenre] : null;

  return (
    <>
      <div className="sv-chip-row">
        <button
          type="button"
          onClick={() => void selectGenre(null)}
          className={`sv-chip ${activeGenre === null ? 'sv-active' : ''}`}
        >
          All
        </button>
        {genres.map((genre) => (
          <button
            type="button"
            key={genre.id}
            onClick={() => void selectGenre(genre.id)}
            className={`sv-chip ${activeGenre === genre.id ? 'sv-active' : ''}`}
          >
            {genre.label}
          </button>
        ))}
      </div>

      {activeGenre === null ? (
        <div>
          {sections.map((section) => (
            <MovieRow
              key={section.title}
              title={section.title}
              items={section.items}
              isMock={section.isMock}
              showRank={section.showRank}
              mediaType={mediaType}
              viewAllHref={section.viewAllHref}
            />
          ))}
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="aspect-[2/3] rounded-[8px] bg-void-2 animate-pulse" />
          ))}
        </div>
      ) : !activeItems || activeItems.length === 0 ? (
        <p className="sv-empty">Nothing found for this genre right now.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {activeItems.map((item) => {
            const title = item.title || 'Untitled';
            const year = item.release_date ? item.release_date.split('-')[0] : '';
            const rating = item.vote_average || 0;
            return (
              <Link
                key={item.id}
                href={`/media/${item.mediaType || mediaType}/${item.id}`}
                prefetch={false}
                className="sv-card text-left"
              >
                <div className="sv-poster bg-void-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={posterUrl(item.poster_path)} alt={title} loading="lazy" className="quiet-media absolute inset-0 w-full h-full object-cover" />
                  <div className="sv-poster-info">
                    <p className="sv-poster-title line-clamp-2 font-display">{title}</p>
                    <div className="sv-poster-meta">
                      {rating > 0 && (
                        <span className="sv-rating">
                          <svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.9-6.2 3.9 1.6-7L2 9.2l7.1-.6z" /></svg>
                          {rating.toFixed(1)}
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
    </>
  );
}
