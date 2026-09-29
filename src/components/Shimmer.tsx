'use client';

import React, { useState } from 'react';

type ShimmerImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

/**
 * Drop-in replacement for a plain <img>. Shows the slow diagonal shimmer
 * (see .shimmer-diagonal in tailwind.css) behind the image until it has
 * actually finished loading — tracked via the real onLoad event, not a
 * guessed timeout — then crossfades to the photo.
 *
 * Must be used inside a `relative` container, since the shimmer overlay
 * positions itself with `absolute inset-0`. Every existing call site
 * already has one (the rounded/overflow-hidden wrapper div around each
 * poster, thumbnail, or avatar), so this is a straight swap for <img>
 * with no markup restructuring needed.
 */
export function ShimmerImage({ className = '', onLoad, alt, ...imgProps }: ShimmerImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <div className="absolute inset-0 shimmer-diagonal" aria-hidden="true" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...imgProps}
        alt={alt}
        className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
      />
    </>
  );
}

/**
 * Shaped placeholder for the "we don't have the list yet at all" loading
 * state (e.g. while a row's data is still being fetched). Pass the same
 * size/shape classes the real card uses (width, aspect ratio, rounding) so
 * there's no layout jump once data arrives — this replaces the previous
 * flat `bg-void-2 animate-pulse` skeletons with the same shimmer visual
 * ShimmerImage uses, so the two loading moments read as one language
 * instead of two different treatments.
 */
export function ShimmerCard({ className = '' }: { className?: string }) {
  return <div className={`shimmer-diagonal ${className}`} aria-hidden="true" />;
}
