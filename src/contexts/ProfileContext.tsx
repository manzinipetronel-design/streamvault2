'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { UserProfile } from '@/types/profile';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileContextType {
  activeProfile: UserProfile | null;
  selectProfile: (profile: UserProfile) => void;
  clearProfile: () => void;
  profiles: UserProfile[];
  hasHydrated: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth(); // Gets signed-in user (Xolani)
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  // Dynamic profiles list incorporating the active signed-in user account
  const accountName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Xolani';
  const accountAvatar =
    user?.user_metadata?.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

  const profiles: UserProfile[] = useMemo(
    () => [
      { id: '1', name: accountName, avatar: accountAvatar, isKids: false },
      { id: '2', name: 'Guest', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', isKids: false },
      { id: '3', name: 'Kids', avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150', isKids: true },
    ],
    [accountName, accountAvatar]
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem('streamvault_active_profile');
      if (saved) {
        try {
          setActiveProfile(JSON.parse(saved));
        } catch {
          setActiveProfile(profiles[0]);
        }
      } else {
        setActiveProfile(profiles[0]);
      }
    } finally {
      setHasHydrated(true);
    }
  }, [profiles]);

  const selectProfile = (profile: UserProfile) => {
    setActiveProfile(profile);
    try {
      localStorage.setItem('streamvault_active_profile', JSON.stringify(profile));
    } catch {}
  };

  const clearProfile = () => {
    setActiveProfile(null);
    try {
      localStorage.removeItem('streamvault_active_profile');
    } catch {}
  };

  return (
    <ProfileContext.Provider
      value={{ activeProfile, selectProfile, clearProfile, profiles, hasHydrated }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider');
  return context;
}

