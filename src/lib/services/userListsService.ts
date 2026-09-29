'use client';
import { createClient } from '@/lib/supabase/client';

export interface MediaPayload {
  mediaId: string;
  mediaType: 'movie' | 'tv' | 'episode';
  title: string;
  posterUrl?: string;
  genre?: string;
  year?: string;
  rating?: string;
  season?: number;
  episode?: number;
}

export interface WatchedItem {
  id: string;
  media_id: string;
  media_type: 'movie' | 'tv';
  title: string;
  poster_url?: string;
  poster_path?: string;
  genre?: string;
  year?: string;
  rating?: string;
  season?: number;
  episode?: number;
  season_number?: number;
  episode_number?: number;
  progress?: number; // in seconds
  duration?: number; // in seconds
  updated_at?: string;
  created_at?: string;
}

const LOCAL_STORAGE_WATCHED_KEY = 'stream_recent_watched_local';

function getLocalWatched(): WatchedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw =
      localStorage.getItem('recent_watched') || localStorage.getItem(LOCAL_STORAGE_WATCHED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      id: String(item.id || item.media_id || Math.random()),
      media_id: String(item.media_id || item.id),
      media_type: item.media_type === 'tv' ? 'tv' : 'movie',
      title: item.title || 'Untitled',
      poster_url: item.poster_url || item.poster_path || '',
      poster_path: item.poster_path || item.poster_url || '',
      genre: item.genre || '',
      year: item.year || '',
      rating: item.rating || '',
      season: item.season ?? item.season_number,
      episode: item.episode ?? item.episode_number,
      season_number: item.season_number ?? item.season,
      episode_number: item.episode_number ?? item.episode,
      progress: typeof item.progress === 'number' ? item.progress : undefined,
      duration: typeof item.duration === 'number' ? item.duration : undefined,
      updated_at: item.updated_at || item.created_at,
      created_at: item.created_at,
    }));
  } catch {
    return [];
  }
}

function setLocalWatched(items: WatchedItem[]) {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(items.slice(0, 50));
    localStorage.setItem('recent_watched', serialized);
    localStorage.setItem(LOCAL_STORAGE_WATCHED_KEY, serialized);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('recent_watched_updated'));
  } catch {
    // silent
  }
}

function isSchemaError(error: any): boolean {
  if (!error) return false;
  if (error.code && typeof error.code === 'string') {
    const errorClass = error.code.substring(0, 2);
    if (errorClass === '42' || errorClass === '08') return true;
    if (errorClass === '23') return false;
  }
  if (error.message) {
    const schemaErrorPatterns = [
      /relation.*does not exist/i,
      /column.*does not exist/i,
      /function.*does not exist/i,
      /syntax error/i,
    ];
    return schemaErrorPatterns.some((p) => p.test(error.message));
  }
  return false;
}

