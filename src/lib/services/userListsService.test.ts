import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  migrateLegacyWatchedToProfile,
  updateWatchProgress,
  userListsService,
} from "@/lib/services/userListsService";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  upsert: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "account-1" } },
      }),
    },
    from: mocks.from,
  }),
}));

describe("profile-scoped media lists", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.insert.mockReset().mockResolvedValue({ error: null });
    mocks.upsert.mockReset().mockResolvedValue({ error: null });
    mocks.from.mockReset().mockImplementation(() => ({
      insert: mocks.insert,
      upsert: mocks.upsert,
    }));
  });

  it("writes favorites with the selected profile ID", async () => {
    await userListsService.addFavorite(
      "account-1",
      {
        mediaId: "42",
        mediaType: "movie",
        title: "Example",
      },
      "profile-a",
    );

    expect(mocks.from).toHaveBeenCalledWith("user_favorites");
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "account-1",
        profile_id: "profile-a",
        media_id: "42",
      }),
    );
  });

  it("does not return account history without a selected profile", async () => {
    localStorage.setItem(
      "stream_recent_watched_local",
      JSON.stringify([{ media_id: "42", media_type: "movie", title: "Example" }]),
    );

    await expect(userListsService.getRecentWatched("account-1")).resolves.toEqual([]);
  });

  it("moves legacy browser history to the first profile only", async () => {
    const legacy = JSON.stringify([
      { media_id: "42", media_type: "movie", title: "Legacy title" },
    ]);
    localStorage.setItem("recent_watched", legacy);
    localStorage.setItem("stream_recent_watched_local", legacy);

    migrateLegacyWatchedToProfile("profile-primary");

    expect(localStorage.getItem("stream_recent_watched_local:profile-primary")).toBe(legacy);
    expect(localStorage.getItem("recent_watched")).toBeNull();
    expect(localStorage.getItem("stream_recent_watched_local")).toBeNull();
    await expect(
      userListsService.getRecentWatched(null, "profile-secondary"),
    ).resolves.toEqual([]);
  });

  it("saves resume progress per profile", async () => {
    for (const profileId of ["profile-a", "profile-b"]) {
      await updateWatchProgress({
        mediaId: "42",
        mediaType: "movie",
        title: "Example",
        posterPath: "/poster.jpg",
        progress: 120,
        duration: 600,
        profileId,
      });
    }

    expect(mocks.from).toHaveBeenCalledWith("recent_watched");
    expect(mocks.upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ user_id: "account-1", profile_id: "profile-a" }),
      { onConflict: "user_id,profile_id,media_id,media_type" },
    );
    expect(mocks.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ user_id: "account-1", profile_id: "profile-b" }),
      { onConflict: "user_id,profile_id,media_id,media_type" },
    );
    expect(
      JSON.parse(localStorage.getItem("stream_recent_watched_local:profile-a") || "[]"),
    ).toHaveLength(1);
    expect(
      JSON.parse(localStorage.getItem("stream_recent_watched_local:profile-b") || "[]"),
    ).toHaveLength(1);
  });
});
