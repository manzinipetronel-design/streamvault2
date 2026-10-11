'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export interface HiddenKidsTitle {
  media_id: string;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
}

interface KidsControlsContextValue {
  hiddenTitles: HiddenKidsTitle[];
  loading: boolean;
  loadError: boolean;
  isHidden: (mediaId: number | string, mediaType: 'movie' | 'tv') => boolean;
  hideTitle: (title: HiddenKidsTitle) => Promise<void>;
  unhideTitle: (title: Pick<HiddenKidsTitle, 'media_id' | 'media_type'>) => Promise<void>;
  error: string | null;
}

const KidsControlsContext = createContext<KidsControlsContextValue | null>(null);

export function KidsControlsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [hiddenTitles, setHiddenTitles] = useState<HiddenKidsTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLoadError(false);
    if (!user?.id) {
      setHiddenTitles([]);
      setLoadedUserId(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const supabase = createClient();
    void supabase
      .from('kids_hidden_titles')
      .select('media_id, media_type, title, poster_path')
      .eq('user_id', user.id)
      .then(({ data, error: fetchError }: { data: HiddenKidsTitle[] | null; error: Error | null }) => {
        if (cancelled) return;
        if (fetchError) {
          setLoadError(true);
          setError('Could not load hidden kids titles.');
          setLoadedUserId(user.id);
          return;
        }
        setHiddenTitles(data ?? []);
        setLoadedUserId(user.id);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          setError('Could not load hidden kids titles.');
          setLoadedUserId(user.id);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const hideTitle = useCallback(
    async (title: HiddenKidsTitle) => {
      if (!user?.id) {
        setError('Sign in to manage hidden kids titles.');
        return;
      }
      setError(null);
      const supabase = createClient();
      try {
        const { error: saveError } = await supabase.from('kids_hidden_titles').upsert(
          {
            user_id: user.id,
            ...title,
          },
          { onConflict: 'user_id,media_id,media_type' }
        );
        if (saveError) throw saveError;
      } catch {
        setError('Could not hide this title. Please try again.');
        return;
      }
      setHiddenTitles((current) => [
        ...current.filter(
          (item) => !(item.media_id === title.media_id && item.media_type === title.media_type)
        ),
        title,
      ]);
    },
    [user?.id]
  );

  const unhideTitle = useCallback(
    async (title: Pick<HiddenKidsTitle, 'media_id' | 'media_type'>) => {
      if (!user?.id) {
        setError('Sign in to manage hidden kids titles.');
        return;
      }
      setError(null);
      const supabase = createClient();
      try {
        const { error: removeError } = await supabase
          .from('kids_hidden_titles')
          .delete()
          .eq('user_id', user.id)
          .eq('media_id', title.media_id)
          .eq('media_type', title.media_type);
        if (removeError) throw removeError;
      } catch {
        setError('Could not restore this title. Please try again.');
        return;
      }
      setHiddenTitles((current) =>
        current.filter(
          (item) => !(item.media_id === title.media_id && item.media_type === title.media_type)
        )
      );
    },
    [user?.id]
  );

  const hiddenKeys = useMemo(
    () => new Set(hiddenTitles.map((title) => `${title.media_type}:${title.media_id}`)),
    [hiddenTitles]
  );
  const isHidden = useCallback(
    (mediaId: number | string, mediaType: 'movie' | 'tv') =>
      hiddenKeys.has(`${mediaType}:${mediaId}`),
    [hiddenKeys]
  );

  const value = useMemo(
    () => ({
      hiddenTitles,
      loading: loading || loadedUserId !== (user?.id ?? null),
      loadError,
      isHidden,
      hideTitle,
      unhideTitle,
      error,
    }),
    [hiddenTitles, loading, loadedUserId, user?.id, loadError, isHidden, hideTitle, unhideTitle, error]
  );

  return <KidsControlsContext.Provider value={value}>{children}</KidsControlsContext.Provider>;
}

export function useKidsControls() {
  const context = useContext(KidsControlsContext);
  if (!context) throw new Error('useKidsControls must be used within KidsControlsProvider');
  return context;
}
