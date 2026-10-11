"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  Camera,
  Tv,
  Award,
  Star,
  Layers,
} from "lucide-react";

type MobileIconName = "home" | "movies" | "series" | "browse" | "list";

interface MobileItem {
  name: string;
  href: string;
  icon: MobileIconName;
  isActive: (pathname: string) => boolean;
}

function MobileIcon({ name }: { name: MobileIconName }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-[21px] w-[21px] flex-none",
    "aria-hidden": true as const,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "movies":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="14" rx="2" />
          <path d="M3 10h18M8 6l-3-3M14 6l-3-3" />
        </svg>
      );
    case "series":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="12" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      );
    case "browse":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "list":
      return (
        <svg {...common}>
          <path d="M6 4h12v17l-6-4-6 4z" />
        </svg>
      );
  }
}

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

const MOBILE_ITEMS: MobileItem[] = [
  { name: "Home", href: "/", icon: "home", isActive: (p) => p === "/" },
  {
    name: "Movies",
    href: "/movies",
    icon: "movies",
    isActive: (pathname) =>
      pathname.startsWith("/movies") || pathname.startsWith("/media/movie"),
  },
  {
    name: "Series",
    href: "/series",
    icon: "series",
    isActive: (pathname) =>
      pathname.startsWith("/series") || pathname.startsWith("/media/tv"),
  },
  {
    name: "Browse",
    href: "/browse",
    icon: "browse",
    isActive: (pathname) =>
      pathname.startsWith("/browse") ||
      pathname.startsWith("/new") ||
      pathname.startsWith("/search"),
  },
  {
    name: "My List",
    href: "/lists?tab=watchlist",
    icon: "list",
    isActive: (pathname) => pathname.startsWith("/lists"),
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

      {/* Mobile floating glass bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed left-4 right-4 bottom-[calc(14px+env(safe-area-inset-bottom,0px))] z-50 flex h-[62px] items-center justify-between rounded-full border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-[7px] backdrop-blur-[28px] backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_14px_34px_rgba(0,0,0,0.55)]"
      >
        {MOBILE_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-label={item.name}
              aria-current={active ? "page" : undefined}
              className={`flex h-12 min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full px-2 font-display text-[11px] font-semibold transition-all duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] outline-none focus-visible:ring-2 focus-visible:ring-cyan active:scale-95 ${
                active ? "bg-foreground px-3 text-void" : "text-white/60"
              }`}
            >
              <MobileIcon name={item.icon} />
              <span
                className={`transition-all duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  active ? "max-w-[70px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default Navigation;
