'use client';

import React, { useState, useEffect } from 'react';
import { Play, Info, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';

export interface HeroBannerProps {
  id: string | number;
  title: string;
  overview: string;
  backdropPath: string;
  mediaType?: 'movie' | 'tv';
  youtubeTrailerKey?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  id,
  title,
  overview,
  backdropPath,
  mediaType = 'movie',
  youtubeTrailerKey,
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (!youtubeTrailerKey) return;
    const timer = setTimeout(() => {
      setShowTrailer(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [youtubeTrailerKey]);

  // Support both full URL and TMDB relative path
  let resolvedBackdrop = backdropPath || '';
  if (resolvedBackdrop.includes('image.tmdb.org/t5/p/')) {
    resolvedBackdrop = resolvedBackdrop.replace('image.tmdb.org/t5/p/', 'image.tmdb.org/t/p/');
  } else if (resolvedBackdrop && !resolvedBackdrop.startsWith('http') && resolvedBackdrop !== '/placeholder-hero') {
    resolvedBackdrop = `https://image.tmdb.org/t/p/original${resolvedBackdrop.startsWith('/') ? '' : '/'}${resolvedBackdrop}`;
  }

  return (
    <div className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden bg-black">
      {/* Background Trailer or Poster Image */}
      {showTrailer && youtubeTrailerKey ? (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden scale-150">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeTrailerKey}?autoplay=1&mute=${
              isMuted ? 1 : 0
            }&controls=0&showinfo=0&rel=0&loop=1&playlist=${youtubeTrailerKey}&playsinline=1&modestbranding=1&disablekb=1&fs=0&enablejsapi=1`}
            title={title}
            className="w-full h-full object-cover border-0 pointer-events-none"
            allow="autoplay; encrypted-media"
          />
        </div>
      ) : (
        <img
          src={resolvedBackdrop || backdropPath}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        />
      )}

      {/* Cinematic Vignette Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent w-full md:w-2/3 z-10" />

      {/* Hero Content */}
      <div className="relative z-20 max-w-7xl mx-auto h-full px-6 flex flex-col justify-end pb-16 md:pb-24">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight drop-shadow-md">
            {title}
          </h1>

          <p className="text-sm md:text-base text-zinc-300 line-clamp-3 leading-relaxed drop-shadow">
            {overview}
          </p>

          <div className="flex items-center gap-4 pt-2">
            <Link
              href={`/media/${mediaType}/${id}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-bold text-sm md:text-base hover:bg-zinc-200 transition-colors shadow-lg"
            >
              <Play className="w-5 h-5 fill-current" />
              Watch Now
            </Link>

            <Link
              href={`/media/${mediaType}/${id}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800/80 text-white border border-zinc-700/80 font-semibold text-sm md:text-base hover:bg-zinc-700 transition-colors backdrop-blur-md"
            >
              <Info className="w-5 h-5" />
              More Info
            </Link>
          </div>
        </div>
      </div>

      {/* Mute Control */}
      {showTrailer && youtubeTrailerKey && (
        <button
          onClick={() => setIsMuted(!isMuted)}
          aria-label={isMuted ? 'Unmute Trailer' : 'Mute Trailer'}
          className="absolute bottom-16 right-6 md:bottom-24 md:right-12 z-20 p-3 rounded-full bg-zinc-900/80 text-white border border-zinc-700/80 hover:bg-zinc-800 transition-all backdrop-blur-md"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-zinc-400" /> : <Volume2 className="w-5 h-5 text-violet-400" />}
        </button>
      )}
    </div>
  );
};

export default HeroBanner;
