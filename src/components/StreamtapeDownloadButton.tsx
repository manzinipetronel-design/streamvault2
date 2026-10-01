'use client';

import { Download, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type StreamtapeDownloadButtonProps = {
  tmdbId: string;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
};

export default function StreamtapeDownloadButton({
  tmdbId,
  mediaType,
  season = 0,
  episode = 0,
}: StreamtapeDownloadButtonProps) {
  const [hasMapping, setHasMapping] = useState<boolean | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      tmdb_id: tmdbId,
      type: mediaType,
      season: String(mediaType === 'tv' ? season : 0),
      episode: String(mediaType === 'tv' ? episode : 0),
    });

    fetch(`/api/streamtape/mappings?${params}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setHasMapping(Boolean(data?.mapping?.streamtape_file_id));
      })
      .catch(() => {
        if (!cancelled) setHasMapping(false);
      });

    return () => {
      cancelled = true;
    };
  }, [episode, mediaType, season, tmdbId]);

  async function handleDownload() {
    if (!hasMapping || isDownloading) return;
    setIsDownloading(true);

    try {
      const params = new URLSearchParams({
        tmdb_id: tmdbId,
        type: mediaType,
        season: String(mediaType === 'tv' ? season : 0),
        episode: String(mediaType === 'tv' ? episode : 0),
      });
      const response = await fetch(`/api/streamtape/download?${params}`);
      const data = await response.json();
      if (!response.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Download unavailable.');
      }
      window.location.assign(data.url);
    } catch (error) {
      console.error('[Streamtape download]', error);
      window.alert(error instanceof Error ? error.message : 'Download unavailable.');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={hasMapping !== true || isDownloading}
      title={hasMapping === false ? 'No Streamtape file mapped' : 'Download'}
      aria-label={hasMapping === false ? 'Download unavailable' : 'Download'}
      className="p-3 rounded-xl border transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 bg-zinc-900/80 border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800"
    >
      {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
    </button>
  );
}
