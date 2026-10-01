'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutGrid,
  Home,
  Camera,
  Tv,
  Award,
  Star,
  Layers,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** How to decide this item is active. Plain items match pathname exactly;
   *  'lists' items also need a specific ?tab= value, since /lists hosts
   *  favorites, watchlist, history etc. behind one route. */
  match: { type: 'path' } | { type: 'lists-tab'; tab: string };
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Home', href: '/', icon: Home, match: { type: 'path' } },
  { name: 'Movies', href: '/movies', icon: Camera, match: { type: 'path' } },
  { name: 'Series', href: '/series', icon: Tv, match: { type: 'path' } },
  { name: 'New & Popular', href: '/new', icon: Award, match: { type: 'path' } },
  { name: 'Favorites', href: '/lists?tab=favorites', icon: Star, match: { type: 'lists-tab', tab: 'favorites' } },
  { name: 'My List', href: '/lists?tab=watchlist', icon: Layers, match: { type: 'lists-tab', tab: 'watchlist' } },
];

export function Navigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname === '/login') return null;

  const isItemActive = (item: NavItem) => {
    if (item.match.type === 'path') return pathname === item.href;
    return pathname === '/lists' && (searchParams?.get('tab') ?? 'history') === item.match.tab;
  };

  return (
    <>
      {/* Desktop / TV rail — individual floating glass circles (not one
          enclosing pill), matching the reference layout: a standalone
          "Browse" grid button up top with a visible gap, then the main
          stack of destinations below it. */}
      <div className="hidden md:flex fixed left-7 top-1/2 -translate-y-1/2 z-50 flex-col items-center gap-[22px]">
        <Link
          href="/browse"
          aria-label="Browse all"
          className="group grid grid-cols-2 gap-1 w-5 h-5 text-white/60 hover:text-white transition-colors duration-200"
        >
          <span className="rounded-[2px] bg-current transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-px group-hover:-translate-y-px" />
          <span className="rounded-[2px] bg-current" />
          <span className="rounded-[2px] bg-current" />
          <span className="rounded-[2px] bg-current transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-px group-hover:translate-y-px" />
        </Link>

        <nav aria-label="Main navigation" className="flex flex-col items-center gap-3.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.name}
                title={item.name}
                className={`
                  relative flex items-center justify-center w-11 h-11 rounded-full
                  bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-2xl
                  border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)]
                  transition-all duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)]
                  outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50 focus-visible:outline-offset-2
                  ${
                    active
                      ? 'bg-foreground text-void border-transparent shadow-[0_8px_22px_rgba(0,0,0,0.5)]'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.14] hover:border-white/20 hover:scale-[1.08] hover:translate-x-0.5 active:scale-95'
                  }
                `}
              >
                <Icon className="w-[18px] h-[18px]" />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] bg-void/85 backdrop-blur-2xl border-t border-white/10"
      >
        {[
          { name: 'Home', href: '/', icon: Home, match: { type: 'path' as const } },
          { name: 'Movies', href: '/movies', icon: Camera, match: { type: 'path' as const } },
          { name: 'Series', href: '/series', icon: Tv, match: { type: 'path' as const } },
          { name: 'Browse', href: '/browse', icon: LayoutGrid, match: { type: 'path' as const } },
          { name: 'My List', href: '/lists?tab=watchlist', icon: Layers, match: { type: 'lists-tab' as const, tab: 'watchlist' } },
        ].map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item as NavItem);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1.5 px-2 text-[10px] font-medium transition-colors duration-200 ${
                active ? 'text-foreground' : 'text-white/50 hover:text-white/85'
              }`}
            >
              <Icon className="w-[19px] h-[19px]" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default Navigation;
