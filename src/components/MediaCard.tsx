'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Plus, Star } from 'lucide-react';

export interface MediaCardProps {
  id: string | number;
  title: string;
  posterPath: string;
  voteAverage?: number;
  releaseYear?: string;
  mediaType?: 'movie' | 'tv';
  onPlay?: (e: React.MouseEvent) => void;
  onWatchlist?: (e: React.MouseEvent) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  id,
  title,
  posterPath,
  voteAverage,
  releaseYear,
  mediaType = 'movie',
  onPlay,
  onWatchlist,
}) => {
  // Handle relative TMDB poster paths gracefully if provided
  const resolvedPoster =
    posterPath?.startsWith('http') || posterPath?.startsWith('data:') || posterPath?.startsWith('blob:')
      ? posterPath
      : posterPath
      ? `https://image.tmdb.org/t/p/w500${posterPath}`
      : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600&h=900';

  const handlePlayClick = (e: React.MouseEvent) => {
    if (onPlay) {
      e.preventDefault();
      e.stopPropagation();
      onPlay(e);
    }
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    if (onWatchlist) {
      e.preventDefault();
      e.stopPropagation();
      onWatchlist(e);
    }
  };

  return (
    <Link
      href={`/media/${mediaType}/${id}`}
      prefetch={false}
      className="group relative flex-none w-44 md:w-52 rounded-xl overflow-hidden bg-zinc-900 shadow-md transition-all duration-300 ease-out hover:scale-105 hover:z-20 hover:shadow-2xl hover:shadow-violet-500/20 focus:outline-none focus:ring-2 focus:ring-violet-500"
    >
      {/* Poster Image */}
      <div className="aspect-[2/3] w-full overflow-hidden relative">
        <img
          src={resolvedPoster}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Dynamic Dark Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          {/* Action Icons */}
          <div className="flex items-center gap-2 mb-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <button
              type="button"
              onClick={handlePlayClick}
              aria-label="Play"
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors shadow-lg cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={handleWatchlistClick}
              aria-label="Add to Watchlist"
              className="w-10 h-10 rounded-full bg-zinc-800/80 text-white border border-zinc-600 flex items-center justify-center hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Title & Ratings Info */}
          <h3 className="text-sm font-bold text-white line-clamp-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
            {title}
          </h3>

          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-300 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-100">
            {typeof voteAverage === 'number' && voteAverage > 0 && (
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-current" />
                {voteAverage.toFixed(1)}
              </span>
            )}
            {releaseYear && <span>{releaseYear}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MediaCard;
