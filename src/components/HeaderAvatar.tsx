"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useProfile } from "@/contexts/ProfileContext";
import { createClient } from "@/lib/supabase/client";

export function HeaderAvatar() {
  const { activeProfile, selectProfile, profiles } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<
    (typeof profiles)[number] | null
  >(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinState, setPinState] = useState<
    "checking" | "ready" | "missing" | "error" | null
  >(null);
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!pendingProfile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [pendingProfile]);

  if (!activeProfile) return null;

  const requestProfileSwitch = async (profile: (typeof profiles)[number]) => {
    setIsOpen(false);
    if (!activeProfile.isKids || profile.isKids) {
      selectProfile(profile);
      return;
    }

    setPendingProfile(profile);
    setPin("");
    setPinError("");
    setPinState("checking");
    try {
      const { data, error } = await createClient().rpc("has_kids_pin");
      if (error) throw error;
      setPinState(data ? "ready" : "missing");
    } catch {
      setPinState("error");
      setPinError("Could not check the parental PIN. Please try again.");
    }
  };

  const verifyPinAndSwitch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingProfile || !/^\d{4,6}$/.test(pin)) {
      setPinError("Enter your 4 to 6 digit parental PIN.");
      return;
    }
    setVerifyingPin(true);
    setPinError("");
    try {
      const { data, error } = await createClient().rpc("verify_kids_pin", {
        p_pin: pin,
      });
      if (error) throw error;
      if (!data) {
        setPinError("That PIN is not correct.");
        return;
      }
      selectProfile(pendingProfile);
      setPendingProfile(null);
    } catch {
      setPinError("Could not verify the PIN. Please try again.");
    } finally {
      setVerifyingPin(false);
    }
  };

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

          {/* Keep the popover in viewport, not clipped by any parent overflow. */}
          <div className="fixed right-4 top-20 z-50 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-zinc-950/90 p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl animate-in fade-in slide-in-from-left-3 duration-150 md:right-6">
            <div className="mb-1.5 flex items-center gap-3 border-b border-white/10 px-3 py-2">
              <img
                src={activeProfile.avatar}
                alt={activeProfile.name}
                className="h-9 w-9 rounded-lg border border-violet-500 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
                  Current
                </p>
                <p className="truncate text-sm font-semibold text-white">
                  {activeProfile.name}
                </p>
              </div>
            </div>

            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
              Switch Profile
            </p>
            <div className="space-y-0.5">
              {profiles.map((p) => {
                const isActive = p.id === activeProfile.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => void requestProfileSwitch(p)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition cursor-pointer ${
                      isActive
                        ? "bg-violet-600/30 text-white font-semibold"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="h-6 w-6 rounded-md object-cover"
                      />
                      <span className="truncate text-xs">{p.name}</span>
                    </div>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 border-t border-white/10 pt-1">
              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
              >
                <span>Manage Profiles</span>
                <span className="text-[10px] opacity-60">→</span>
              </Link>
            </div>
          </div>
        </>
      )}

      {pendingProfile &&
        portalReady &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="kids-pin-title"
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
            >
              <h2
                id="kids-pin-title"
                className="font-display text-lg font-bold text-white"
              >
                Parent check
              </h2>
              {pinState === "checking" ? (
                <p className="mt-3 text-sm text-white/60">
                  Checking parental settings…
                </p>
              ) : pinState === "missing" ? (
                <>
                  <p className="mt-3 text-sm text-white/60">
                    Set a parental PIN in Account Settings before leaving Kids
                    mode.
                  </p>
                  <Link
                    href="/account"
                    onClick={() => setPendingProfile(null)}
                    className="mt-5 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
                  >
                    Open Account Settings
                  </Link>
                </>
              ) : (
                <form onSubmit={verifyPinAndSwitch} className="mt-4 space-y-4">
                  <label
                    className="block text-xs text-white/60"
                    htmlFor="kids-parent-pin"
                  >
                    Enter your parental PIN to switch profiles
                  </label>
                  <input
                    id="kids-parent-pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    pattern="[0-9]{4,6}"
                    maxLength={6}
                    value={pin}
                    onChange={(event) =>
                      setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-lg tracking-[0.5em] text-white outline-none focus:border-violet-500"
                  />
                  {pinError && (
                    <p role="alert" className="text-sm text-rose-400">
                      {pinError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingProfile(null)}
                      className="rounded-xl px-4 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={verifyingPin || pinState !== "ready"}
                      className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                    >
                      {verifyingPin ? "Checking…" : "Continue"}
                    </button>
                  </div>
                </form>
              )}
              {pinState === "error" && (
                <>
                  <p role="alert" className="mt-3 text-sm text-rose-400">
                    {pinError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPendingProfile(null)}
                    className="mt-4 rounded-xl px-4 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default HeaderAvatar;
