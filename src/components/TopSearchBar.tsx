'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import SearchOverlay from './SearchOverlay';

/**
 * Floating search pill + filter button that sits top-right of the hero,
 * matching the reference layout. Actual search logic (debounced fetch to
 * /api/search, results list, movie/tv filter) lives in SearchOverlay —
 * this component is just the trigger so we're not duplicating that logic.
 */
export default function TopSearchBar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (Math.abs(scrollDelta) > 4) {
        setIsHidden(currentScrollY > 80 && scrollDelta > 0);
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const glass =
    'bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)]';

  return (
    <>
      <div
        className={`fixed top-5 right-4 md:right-8 z-40 flex items-center gap-2.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isHidden ? '-translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <button
          onClick={() => setIsSearchOpen(true)}
          aria-label="Search"
          className={`flex items-center gap-2.5 pl-4 pr-3 h-11 sm:w-[220px] md:w-[280px] rounded-full text-muted transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-foreground hover:border-white/20 hover:bg-gradient-to-b hover:from-white/[0.11] hover:to-white/[0.04] ${glass}`}
        >
          <Search className="w-[17px] h-[17px] shrink-0" />
          <span className="hidden sm:inline text-[13px] font-medium truncate">
            Search for Movie
          </span>
        </button>
        <button
          onClick={() => setIsSearchOpen(true)}
          aria-label="Filter"
          className={`flex items-center justify-center w-11 h-11 rounded-full text-foreground shrink-0 transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/20 hover:bg-gradient-to-b hover:from-white/[0.13] hover:to-white/[0.04] hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_22px_rgba(0,0,0,0.45)] active:translate-y-0 active:scale-95 ${glass}`}
        >
          <SlidersHorizontal className="w-[16px] h-[16px]" />
        </button>
      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
