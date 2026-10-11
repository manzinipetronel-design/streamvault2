"use client";

import { FormEvent, useState } from "react";
import { Circle, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { UserProfile } from "@/types/profile";
import { useProfile } from "@/contexts/ProfileContext";
import { PROFILE_AVATARS } from "@/lib/profileAvatars";

export default function ProfileManager() {
  const {
    activeProfile,
    activeViewers,
    addProfile,
    hasHydrated,
    presenceAvailable,
    profileError,
    profiles,
    removeProfile,
    updateProfile,
  } = useProfile();
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>(PROFILE_AVATARS[0].url);
  const [isKids, setIsKids] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openNewProfile = () => {
    setEditing(null);
    setName("");
    setAvatar(PROFILE_AVATARS[0].url);
    setIsKids(false);
    setError(null);
    setShowForm(true);
  };

  const openEditProfile = (profile: UserProfile) => {
    setEditing(profile);
    setName(profile.name);
    setAvatar(profile.avatar);
    setIsKids(profile.isKids);
    setError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setError(null);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const profile = { name, avatar, isKids };
      if (editing) {
        await updateProfile({ ...editing, ...profile });
      } else {
        await addProfile(profile);
      }
      closeForm();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save this profile.",
      );
    } finally {
      setBusy(false);
    }
  };

  const deleteProfile = async (profile: UserProfile) => {
    if (!window.confirm(`Remove the ${profile.name} profile?`)) return;
    setBusy(true);
    setError(null);
    try {
      await removeProfile(profile.id);
      if (editing?.id === profile.id) closeForm();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not remove this profile.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl backdrop-blur-md md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
            Household
          </span>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-extrabold text-white">
            <Users className="h-5 w-5 text-violet-400" />
            Profiles
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Add separate profiles and see which ones are active right now.
          </p>
        </div>
        <button
          type="button"
          onClick={openNewProfile}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-500"
        >
          <Plus className="h-4 w-4" />
          Add profile
        </button>
      </div>

      {profileError && !showForm && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
        >
          {profileError}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
        >
          {error}
        </p>
      )}

      {!hasHydrated ? (
        <p className="text-sm text-zinc-400">Loading profiles…</p>
      ) : profiles.length === 0 ? (
        <p className="text-sm text-zinc-400">
          Profiles could not be loaded. Please try again.
        </p>
      ) : (
        <ul className="space-y-3">
          {profiles.map((profile) => {
            const isCurrent = profile.id === activeProfile?.id;
            const viewer = activeViewers.find((item) => item.id === profile.id);
            const isActive = Boolean(viewer || isCurrent);
            return (
              <li
                key={profile.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 sm:flex-nowrap"
              >
                <img
                  src={profile.avatar}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {profile.name}
                    {isCurrent && (
                      <span className="ml-2 text-xs font-normal text-violet-300">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                    <Circle
                      className={`h-2 w-2 fill-current ${
                        isActive ? "text-emerald-400" : "text-zinc-600"
                      }`}
                    />
                    {viewer?.activity ??
                      (isCurrent
                        ? "Active on this device"
                        : presenceAvailable
                          ? "Offline"
                          : "Status unavailable")}
                    {profile.isKids && (
                      <span className="ml-1 text-violet-300">· Kids</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditProfile(profile)}
                    aria-label={`Edit ${profile.name} profile`}
                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteProfile(profile)}
                    disabled={profiles.length <= 1 || busy}
                    aria-label={`Remove ${profile.name} profile`}
                    title={
                      profiles.length <= 1
                        ? "Keep at least one profile"
                        : "Remove profile"
                    }
                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {hasHydrated && !presenceAvailable && (
        <p className="mt-4 text-xs text-zinc-500">
          Live status from other devices is unavailable until Supabase Realtime
          is connected.
        </p>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={(event) => void saveProfile(event)}
            className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editing ? "Edit profile" : "Add a profile"}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Close profile editor"
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block text-xs font-medium text-zinc-400">
              Profile name
              <input
                autoFocus
                required
                maxLength={30}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                placeholder="Name"
              />
            </label>

            <fieldset>
              <legend className="mb-2 text-xs font-medium text-zinc-400">
                Choose an avatar
              </legend>
              <div className="grid grid-cols-5 gap-3 pb-1">
                {PROFILE_AVATARS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAvatar(option.url)}
                    aria-label={`Select ${option.name} avatar`}
                    aria-pressed={avatar === option.url}
                    className={`aspect-square w-full overflow-hidden rounded-full border-2 bg-zinc-800 p-0.5 transition-transform hover:scale-105 ${
                      avatar === option.url
                        ? "border-violet-500"
                        : "border-zinc-700 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={option.url}
                      alt={option.name}
                      className="h-full w-full rounded-full object-contain"
                    />
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={isKids}
                onChange={(event) => setIsKids(event.target.checked)}
                className="rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500"
              />
              Kids profile
            </label>

            {error && (
              <p role="alert" className="text-sm text-rose-300">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {busy ? "Saving…" : editing ? "Save changes" : "Create profile"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
