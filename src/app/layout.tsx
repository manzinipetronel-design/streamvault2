import React, { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Unbounded } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import ProfileSelectorModal from '@/components/ProfileSelectorModal';
import { Navigation } from '@/components/Navigation';
import RouteProgressBar from '@/components/RouteProgressBar';

const unbounded = Unbounded({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-unbounded',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Stream — Find Your Next Obsession',
  description:
    'Stream is your personal entertainment guide for movies, shows, music, and podcasts — algorithmically sharp, editorially curated. Download free.',
  icons: {
    icon: [{ url: '/assets/images/app_logo.png', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={unbounded.variable}>
      <body className="bg-zinc-950 text-white min-h-screen">
        <AuthProvider>
          <ProfileProvider>
            <Suspense fallback={null}>
              <RouteProgressBar />
              <Navigation />
            </Suspense>
            <ProfileSelectorModal />
            {/* Full-bleed main: individual pages add safe-area padding around
              content that would otherwise sit under the floating navigation. */}
            <main className="pb-20 md:pb-0">
              {children}
            </main>
          </ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
