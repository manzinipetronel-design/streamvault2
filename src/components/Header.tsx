'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Search } from 'lucide-react';
import SearchOverlay from './SearchOverlay';

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = () => {
    const name = user?.user_metadata?.full_name || '';
    const email = user?.email || '';
    if (name.trim()) {
      return name
        .trim()
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || 'U';
  };

  const handleNavClick = (item: string) => {
    const route = item.toLowerCase() === 'shows' ? '/series' : '/movies';
    router.push(route);
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-[200] px-6 py-4 transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(13,13,13,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <nav className="desktop-nav hidden md:flex items-center gap-8">
            {['Movies', 'Shows'].map((item) => (
              <button
                key={item}
                onClick={() => handleNavClick(item)}
                className="text-sm font-medium transition-colors duration-200 bg-transparent border-none cursor-pointer"
                style={{ color: 'rgba(240,240,240,0.55)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#00E5FF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,240,0.55)')}
              >
                {item}
              </button>
            ))}
            <Link
              href="/browse"
              prefetch={false}
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: 'rgba(240,240,240,0.55)', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#00E5FF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,240,0.55)')}
            >
              Browse
            </Link>
            <Link
              href="/lists"
              prefetch={false}
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: 'rgba(240,240,240,0.55)', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#00E5FF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240,240,240,0.55)')}
            >
              My Lists
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Search Icon Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
              aria-label="Open Search"
            >
              <Search className="w-5 h-5" />
              <span className="hidden md:inline text-sm">Search titles...</span>
            </button>

            {!loading && (
              <>
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200"
                      style={{
                        background: 'linear-gradient(135deg, #7B2FFF, #00E5FF)',
                        color: '#fff',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {getInitials()}
                    </button>

                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-[190]" onClick={() => setMenuOpen(false)} />
                        <div
                          className="absolute right-0 top-12 rounded-xl py-2 z-[200] min-w-[180px]"
                          style={{
                            background: 'rgba(20,20,30,0.98)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                          }}
                        >
                          <div
                            className="px-4 py-2 mb-1"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                          >
                            <p className="text-xs font-bold" style={{ color: '#F0F0F0' }}>
                              {user?.user_metadata?.full_name || 'Stream User'}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(240,240,240,0.4)' }}>
                              {user?.email}
                            </p>
                          </div>
                          {[
                            { label: 'Account Details', href: '/account', icon: '👤' },
                            { label: 'My Lists', href: '/lists', icon: '📋' },
                            { label: 'Favorites', href: '/lists?tab=favorites', icon: '❤️' },
                            { label: 'Watchlist', href: '/lists?tab=watchlist', icon: '🔖' },
                          ].map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              prefetch={false}
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150"
                              style={{ color: 'rgba(240,240,240,0.7)', textDecoration: 'none' }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background =
                                  'rgba(123,47,255,0.15)';
                                (e.currentTarget as HTMLElement).style.color = '#F0F0F0';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                (e.currentTarget as HTMLElement).style.color =
                                  'rgba(240,240,240,0.7)';
                              }}
                            >
                              <span>{item.icon}</span>
                              <span>{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    prefetch={false}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, #7B2FFF, #9B5FFF)',
                      color: '#fff',
                      boxShadow: '0 0 20px rgba(123,47,255,0.4)',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow =
                        '0 0 30px rgba(123,47,255,0.7), 0 0 50px rgba(0,229,255,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow =
                        '0 0 20px rgba(123,47,255,0.4)';
                    }}
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Render Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Header;
