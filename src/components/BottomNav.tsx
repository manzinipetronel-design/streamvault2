'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Film,
  Tv,
  Compass,
  Bookmark,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
    isActive: (pathname) => pathname === '/',
  },
  {
    name: 'Movies',
    href: '/movies',
    icon: Film,
    isActive: (pathname) => pathname.startsWith('/movies') || pathname.startsWith('/media/movie'),
  },
  {
    name: 'Series',
    href: '/series',
    icon: Tv,
    isActive: (pathname) => pathname.startsWith('/series') || pathname.startsWith('/media/tv'),
  },
  {
    name: 'Browse',
    href: '/browse',
    icon: Compass,
    isActive: (pathname) => pathname.startsWith('/browse') || pathname.startsWith('/new') || pathname.startsWith('/search'),
  },
  {
    name: 'Lists',
    href: '/lists',
    icon: Bookmark,
    isActive: (pathname) => pathname.startsWith('/lists'),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  // If user is viewing the embedded full-screen player or on a login page, we can still render it or keep it accessible.
  if (pathname === '/login') {
    return null;
  }

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.isActive(pathname);

        return (
          <Link
            key={item.name}
            href={item.href}
            prefetch={false}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center select-none transition-colors duration-200 ${
              active
                ? 'text-cyan'
                : 'text-foreground/50 hover:text-foreground/80'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Icon className="w-5 h-5 transition-transform duration-200" />
              {active && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-cyan" />
              )}
            </div>
            <span className="text-[10px] font-medium tracking-tight mt-1 leading-none">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
