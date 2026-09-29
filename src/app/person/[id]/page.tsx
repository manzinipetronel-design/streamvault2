'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  getPersonDetails,
  getPersonCredits,
  TMDBPersonDetail,
  TMDBCatalogItem,
} from '@/lib/services/tmdbService';

// Same glass scroll-arrow pair used elsewhere (media detail page, homepage
// rows) — kept local here since it's a small, self-contained bit of UI and
// this page doesn't currently share a component file with those.
function RowScrollButtons({ onLeft, onRight }: { onLeft: () => void; onRight: () => void }) {
  return (
    <>
      <button
        onClick={onLeft}
        aria-label="Scroll left"
        className="absolute top-1/2 -translate-y-1/2 -left-2 w-9 h-9 rounded-full bg-void-2/70 backdrop-blur-md border border-glass-border flex items-center justify-center text-foreground opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 hover:border-violet z-10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[15px] h-[15px]">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={onRight}
        aria-label="Scroll right"
        className="absolute top-1/2 -translate-y-1/2 -right-2 w-9 h-9 rounded-full bg-void-2/70 backdrop-blur-md border border-glass-border flex items-center justify-center text-foreground opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 hover:border-violet z-10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[15px] h-[15px]">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </>
  );
}

function CreditRow({ title, items }: { title: string; items: TMDBCatalogItem[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: direction * rowRef.current.clientWidth * 0.8, behavior: 'smooth' });
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="mt-10 group/row">
      <div className="inline-flex items-center gap-1.5 font-display text-lg font-semibold text-foreground mb-5">
        {title}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-muted">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
      <div className="relative">
        <RowScrollButtons onLeft={() => scroll(-1)} onRight={() => scroll(1)} />
        <div
          ref={rowRef}
          className="spotlight-scope flex gap-6 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <Link
              key={`${item.mediaType}-${item.id}`}
              href={`/media/${item.mediaType}/${item.id}`}
              prefetch={false}
              className="group flex-none w-[170px] snap-start text-left cursor-pointer"
            >
              <div className="relative aspect-[2/3] rounded-[10px] overflow-hidden bg-void-2 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                  alt={item.title}
                  loading="lazy"
                  className="quiet-media w-full h-full object-cover group-hover:scale-[1.045]"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-2.5 bg-gradient-to-t from-void via-void/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {item.vote_average > 0 && (
                    <span className="flex items-center gap-[3px] text-gold text-[11px] font-semibold">
                      <svg viewBox="0 0 24 24" className="w-[9px] h-[9px] fill-gold">
                        <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.9-6.2 3.9 1.6-7L2 9.2l7.1-.6z" />
                      </svg>
                      {item.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <p className="font-display text-[13px] font-semibold text-foreground leading-tight line-clamp-1">
                {item.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const personId = params.id as string;

  const [person, setPerson] = useState<TMDBPersonDetail | null>(null);
  const [credits, setCredits] = useState<{ movies: TMDBCatalogItem[]; shows: TMDBCatalogItem[] }>({
    movies: [],
    shows: [],
  });
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    async function fetchPerson() {
      setLoading(true);
      try {
        const [detail, creditsData] = await Promise.all([
          getPersonDetails(Number(personId)),
          getPersonCredits(Number(personId)),
        ]);
        setPerson(detail);
        setCredits(creditsData);
      } finally {
        setLoading(false);
      }
    }
    if (personId) fetchPerson();
  }, [personId]);

  if (loading) {
    return (
      <main className="bg-void text-foreground min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent border-violet animate-spin" />
            <p className="text-xs text-muted font-medium tracking-wider uppercase">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!person) {
    return (
      <main className="bg-void text-foreground min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8">
            <p className="font-display text-2xl font-bold mb-4">Person Not Found</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-violet/20 border border-violet/40 text-foreground hover:bg-violet/30 transition-all cursor-pointer"
            >
              ← Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  const fullBio = person.biography || 'No biography available.';
  const canTruncate = fullBio.length > 280;
  const displayedBio = canTruncate && !bioExpanded ? `${fullBio.slice(0, 270)}...` : fullBio;

  return (
    <main className="page-enter bg-void text-foreground min-h-screen overflow-x-hidden">
      <Header />

      {/* ── Hero — warm gradient wash behind a circular photo + name + bio,
          matching the Apple TV+ reference rather than the movie-detail
          page's own violet/magenta hero treatment; people get a distinct,
          warmer identity so this page doesn't feel like a re-skinned title
          page. ── */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              'linear-gradient(115deg, #3a2f28 0%, #6b4a35 35%, #8a5a3d 55%, #2a2420 100%)',
          }}
        />
        {person.backdropImg && (
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-25 blur-2xl scale-110"
            style={{ backgroundImage: `url('${person.backdropImg}')` }}
          />
        )}
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-10 pt-28 pb-10 md:pt-32 md:pb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-8">
            <div className="flex-none w-[130px] h-[130px] md:w-[170px] md:h-[170px] rounded-full overflow-hidden border-2 border-white/[0.15] shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-void-2">
              {person.profileImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={person.profileImg} alt={person.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-display font-bold text-muted">
                  {person.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 max-w-2xl">
              <h1 className="font-display text-3xl md:text-[44px] font-extrabold tracking-[-0.02em] leading-[1.02] text-white mb-3">
                {person.name}
              </h1>
              <p className="text-[14.5px] leading-[1.65] text-white/80">
                {displayedBio}
                {canTruncate && (
                  <button
                    onClick={() => setBioExpanded(!bioExpanded)}
                    className="inline-flex items-center ml-1.5 text-[13px] font-bold text-white hover:text-violet-light transition-colors align-baseline"
                  >
                    {bioExpanded ? 'LESS' : 'MORE'}
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Credit rows ── */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 pb-24">
        <CreditRow title="Movies" items={credits.movies} />
        <CreditRow title="Shows" items={credits.shows} />
      </div>

      <Footer />
    </main>
  );
}
