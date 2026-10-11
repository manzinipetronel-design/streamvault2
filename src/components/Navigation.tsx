"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  Home,
  Camera,
  Tv,
  Award,
  Star,
  Layers,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** How to decide this item is active. Plain items match pathname exactly;
   *  'lists' items also need a specific ?tab= value, since /lists hosts
   *  favorites, watchlist, history etc. behind one route. */
  match: { type: "path" } | { type: "lists-tab"; tab: string };
}

const NAV_ITEMS: NavItem[] = [
  { name: "Home", href: "/", icon: Home, match: { type: "path" } },
  { name: "Movies", href: "/movies", icon: Camera, match: { type: "path" } },
  { name: "Series", href: "/series", icon: Tv, match: { type: "path" } },
  { name: "New & Popular", href: "/new", icon: Award, match: { type: "path" } },
  {
    name: "Favorites",
    href: "/lists?tab=favorites",
    icon: Star,
    match: { type: "lists-tab", tab: "favorites" },
  },
  {
    name: "My List",
    href: "/lists?tab=watchlist",
    icon: Layers,
    match: { type: "lists-tab", tab: "watchlist" },
  },
];

export function Navigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname === "/login") return null;

  const isItemActive = (item: NavItem) => {
    if (item.match.type === "path") return pathname === item.href;
    return (
      pathname === "/lists" &&
      (searchParams?.get("tab") ?? "history") === item.match.tab
    );
  };

  return (
    <>
      {/* Desktop / TV rail — individual floating glass circles (not one
          enclosing pill). */}
      <div className="hidden md:flex fixed left-7 top-1/2 -translate-y-1/2 z-50 flex-col items-center gap-[22px]">
        <Link
          href="/browse"
          aria-label="Browse all"
          title="Browse all"
          className="group grid h-5 w-5 grid-cols-2 gap-1 text-white/60 transition-colors duration-200 hover:text-white"
        >
          <span className="rounded-[2px] bg-current transition-transform duration-300 group-hover:-translate-x-px group-hover:-translate-y-px" />
          <span className="rounded-[2px] bg-current" />
          <span className="rounded-[2px] bg-current" />
          <span className="rounded-[2px] bg-current transition-transform duration-300 group-hover:translate-x-px group-hover:translate-y-px" />
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex flex-col items-center gap-3.5"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);
            const isHome = item.name === "Home";

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.name}
                title={item.name}
                className={`
                  relative flex items-center justify-center w-11 h-11 rounded-full
                  bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08]
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.4)]
                  transition-all duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)]
                  outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50 focus-visible:outline-offset-2
                  ${
                    active
                      ? "bg-foreground text-void border-transparent shadow-[0_8px_22px_rgba(0,0,0,0.5)]"
                      : "text-white/70 hover:text-white hover:bg-white/[0.14] hover:border-white/20 hover:scale-[1.08] hover:translate-x-0.5 active:scale-95"
                  }
                `}
              >
                {[
                  "Movies",
                  "Series",
                  "New & Popular",
                  "Favorites",
                  "My List",
                ].includes(item.name) ? (
                  <img
                    src={
                      item.name === "Movies"
                        ? "/assets/icons/movies-popcorn.png"
                        : item.name === "Series"
                          ? "/assets/icons/series-screen-play.svg"
                          : item.name === "New & Popular"
                            ? "/assets/icons/new-popular-flame.svg"
                            : item.name === "Favorites"
                              ? "/assets/icons/favorites-heart-star.svg"
                              : "/assets/icons/my-list-bullets.svg"
                    }
                    alt=""
                    className={`h-[22px] w-[22px] object-contain brightness-0 ${
                      active ? "" : "invert"
                    }`}
                  />
                ) : (
                  <Icon
                    className={
                      isHome ? "h-[22px] w-[22px]" : "h-[18px] w-[18px]"
                    }
                    strokeWidth={isHome ? 2.5 : undefined}
                  />
                )}
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
          {
            name: "Home",
            href: "/",
            icon: Home,
            match: { type: "path" as const },
          },
          {
            name: "Movies",
            href: "/movies",
            icon: Camera,
            match: { type: "path" as const },
          },
          {
            name: "Series",
            href: "/series",
            icon: Tv,
            match: { type: "path" as const },
          },
          {
            name: "New & Popular",
            href: "/new",
            icon: Award,
            match: { type: "path" as const },
          },
          {
            name: "Browse",
            href: "/browse",
            icon: LayoutGrid,
            match: { type: "path" as const },
          },
          {
            name: "Favorites",
            href: "/lists?tab=favorites",
            icon: Star,
            match: { type: "lists-tab" as const, tab: "favorites" },
          },
          {
            name: "My List",
            href: "/lists?tab=watchlist",
            icon: Layers,
            match: { type: "lists-tab" as const, tab: "watchlist" },
          },
        ].map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item as NavItem);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.name === "New & Popular" ? item.name : undefined}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl border py-1.5 text-[8px] font-medium transition-colors duration-200 ${
                active
                  ? "border-violet-400/20 bg-violet-500/10 text-white"
                  : "border-transparent text-white/55 hover:text-white/85"
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 h-0.5 w-5 rounded-full bg-violet-400"
                />
              )}
              {item.name === "Home" ? (
                <img
                  src="/assets/icons/home-house.png"
                  alt=""
                  className="h-[22px] w-[22px] object-contain brightness-0 invert"
                />
              ) : item.name === "Movies" ? (
                <img
                  src="/assets/icons/movies-popcorn.png"
                  alt=""
                  className="h-[22px] w-[22px] object-contain brightness-0 invert"
                />
              ) : item.name === "Series" ? (
                <img
                  src="/assets/icons/series-screen-play.svg"
                  alt=""
                  className="h-[22px] w-[22px] object-contain brightness-0 invert"
                />
              ) : item.name === "My List" ? (
                <img
                  src="/assets/icons/my-list-bullets.svg"
                  alt=""
                  className="h-[22px] w-[22px] object-contain brightness-0 invert"
                />
              ) : item.name === "Favorites" ? (
                <img
                  src="/assets/icons/favorites-heart-star.svg"
                  alt=""
                  className="h-[22px] w-[22px] object-contain brightness-0 invert"
                />
              ) : item.name === "New & Popular" ? (
                <img
                  src="/assets/icons/new-popular-flame.svg"
                  alt=""
                  className="h-[22px] w-[22px] object-contain brightness-0 invert"
                />
              ) : (
                <Icon className="w-[19px] h-[19px]" />
              )}
              {item.name === "New & Popular" ? "New" : item.name}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default Navigation;
