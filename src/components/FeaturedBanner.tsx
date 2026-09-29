"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Play } from "lucide-react";

interface FeaturedItem {
  id: number;
  title: string;
  overview?: string;
  backdropPath?: string | null;
  posterPath?: string | null;
  year?: string;
  rating?: number;
}

interface FeaturedBannerProps {
  items: FeaturedItem[];
  mediaType: "movie" | "tv";
  eyebrow: string;
}

function imageUrlFor(item: FeaturedItem) {
  const image = item.backdropPath || item.posterPath;
  if (!image) return null;
  return image.startsWith("http")
    ? image
    : `https://image.tmdb.org/t/p/w1280${image}`;
}

function thumbUrlFor(item: FeaturedItem) {
  const image = item.posterPath || item.backdropPath;
  if (!image) return null;
  return image.startsWith("http")
    ? image
    : `https://image.tmdb.org/t/p/w200${image}`;
}

export default function FeaturedBanner({
  items,
  mediaType,
  eyebrow,
}: FeaturedBannerProps) {
  const [index, setIndex] = useState(0);
  const itemCount = useRef(items.length);
  itemCount.current = items.length;

  useEffect(() => {
    const interval = setInterval(() => {
      if (itemCount.current <= 1) return;
      setIndex((previous) => (previous + 1) % itemCount.current);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) return null;
  const display = items[index] ?? items[0];
  const imageUrl = imageUrlFor(display);

  return (
    <div className="sv-featured">
      <div className="sv-featured-media">
        <AnimatePresence>
          {imageUrl ? (
            <motion.div
              key={display.id}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={imageUrl}
                alt={display.title}
                fill
                sizes="(max-width: 768px) 100vw, 1280px"
                priority
              />
            </motion.div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet/30 via-void to-void" />
          )}
        </AnimatePresence>
      </div>
      <div className="sv-featured-fade" />

      <AnimatePresence mode="wait">
        <motion.div
          key={display.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="sv-featured-body"
        >
          <div className="sv-featured-eyebrow font-display">{eyebrow}</div>
          <h2 className="sv-featured-title font-display">{display.title}</h2>
          <div className="sv-featured-meta">
            {display.rating ? `${display.rating.toFixed(1)} ★` : null}
            {display.rating && display.year ? (
              <span className="w-1 h-1 rounded-full bg-muted-2" />
            ) : null}
            {display.year}
          </div>
          {display.overview && (
            <p className="sv-featured-overview">{display.overview}</p>
          )}
          <div>
            <Link
              href={`/media/${mediaType}/${display.id}`}
              prefetch={false}
              className="sv-btn sv-btn-primary sv-btn-sm font-display"
            >
              <Play className="fill-void" />
              Watch now
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {items.length > 1 && (
        <div className="sv-featured-strip">
          {items.map((item, itemIndex) => {
            const thumb = thumbUrlFor(item);
            return (
              <button
                key={item.id}
                onClick={() => setIndex(itemIndex)}
                aria-label={`Show ${item.title}`}
                className={`sv-featured-thumb ${itemIndex === index ? "sv-active" : ""}`}
              >
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={item.title}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-void-3" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
