'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PRESET_PROFILES, UserProfile } from '@/types/profile';
import { useProfile } from '@/contexts/ProfileContext';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
];

export default function ProfileSelectorModal() {
  const { activeProfile, selectProfile, profiles: contextProfiles, hasHydrated } = useProfile();
  const [profiles, setProfiles] = useState<UserProfile[]>(contextProfiles);
  const [isManaging, setIsManaging] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('streamvault_all_profiles');
      if (saved) {
        setProfiles(JSON.parse(saved));
        return;
      }
    } catch {}
    setProfiles(contextProfiles);
  }, [contextProfiles]);

  if (!hasHydrated || activeProfile) return null;

  const handleSaveProfile = (updated: UserProfile) => {
    const updatedList = profiles.map((p) => (p.id === updated.id ? updated : p));
    setProfiles(updatedList);
    try {
      localStorage.setItem('streamvault_all_profiles', JSON.stringify(updatedList));
    } catch {}
    setEditingProfile(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-lg px-4 animate-in fade-in duration-300">
      <div className="flex flex-col items-center max-w-2xl w-full text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-8 tracking-tight font-display">
          {isManaging ? 'Manage Profiles' : "Who's watching?"}
        </h1>

        {/* Profile List */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-10">
          {profiles.map((profile) => (
            <div key={profile.id} className="relative group flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isManaging) {
                    setEditingProfile(profile);
                  } else {
                    selectProfile(profile);
                  }
                }}
                className="relative flex flex-col items-center group focus:outline-none cursor-pointer"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-violet-500 shadow-xl group-hover:shadow-violet-500/30 transition duration-300 relative">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className={`w-full h-full object-cover transition ${
                      isManaging ? 'brightness-50 group-hover:brightness-75' : 'group-hover:brightness-110'
                    }`}
                  />
                  {isManaging && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <span className="bg-black/70 px-2.5 py-1.5 rounded-full border border-white/30 text-xs font-semibold backdrop-blur-sm">
                        ✏️ Edit
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-white/70 group-hover:text-white font-medium text-sm md:text-base mt-2 transition">
                  {profile.name}
                </span>
              </button>
            </div>
          ))}
        </div>

        {/* Manage Profiles Link to /account */}
        <Link
          href="/account"
          onClick={() => {
            // Optionally set a default fallback profile so the screen unblocks
            selectProfile(profiles[0]);
          }}
          className="px-6 py-2.5 border border-white/20 text-white/70 hover:text-white hover:border-white/50 rounded-xl text-xs md:text-sm font-semibold tracking-wider uppercase transition cursor-pointer"
        >
          Manage Profiles
        </Link>

        {/* Edit Modal Dialog */}
        {editingProfile && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full text-left space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-white">Edit Profile</h3>

              <div>
                <label className="text-xs text-white/50 block mb-1">Profile Name</label>
                <input
                  type="text"
                  value={editingProfile.name}
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-2">Choose Avatar</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {AVATAR_OPTIONS.map((img, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setEditingProfile({ ...editingProfile, avatar: img })}
                      className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 cursor-pointer transition ${
                        editingProfile.avatar === img ? 'border-violet-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Avatar option" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  className="px-4 py-2 text-xs text-white/60 hover:text-white rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveProfile(editingProfile)}
                  className="px-4 py-2 text-xs bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-500 cursor-pointer transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

