import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';

const footerGroups = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Browse', href: '/browse' },
      { label: 'Movies', href: '/movies' },
      { label: 'TV Shows', href: '/series' },
      { label: 'My Lists', href: '/lists' },
    ],
  },
  {
    title: 'Discover',
    links: [
      { label: 'New & Popular', href: '/new' },
      { label: 'Search', href: '/search' },
      { label: 'Account', href: '/account' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/account' },
      { label: 'Terms', href: '/account' },
      { label: 'DMCA', href: '/account' },
    ],
  },
];

const socialLinks = [
  { label: 'X', href: 'https://x.com' },
  { label: 'IG', href: 'https://instagram.com' },
  { label: 'GH', href: 'https://github.com' },
];

const Footer: React.FC = () => {
  return (
    <footer className="border-t px-6 py-14" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <AppLogo text="Stream" iconName="FilmIcon" size={28} />
            <p className="max-w-xs text-sm leading-6" style={{ color: 'rgba(240,240,240,0.58)' }}>
              Discover your next obsession with hand-picked movies, binge-worthy series, and a smarter way to watch.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border text-[10px] font-semibold tracking-[0.16em] transition-all duration-200 hover:border-violet-500/60 hover:text-white hover:shadow-[0_0_0_1px_rgba(123,47,255,0.4)]"
                  style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(240,240,240,0.7)' }}
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {group.title}
              </h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors duration-200 hover:text-white"
                      style={{ color: 'rgba(240,240,240,0.5)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-10 flex flex-col gap-3 border-t pt-6 md:flex-row md:items-center md:justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(240,240,240,0.35)' }}>
            © 2026 Stream. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-5 text-xs" style={{ color: 'rgba(240,240,240,0.35)' }}>
            <Link href="/account" className="transition-colors duration-200 hover:text-white" style={{ color: 'inherit' }}>Privacy</Link>
            <Link href="/account" className="transition-colors duration-200 hover:text-white" style={{ color: 'inherit' }}>Terms</Link>
            <Link href="/account" className="transition-colors duration-200 hover:text-white" style={{ color: 'inherit' }}>Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
