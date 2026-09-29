'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Check, Edit2, LogOut, Heart, Bookmark, Star, Tv, Film, List } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

// Preset high-res avatar options (movie/character styled presets)
const AVATAR_OPTIONS = [
  {
    id: '1',
    name: 'Cyber Neon',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    name: 'Vanguard',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    name: 'Phantom',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '4',
    name: 'Astral',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '5',
    name: 'Starlight',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
];

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
}

export default function AccountDetailsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0].url);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [videoQuality, setVideoQuality] = useState('auto');
  const [releaseAlerts, setReleaseAlerts] = useState(true);

  // Initialize avatar and preferences from localStorage or profile
  useEffect(() => {
    try {
      const savedAvatar = localStorage.getItem('user_avatar');
      if (savedAvatar) {
        setSelectedAvatar(savedAvatar);
      }
      const savedAutoplay = localStorage.getItem('pref_autoplay_next');
      if (savedAutoplay !== null) {
        setAutoplayNext(savedAutoplay === 'true');
      }
      const savedQuality = localStorage.getItem('pref_video_quality');
      if (savedQuality) {
        setVideoQuality(savedQuality);
      }
      const savedAlerts = localStorage.getItem('pref_release_alerts');
      if (savedAlerts !== null) {
        setReleaseAlerts(savedAlerts === 'true');
      }
    } catch {}
  }, []);

  // Fetch Supabase profile if user is authenticated
  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
        if (data.avatar_url && !localStorage.getItem('user_avatar')) {
          setSelectedAvatar(data.avatar_url);
        }
      } else {
        setProfile({
          id: user.id || '',
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || '',
          created_at: user.created_at || '',
        });
      }
    } catch {
      setProfile({
        id: user.id || '',
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        created_at: user.created_at || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const handleAvatarSelect = async (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    setIsEditingAvatar(false);
    try {
      localStorage.setItem('user_avatar', avatarUrl);
      if (user) {
        const supabase = createClient();
        await supabase
          .from('user_profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', user.id);
      }
    } catch {}
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/');
    } catch {
      setSigningOut(false);
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Xolani';
  const displayEmail = profile?.email || user?.email || 'xhatshwayo99@gmail.com';
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'September 8, 2026';

  const contentLinks = [
    { label: 'Favorites', href: '/lists?tab=favorites', icon: Heart },
    { label: 'Watchlist', href: '/lists?tab=watchlist', icon: Bookmark },
    { label: 'Rated Movies', href: '/lists?tab=rated-movies', icon: Film },
    { label: 'Rated TV Shows', href: '/lists?tab=rated-tv', icon: Tv },
    { label: 'Rated Episodes', href: '/lists?tab=rated-episodes', icon: Star },
    { label: 'All Lists', href: '/lists', icon: List },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-violet selection:text-white">
      {/* Ambient background glow */}
      <div
        className="fixed top-0 left-0 right-0 h-[450px] z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 100% at 50% 0%, rgba(123,47,255,0.18) 0%, rgba(123,47,255,0) 70%)',
        }}
      />

      <Header />

      <main className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 pt-28 md:pt-36 pb-24 space-y-8">
        {/* Header Title */}
        <div>
          <span className="text-xs font-bold tracking-widest text-violet-500 uppercase">
            Your Account
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-1">
            Account Details
          </h1>
        </div>

        {/* Profile Card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl">
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-zinc-800">
            {/* Animated Avatar with Glow Ring */}
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 blur opacity-75 group-hover:opacity-100 transition duration-300"></div>

              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center">
                <img
                  src={selectedAvatar}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Edit Avatar Badge */}
              <button
                onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-500 hover:scale-110 transition-all cursor-pointer"
                title="Change Avatar"
                aria-label="Change Avatar"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* User Info */}
            <div className="text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold text-white">{displayName}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Premium
                </span>
              </div>
              <p className="text-sm text-zinc-400">{displayEmail}</p>
            </div>
          </div>

          {/* Avatar Selector Tray */}
          {isEditingAvatar && (
            <div className="pt-6 pb-2 animate-fadeIn">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Choose Profile Icon
              </p>
              <div className="flex flex-wrap gap-4">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => handleAvatarSelect(avatar.url)}
                    className={`relative w-14 h-14 rounded-full overflow-hidden border-2 transition-all hover:scale-105 cursor-pointer ${
                      selectedAvatar === avatar.url
                        ? 'border-violet-500 ring-2 ring-violet-500/50'
                        : 'border-zinc-700 opacity-60 hover:opacity-100'
                    }`}
                    title={avatar.name}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                    />
                    {selectedAvatar === avatar.url && (
                      <div className="absolute inset-0 bg-violet-600/40 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Account Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Full Name
              </span>
              <p className="text-sm font-semibold text-zinc-200 mt-1">{displayName}</p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Email Address
              </span>
              <p className="text-sm font-semibold text-zinc-200 mt-1">{displayEmail}</p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Member Since
              </span>
              <p className="text-sm font-semibold text-zinc-200 mt-1">{memberSince}</p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Account Status
              </span>
              <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
                <ShieldCheck className="w-4 h-4" /> Active
              </p>
            </div>
          </div>
        </div>

        {/* Streaming Preferences Card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl">
          <div className="border-b border-zinc-800 pb-4 mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
              App Settings
            </span>
            <h3 className="text-xl font-extrabold text-white mt-0.5">
              Playback & Preferences
            </h3>
          </div>

          <div className="space-y-6">
            {/* Autoplay Next Episode */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Autoplay Next Episode</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Automatically play the next episode when current finishes
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoplayNext}
                  onChange={(e) => {
                    setAutoplayNext(e.target.checked);
                    try {
                      localStorage.setItem('pref_autoplay_next', String(e.target.checked));
                    } catch {}
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </label>
            </div>

            {/* Video Quality Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-zinc-800/60">
              <div>
                <p className="text-sm font-semibold text-white">Default Video Quality</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Higher quality uses more network bandwidth
                </p>
              </div>
              <select
                value={videoQuality}
                onChange={(e) => {
                  setVideoQuality(e.target.value);
                  try {
                    localStorage.setItem('pref_video_quality', e.target.value);
                  } catch {}
                }}
                className="bg-zinc-950 text-xs font-semibold text-zinc-200 border border-zinc-700/80 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="auto">Auto (Recommended)</option>
                <option value="1080p">High (1080p Full HD)</option>
                <option value="4k">Ultra (4K HDR)</option>
                <option value="data-saver">Data Saver (720p)</option>
              </select>
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800/60">
              <div>
                <p className="text-sm font-semibold text-white">New Release Alerts</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Receive updates on new movies and TV show releases
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={releaseAlerts}
                  onChange={(e) => {
                    setReleaseAlerts(e.target.checked);
                    try {
                      localStorage.setItem('pref_release_alerts', String(e.target.checked));
                    } catch {}
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Quick Links / Content */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl">
          <h3 className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-4">
            My Content
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {contentLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  prefetch={false}
                  className="group flex items-center gap-3 rounded-xl p-4 bg-zinc-950/40 border border-zinc-800/80 hover:border-violet-500/50 hover:bg-violet-950/20 transition-all duration-200"
                >
                  <span className="flex-none text-zinc-400 group-hover:text-violet-400 transition-colors">
                    <IconComponent className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sign Out Action */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className={`w-full py-4 rounded-xl font-semibold text-sm border flex items-center justify-center gap-2 transition-all duration-200 ${
            signingOut ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          } bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400`}
        >
          <LogOut className="w-4 h-4" />
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </main>

      <Footer />
    </div>
  );
}
