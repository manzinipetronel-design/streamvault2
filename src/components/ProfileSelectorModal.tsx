"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { isPublicPath } from "@/lib/authRoutes";
import { usePathname } from "next/navigation";

export default function ProfileSelectorModal() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const {
    activeProfile,
    previousProfile,
    selectProfile,
    profiles,
    hasHydrated,
    profileError,
  } = useProfile();
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

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!pendingProfile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [pendingProfile]);

  if (
    authLoading ||
    !user ||
    isPublicPath(pathname) ||
    !hasHydrated ||
    activeProfile
  ) {
    return null;
  }

  const requestProfile = async (profile: (typeof profiles)[number]) => {
    if (!previousProfile?.isKids || profile.isKids) {
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

  const verifyPinAndSelectProfile = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 px-4 backdrop-blur-lg">
      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        <h1 className="mb-8 font-display text-3xl font-extrabold tracking-tight text-white md:text-5xl">
          Who&apos;s watching?
        </h1>

        {profileError && (
          <p role="alert" className="mb-5 text-sm text-rose-300">
            {profileError}
          </p>
        )}

        {profiles.length > 0 ? (
          <div className="mb-10 flex flex-wrap justify-center gap-6 md:gap-8">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => void requestProfile(profile)}
                className="group flex cursor-pointer flex-col items-center gap-3 focus:outline-none"
              >
                <img
                  src={profile.avatar}
                  alt=""
                  className="h-24 w-24 rounded-2xl border-2 border-transparent object-cover shadow-xl transition group-hover:border-violet-500 group-hover:shadow-violet-500/30 md:h-32 md:w-32"
                />
                <span className="text-sm font-medium text-white/70 transition group-hover:text-white md:text-base">
                  {profile.name}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mb-8 text-sm text-white/60">
            No profiles are available for this account.
          </p>
        )}

        <Link
          href="/account"
          className="rounded-xl border border-white/20 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/70 transition hover:border-white/50 hover:text-white md:text-sm"
        >
          Manage profiles
        </Link>
      </div>
      {pendingProfile &&
        portalReady &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-picker-parent-check"
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
            >
              <h2
                id="profile-picker-parent-check"
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
                    No parental PIN is set yet. Continue with the Kids profile,
                    then set a PIN in Account Settings before leaving Kids mode.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingProfile(null);
                      if (previousProfile) selectProfile(previousProfile);
                    }}
                    className="mt-5 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
                  >
                    Continue with Kids
                  </button>
                </>
              ) : pinState === "error" ? (
                <>
                  <p role="alert" className="mt-3 text-sm text-rose-400">
                    {pinError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPendingProfile(null)}
                    className="mt-4 rounded-xl px-4 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
                  >
                    Back to profiles
                  </button>
                </>
              ) : (
                <form
                  onSubmit={verifyPinAndSelectProfile}
                  className="mt-4 space-y-4"
                >
                  <label
                    className="block text-xs text-white/60"
                    htmlFor="profile-picker-parent-pin"
                  >
                    Enter your parental PIN to leave Kids mode
                  </label>
                  <input
                    id="profile-picker-parent-pin"
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
                      Back
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
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