export const userListsService = {
  // ---- FAVORITES ----
  async addFavorite(userId: string, media: MediaPayload) {
    const supabase = createClient();
    const { error } = await supabase.from('user_favorites').insert({
      user_id: userId,
      media_id: media.mediaId,
      media_type: media.mediaType === 'episode' ? 'tv' : media.mediaType,
      title: media.title,
      poster_url: media.posterUrl || '',
      genre: media.genre || '',
      year: media.year || '',
      rating: media.rating || '',
    });
    if (error && isSchemaError(error)) throw error;
    return !error;
  },

  async removeFavorite(userId: string, mediaId: string, mediaType: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('media_type', mediaType);
    if (error && isSchemaError(error)) throw error;
    return !error;
  },

  async isFavorite(userId: string, mediaId: string, mediaType: string): Promise<boolean> {
    const supabase = createClient();
    const { data } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
      .maybeSingle();
    return !!data;
  },

  // ---- WATCHLIST ----
  async addToWatchlist(userId: string, media: MediaPayload) {
    const supabase = createClient();
    const { error } = await supabase.from('user_watchlist').insert({
      user_id: userId,
      media_id: media.mediaId,
      media_type: media.mediaType === 'episode' ? 'tv' : media.mediaType,
      title: media.title,
      poster_url: media.posterUrl || '',
      genre: media.genre || '',
      year: media.year || '',
      rating: media.rating || '',
    });
    if (error && isSchemaError(error)) throw error;
    return !error;
  },

  async removeFromWatchlist(userId: string, mediaId: string, mediaType: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('media_type', mediaType);
    if (error && isSchemaError(error)) throw error;
    return !error;
  },

  async isInWatchlist(userId: string, mediaId: string, mediaType: string): Promise<boolean> {
    const supabase = createClient();
    const { data } = await supabase
      .from('user_watchlist')
      .select('id')
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
      .maybeSingle();
    return !!data;
  },

  // ---- RATINGS ----
  async rateMedia(userId: string, media: MediaPayload, userRating: number) {
    const supabase = createClient();
    const { error } = await supabase.from('user_ratings').upsert(
      {
        user_id: userId,
        media_id: media.mediaId,
        media_type: media.mediaType,
        title: media.title,
        poster_url: media.posterUrl || '',
        genre: media.genre || '',
        year: media.year || '',
        rating: media.rating || '',
        user_rating: userRating,
      },
      { onConflict: 'user_id,media_id,media_type' }
    );
    if (error && isSchemaError(error)) throw error;
    return !error;
  },

  async getUserRating(userId: string, mediaId: string, mediaType: string): Promise<number | null> {
    const supabase = createClient();
    const { data } = await supabase
      .from('user_ratings')
      .select('user_rating')
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
      .maybeSingle();
    return data?.user_rating ?? null;
  },

  // ---- RECENT WATCHED / CONTINUE WATCHING ----
  // Supports both logged-in users (syncs with Supabase table) and guest/unauthenticated users (localStorage).
  async recordWatched(media: MediaPayload, userId?: string | null): Promise<boolean> {
    const now = new Date().toISOString();
    const mediaTypeClean = media.mediaType === 'episode' ? 'tv' : media.mediaType;

    // 1. Always save to local storage so guests and offline users have immediate history
    const local = getLocalWatched();
    const existingIdx = local.findIndex(
      (item) => String(item.media_id) === String(media.mediaId) && item.media_type === mediaTypeClean
    );

    const updatedItem: WatchedItem = {
      id: existingIdx >= 0 ? local[existingIdx].id : `watched-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      media_id: String(media.mediaId),
      media_type: mediaTypeClean,
      title: media.title,
      poster_url: media.posterUrl || '',
      genre: media.genre || '',
      year: media.year || '',
      rating: media.rating || '',
      season: media.season,
      episode: media.episode,
      updated_at: now,
      created_at: existingIdx >= 0 ? local[existingIdx].created_at || now : now,
    };

    const nextLocal = [
      updatedItem,
      ...local.filter(
        (item) => !(String(item.media_id) === String(media.mediaId) && item.media_type === mediaTypeClean)
      ),
    ];
    setLocalWatched(nextLocal);

    // 2. If user is logged in, sync to Supabase table
    if (userId) {
      try {
        const supabase = createClient();
        const candidateTables = ['recent_watched', 'user_watched', 'recently_watched', 'watch_history'];
        let saved = false;

        for (const tbl of candidateTables) {
          try {
            const payload: any = {
              user_id: userId,
              media_id: String(media.mediaId),
              media_type: mediaTypeClean,
              title: media.title,
              poster_url: media.posterUrl || '',
              genre: media.genre || '',
              year: media.year || '',
              rating: media.rating || '',
              updated_at: now,
            };
            if (media.season !== undefined) payload.season = media.season;
            if (media.episode !== undefined) payload.episode = media.episode;

            const { error } = await supabase.from(tbl).upsert(payload, {
              onConflict: 'user_id,media_id,media_type',
            });

            if (!error) {
              saved = true;
              break;
            } else if (isSchemaError(error)) {
              // Try next table name
              continue;
            } else {
              // If conflict schema is different, try simple insert or delete-then-insert
              await supabase
                .from(tbl)
                .delete()
                .eq('user_id', userId)
                .eq('media_id', String(media.mediaId));
              const { error: insertErr } = await supabase.from(tbl).insert(payload);
              if (!insertErr) {
                saved = true;
                break;
              }
            }
          } catch {
            // Check next table candidate
          }
        }
        return saved;
      } catch {
        // Fallback already saved in localStorage
        return true;
      }
    }

    return true;
  },

  async getRecentWatched(userId?: string | null, limitCount: number = 15): Promise<WatchedItem[]> {
    const localItems = getLocalWatched();

    if (!userId) {
      return localItems.slice(0, limitCount);
    }

    // Try fetching from Supabase
    try {
      const supabase = createClient();
      const candidateTables = ['recent_watched', 'user_watched', 'recently_watched', 'watch_history'];

      for (const tbl of candidateTables) {
        try {
          const { data, error } = await supabase
            .from(tbl)
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(limitCount);

          if (!error && Array.isArray(data) && data.length > 0) {
            // Map table rows to WatchedItem
            const mapped: WatchedItem[] = data.map((row: any) => ({
              id: String(row.id || `${row.media_id}-${row.media_type}`),
              media_id: String(row.media_id),
              media_type: row.media_type === 'tv' ? 'tv' : 'movie',
              title: row.title || 'Untitled',
              poster_url: row.poster_url || row.poster_path || '',
              poster_path: row.poster_path || row.poster_url || '',
              genre: row.genre || '',
              year: row.year || '',
              rating: row.rating || '',
              season: row.season ?? row.season_number,
              episode: row.episode ?? row.episode_number,
              season_number: row.season_number ?? row.season,
              episode_number: row.episode_number ?? row.episode,
              progress: typeof row.progress === 'number' ? row.progress : undefined,
              duration: typeof row.duration === 'number' ? row.duration : undefined,
              updated_at: row.updated_at || row.created_at,
              created_at: row.created_at,
            }));

            // Merge with any local items that might have been watched recently
            const seen = new Set<string>();
            const combined: WatchedItem[] = [];
            for (const item of [...mapped, ...localItems]) {
              const key = `${item.media_type}-${item.media_id}`;
              if (!seen.has(key)) {
                seen.add(key);
                combined.push(item);
              }
            }
            return combined.slice(0, limitCount);
          }
        } catch {
          // continue to next table
        }
      }
    } catch {
      // silent fallback
    }

    return localItems.slice(0, limitCount);
  },

  async getWatchedDetail(mediaId: string, mediaType: string, userId?: string | null): Promise<WatchedItem | null> {
    const list = await this.getRecentWatched(userId, 50);
    return list.find((item) => String(item.media_id) === String(mediaId) && item.media_type === (mediaType === 'episode' ? 'tv' : mediaType)) || null;
  },

  async clearRecentWatched(userId?: string | null): Promise<boolean> {
    setLocalWatched([]);
    if (userId) {
      try {
        const supabase = createClient();
        const candidateTables = ['recent_watched', 'user_watched', 'recently_watched', 'watch_history'];
        for (const tbl of candidateTables) {
          try {
            await supabase.from(tbl).delete().eq('user_id', userId);
          } catch {
            // silent
          }
        }
      } catch {
        // silent
      }
    }
    return true;
  },

  async removeRecentWatched(mediaId: string, mediaType: string, userId?: string | null): Promise<boolean> {
    // 1. Remove from local storage
    const local = getLocalWatched();
    const filtered = local.filter(
      (item) => !(String(item.media_id) === String(mediaId) && item.media_type === mediaType)
    );
    setLocalWatched(filtered);

    // 2. Remove from Supabase if user is logged in
    if (userId) {
      try {
        const supabase = createClient();
        const candidateTables = ['recent_watched', 'user_watched', 'recently_watched', 'watch_history'];
        for (const tbl of candidateTables) {
          try {
            await supabase
              .from(tbl)
              .delete()
              .eq('user_id', userId)
              .eq('media_id', String(mediaId));
          } catch {
            // silent
          }
        }
      } catch {
        // silent
      }
    }

    return true;
  },

  updateWatchProgress,
};

// Add or update an item in the recent_watched history with playback progress
export async function updateWatchProgress({
  mediaId,
  mediaType,
  title,
  posterPath,
  progress,
  duration,
  seasonNumber,
  episodeNumber,
}: {
  mediaId: string | number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string;
  progress: number; // in seconds
  duration: number; // in seconds
  seasonNumber?: number;
  episodeNumber?: number;
}) {
  const resolvedPoster = posterPath || '';
  const now = new Date().toISOString();

  // 1. Save to Local Storage for guest/unauthenticated users
  let localHistory: any[] = [];
  try {
    const raw =
      typeof window !== 'undefined'
        ? localStorage.getItem('recent_watched') || localStorage.getItem('stream_recent_watched_local') || '[]'
        : '[]';
    localHistory = JSON.parse(raw);
    if (!Array.isArray(localHistory)) localHistory = [];
  } catch {
    localHistory = [];
  }

  const updatedItem: WatchedItem = {
    id: String(mediaId),
    media_id: String(mediaId),
    media_type: mediaType,
    title,
    poster_path: resolvedPoster,
    poster_url: resolvedPoster,
    progress,
    duration,
    season_number: seasonNumber,
    episode_number: episodeNumber,
    season: seasonNumber,
    episode: episodeNumber,
    updated_at: now,
    created_at: now,
  };

  const filteredHistory = localHistory.filter((item: any) => String(item.media_id) !== String(mediaId));
  const newHistory = [updatedItem, ...filteredHistory].slice(0, 50);

  if (typeof window !== 'undefined') {
    try {
      const serialized = JSON.stringify(newHistory);
      localStorage.setItem('recent_watched', serialized);
      localStorage.setItem('stream_recent_watched_local', serialized);
      window.dispatchEvent(new CustomEvent('recent_watched_updated', { detail: updatedItem }));
      window.dispatchEvent(new Event('storage'));
    } catch {
      /* silent */
    }
  }

  // 2. Save/Upsert to Supabase if logged in
  try {
    const supabase = createClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const payload: any = {
          user_id: user.id,
          media_id: String(mediaId),
          media_type: mediaType,
          title,
          poster_path: resolvedPoster,
          poster_url: resolvedPoster,
          progress,
          duration,
          updated_at: now,
        };
        if (seasonNumber !== undefined) {
          payload.season_number = seasonNumber;
          payload.season = seasonNumber;
        }
        if (episodeNumber !== undefined) {
          payload.episode_number = episodeNumber;
          payload.episode = episodeNumber;
        }

        const candidateTables = ['recent_watched', 'user_watched', 'recently_watched', 'watch_history'];
        for (const tbl of candidateTables) {
          try {
            const { error } = await supabase.from(tbl).upsert(payload, {
              onConflict: 'user_id, media_id',
            });
            if (!error) break;

            const { error: err2 } = await supabase.from(tbl).upsert(payload, {
              onConflict: 'user_id,media_id,media_type',
            });
            if (!err2) break;
          } catch {
            // Check next candidate table
          }
        }
      }
    }
  } catch {
    // localStorage already handled
  }

  return updatedItem;
}
