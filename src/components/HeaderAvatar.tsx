'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useProfile } from '@/contexts/ProfileContext';

export function HeaderAvatar() {
  const { activeProfile, selectProfile, profiles } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeProfile) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 outline-none focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-violet-500 cursor-pointer"
        aria-label="Profile Menu"
      >
        <div className="relative w-10 h-10">
          <img
            src={activeProfile.avatar}
            alt={activeProfile.name}
            className="w-full h-full rounded-xl object-cover border border-white/20 group-hover:border-violet-500 transition duration-200"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-zinc-950 rounded-full" />
        </div>

        {/* Hover Tooltip */}
        {!isOpen && (
          <span className="absolute left-16 px-3 py-1.5 rounded-xl bg-zinc-900/90 text-xs font-semibold text-white border border-white/10 shadow-xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50">
            {activeProfile.name}
          </span>
        )}
      </button>

      {/* Profile Flyout & Scrim */}
      {isOpen && (
        <>
          {/* Backdrop Scrim to isolate dropdown from Hero content */}
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setIsOpen(false)}
          />

          {/* Glass Popover Menu (Pushed right to left-20 to clear the sidebar dock) */}
          <div className="absolute left-20 top-0 w-64 bg-zinc-950/90 border border-white/10 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.8)] p-2.5 z-50 backdrop-blur-2xl animate-in fade-in slide-in-from-left-3 duration-150">
            <div className="px-3 py-2 border-b border-white/10 mb-1.5 flex items-center gap-3">
              <img
                src={activeProfile.avatar}
                alt={activeProfile.name}
                className="w-9 h-9 rounded-lg object-cover border border-violet-500"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Current</p>
                <p className="text-sm font-semibold text-white truncate">{activeProfile.name}</p>
              </div>
            </div>

            <p className="px-3 py-1.5 text-[10px] font-bold text-white/40 uppercase tracking-wider">Switch Profile</p>
            <div className="space-y-0.5">
              {profiles.map((p) => {
                const isActive = p.id === activeProfile.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      selectProfile(p);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-xl transition cursor-pointer ${
                      isActive ? 'bg-violet-600/30 text-white font-semibold' : 'hover:bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-md object-cover" />
                      <span className="text-xs truncate">{p.name}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400" />}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-white/10 mt-2.5 pt-1">
              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition font-medium flex items-center justify-between"
              >
                <span>Manage Profiles</span>
                <span className="text-[10px] opacity-60">→</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default HeaderAvatar;
