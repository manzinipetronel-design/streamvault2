"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { UserProfile } from "@/types/profile";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_PROFILE_AVATARS } from "@/lib/profileAvatars";
import { migrateLegacyWatchedToProfile } from "@/lib/services/userListsService";

interface ActiveViewer extends UserProfile {
  activity: "Watching" | "Browsing";
}

interface ProfileContextType {
  activeProfile: UserProfile | null;
  previousProfile: UserProfile | null;
  selectProfile: (profile: UserProfile) => void;
  clearProfile: () => void;
  profiles: UserProfile[];
  activeViewers: ActiveViewer[];
  presenceAvailable: boolean;
  hasHydrated: boolean;
  profileError: string | null;
  addProfile: (profile: Omit<UserProfile, "id">) => Promise<void>;
  updateProfile: (profile: UserProfile) => Promise<void>;
  removeProfile: (profileId: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

function setProfileCookie(profile: UserProfile | null) {
  if (typeof window === "undefined") return;

  if (!profile) {
    document.cookie =
      "streamvault_active_profile=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    return;
  }

  const encoded = encodeURIComponent(JSON.stringify(profile));
  document.cookie = `streamvault_active_profile=${encoded}; path=/; max-age=31536000; SameSite=Lax`;
}

function refreshAfterProfileChange() {
  if (typeof window !== "undefined") window.location.reload();
}

function toUserProfile(row: {
  id: string;
  display_name: string;
  avatar_url: string;
  is_kids: boolean;
}): UserProfile {
  return {
    id: row.id,
    name: row.display_name,
    avatar: row.avatar_url,
    isKids: row.is_kids,
  };
}

function getStoredActiveProfile(userId: string) {
  try {
    return (
      localStorage.getItem(`streamvault_active_profile:${userId}`) ??
      localStorage.getItem("streamvault_active_profile")
    );
  } catch {
    return null;
  }
}

function getSessionProfileId(userId: string) {
  try {
    return sessionStorage.getItem(`streamvault_session_profile:${userId}`);
  } catch {
    return null;
  }
}

function saveActiveProfile(userId: string, profile: UserProfile | null) {
  setProfileCookie(profile);
  try {
    if (profile) {
      const value = JSON.stringify(profile);
      localStorage.setItem(`streamvault_active_profile:${userId}`, value);
      localStorage.setItem("streamvault_active_profile", value);
    } else {
      localStorage.removeItem(`streamvault_active_profile:${userId}`);
      localStorage.removeItem("streamvault_active_profile");
    }
  } catch {
    // The profile remains active for this page even if local persistence is unavailable.
  }
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [previousProfile, setPreviousProfile] = useState<UserProfile | null>(
    null,
  );
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeViewers, setActiveViewers] = useState<ActiveViewer[]>([]);
  const [presenceAvailable, setPresenceAvailable] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const accountName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Account";
  const accountAvatar =
    user?.user_metadata?.avatar_url || DEFAULT_PROFILE_AVATARS[0];

  useEffect(() => {
    let cancelled = false;

    async function loadProfiles() {
      setHasHydrated(false);
      setProfileError(null);
      setActiveProfile(null);

      if (!user?.id) {
        setProfiles([]);
        setActiveViewers([]);
        setHasHydrated(true);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("viewer_profiles")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });
        if (error) throw error;

        let rows = data ?? [];
        if (rows.length === 0) {
          const defaults = [
            { name: accountName, avatar: accountAvatar, isKids: false },
            {
              name: "Guest",
              avatar: DEFAULT_PROFILE_AVATARS[1],
              isKids: false,
            },
            { name: "Kids", avatar: DEFAULT_PROFILE_AVATARS[2], isKids: true },
          ].map((profile) => ({
            id: crypto.randomUUID(),
            user_id: user.id,
            display_name: profile.name,
            avatar_url: profile.avatar,
            is_kids: profile.isKids,
          }));
          const { error: insertError } = await supabase
            .from("viewer_profiles")
            .insert(defaults);
          if (insertError) throw insertError;
          rows = defaults;
        }

        const loadedProfiles = rows.map(toUserProfile);
        if (cancelled) return;
        setProfiles(loadedProfiles);
        if (loadedProfiles[0]) {
          migrateLegacyWatchedToProfile(loadedProfiles[0].id);
        }

        const stored = getStoredActiveProfile(user.id);
        let selected: UserProfile | undefined;
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as UserProfile;
            selected = loadedProfiles.find(
              (profile) => profile.id === parsed.id,
            );
          } catch {
            selected = undefined;
          }
        }
        const lastProfile = selected ?? null;
        setPreviousProfile(lastProfile);
        if (lastProfile && getSessionProfileId(user.id) === lastProfile.id) {
          setActiveProfile(lastProfile);
          setProfileCookie(lastProfile);
        } else {
          setActiveProfile(null);
          setProfileCookie(null);
        }
      } catch (error) {
        if (!cancelled) {
          setProfileError(
            error instanceof Error ? error.message : "Could not load profiles.",
          );
          setProfiles([]);
        }
      } finally {
        if (!cancelled) setHasHydrated(true);
      }
    }

    void loadProfiles();
    return () => {
      cancelled = true;
    };
  }, [user?.id, accountName, accountAvatar]);

  const selectProfile = useCallback(
    (profile: UserProfile) => {
      if (!profiles.some((item) => item.id === profile.id)) return;
      setActiveProfile(profile);
      if (user?.id) {
        saveActiveProfile(user.id, profile);
        try {
          sessionStorage.setItem(
            `streamvault_session_profile:${user.id}`,
            profile.id,
          );
        } catch {
          // The chosen profile remains active for this page.
        }
      }
      refreshAfterProfileChange();
    },
    [profiles, user?.id],
  );

  const clearProfile = useCallback(() => {
    setActiveProfile(null);
    if (user?.id) saveActiveProfile(user.id, null);
    refreshAfterProfileChange();
  }, [user?.id]);

  const addProfile = useCallback(
    async (profile: Omit<UserProfile, "id">) => {
      if (!user?.id) throw new Error("Sign in to manage profiles.");
      const name = profile.name.trim();
      if (!name || name.length > 30)
        throw new Error("Profile names must be 1 to 30 characters.");
      if (
        profiles.some((item) => item.name.toLowerCase() === name.toLowerCase())
      ) {
        throw new Error("A profile with that name already exists.");
      }

      setProfileError(null);
      const newProfile: UserProfile = {
        ...profile,
        name,
        id: crypto.randomUUID(),
      };
      const { error } = await createClient().from("viewer_profiles").insert({
        id: newProfile.id,
        user_id: user.id,
        display_name: newProfile.name,
        avatar_url: newProfile.avatar,
        is_kids: newProfile.isKids,
      });
      if (error) {
        setProfileError(error.message);
        throw error;
      }
      setProfiles((current) => [...current, newProfile]);
    },
    [profiles, user?.id],
  );

  const updateProfile = useCallback(
    async (profile: UserProfile) => {
      if (!user?.id) throw new Error("Sign in to manage profiles.");
      const name = profile.name.trim();
      if (!name || name.length > 30)
        throw new Error("Profile names must be 1 to 30 characters.");
      if (
        profiles.some(
          (item) =>
            item.id !== profile.id &&
            item.name.toLowerCase() === name.toLowerCase(),
        )
      ) {
        throw new Error("A profile with that name already exists.");
      }

      setProfileError(null);
      const updated = { ...profile, name };
      const { error } = await createClient()
        .from("viewer_profiles")
        .update({
          display_name: updated.name,
          avatar_url: updated.avatar,
          is_kids: updated.isKids,
        })
        .eq("id", updated.id)
        .eq("user_id", user.id);
      if (error) {
        setProfileError(error.message);
        throw error;
      }
      setProfiles((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      if (activeProfile?.id === updated.id) saveActiveProfile(user.id, updated);
      setActiveProfile((current) =>
        current?.id === updated.id ? updated : current,
      );
    },
    [activeProfile?.id, profiles, user?.id],
  );

  const removeProfile = useCallback(
    async (profileId: string) => {
      if (!user?.id) throw new Error("Sign in to manage profiles.");
      if (profiles.length <= 1)
        throw new Error("Keep at least one profile on your account.");
      if (!profiles.some((profile) => profile.id === profileId)) {
        throw new Error("That profile no longer exists.");
      }

      setProfileError(null);
      const { error } = await createClient()
        .from("viewer_profiles")
        .delete()
        .eq("id", profileId)
        .eq("user_id", user.id);
      if (error) {
        setProfileError(error.message);
        throw error;
      }

      const remaining = profiles.filter((profile) => profile.id !== profileId);
      setProfiles(remaining);
      if (activeProfile?.id === profileId) {
        const nextProfile = remaining[0] ?? null;
        setActiveProfile(nextProfile);
        saveActiveProfile(user.id, nextProfile);
        refreshAfterProfileChange();
      }
    },
    [activeProfile?.id, profiles, user?.id],
  );

  useEffect(() => {
    if (!user?.id || !activeProfile) {
      setActiveViewers([]);
      setPresenceAvailable(false);
      return;
    }

    const supabase = createClient();
    if (typeof supabase.channel !== "function") {
      setActiveViewers([]);
      setPresenceAvailable(false);
      return;
    }

    const channel = supabase
      .channel(`watching:${user.id}`, {
        config: { private: true, presence: { key: activeProfile.id } },
      })
      .on("presence", { event: "sync" }, () => {
        const viewers = Object.values(
          channel.presenceState() as Record<string, ActiveViewer[]>,
        )
          .flat()
          .reduce<ActiveViewer[]>((unique, viewer) => {
            if (!unique.some((item) => item.id === viewer.id))
              unique.push(viewer);
            return unique;
          }, []);
        setActiveViewers(viewers);
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          try {
            const trackStatus = await channel.track({
              id: activeProfile.id,
              name: activeProfile.name,
              avatar: activeProfile.avatar,
              isKids: activeProfile.isKids,
              activity: pathname.startsWith("/media/")
                ? "Watching"
                : "Browsing",
            });
            const available = trackStatus === "ok";
            setPresenceAvailable(available);
            if (available) {
              setProfileError((current) =>
                current?.startsWith("Live viewer status") ||
                current?.startsWith("Live status")
                  ? null
                  : current,
              );
            } else {
              setProfileError(
                `Live viewer status unavailable: ${trackStatus}.`,
              );
            }
          } catch (error) {
            setPresenceAvailable(false);
            setProfileError(
              `Live viewer status unavailable: ${
                error instanceof Error ? error.message : "connection failed"
              }.`,
            );
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setPresenceAvailable(false);
          setProfileError("Live viewer status is temporarily unavailable.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, activeProfile, pathname]);

  const value = useMemo(
    () => ({
      activeProfile,
      previousProfile,
      selectProfile,
      clearProfile,
      profiles,
      activeViewers,
      presenceAvailable,
      hasHydrated,
      profileError,
      addProfile,
      updateProfile,
      removeProfile,
    }),
    [
      activeProfile,
      previousProfile,
      selectProfile,
      clearProfile,
      profiles,
      activeViewers,
      presenceAvailable,
      hasHydrated,
      profileError,
      addProfile,
      updateProfile,
      removeProfile,
    ],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context)
    throw new Error("useProfile must be used within ProfileProvider");
  return context;
}
