'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Play, Heart, Check, Plus } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';
import { ShimmerImage, ShimmerCard } from '@/components/Shimmer';
import StreamtapeDownloadButton from '@/components/StreamtapeDownloadButton';
import {
  getMovieDetails,
  getTVDetails,
  getSeasonEpisodes,
  getVideos,
  getCredits,
  getRelated,
  TMDBMovieDetail,
  TMDBTVDetail,
  TMDBEpisode,
  TMDBVideo,
  TMDBCastMember,
  TMDBCatalogItem,
} from '@/lib/services/tmdbService';
import { useAuth } from '@/contexts/AuthContext';
import { userListsService, updateWatchProgress } from '@/lib/services/userListsService';

type MediaDetail =
  (TMDBMovieDetail & { mediaType: 'movie' }) | (TMDBTVDetail & { mediaType: 'tv'; title: string });

// ── Embed source definitions ──────────────────────────────────────────────────
interface EmbedSource {
  name: string;
  color: string;
  // Per-source iframe attributes — default to the values every source has
  // always used; only VidCore.io overrides these, matching a confirmed
  // working reference implementation that sends neither attribute at all.
  allow?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  // Override the popup-blocking sandbox for a source that refuses to play
  // when sandboxed. `false` = never sandbox this source.
  sandbox?: string | false;
  getUrl: (tmdbId: string, type: 'movie' | 'tv', season?: number, episode?: number) => string;
}

const DEFAULT_ALLOW = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
const DEFAULT_REFERRER_POLICY: React.HTMLAttributeReferrerPolicy = 'origin';

const EMBED_SOURCES: EmbedSource[] = [
  {
    name: 'MoviesAPI',
    color: '#FF9500',
    referrerPolicy: DEFAULT_REFERRER_POLICY,
    getUrl: (id, type, s, e) =>
      type === 'movie'
        ? `https://moviesapi.to/movie/${id}`
        : `https://moviesapi.to/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    name: 'VidCore',
    color: '#A78BFA',
    referrerPolicy: DEFAULT_REFERRER_POLICY,
    getUrl: (id, type, s, e) => {
      const params = new URLSearchParams({
        theme: '7B2FFF',
        autoplay: 'true',
      });
      return type === 'movie'
        ? `https://vidcore.org/embed/movie/${id}?${params.toString()}`
        : `https://vidcore.org/embed/tv/${id}/${s ?? 1}/${e ?? 1}?${params.toString()}`;
    },
  },
  {
    // Confirmed against vidcore.io's own docs — a different service from
    // vidcore.org despite the similar name, hence the different URL shape
    // (no /embed/ segment, params tuned to match the app's own chrome
    // instead of their defaults: theme= matches --violet, and TV gets a
    // native "Next Episode" button since VidCore.io actually supports one).
    //
    // allow/referrerPolicy deliberately omitted (undefined) — a working
    // reference embed of this same service used neither attribute at all,
    // just `allowfullscreen`, so this source skips both instead of
    // inheriting the other sources' defaults.
    //
    // Domain switched from vidcore.io to vidcore.net — the reference embed
    // pointed at .net (its DevTools baseURI still resolved to vidcore.io
    // under the hood, confirming it's the same service), so this tries the
    // domain that was actually observed working rather than the one from
    // their docs page.
    name: 'VidCore.io',
    color: '#22C55E',
    // allow/referrerPolicy intentionally not set — see note above.
    getUrl: (id, type, s, e) => {
      const params = new URLSearchParams({
        theme: '7B2FFF', // matches --violet, no # prefix per their docs
        autoPlay: 'true',
      });
      if (type === 'movie') {
        return `https://vidcore.net/movie/${id}?${params.toString()}`;
      }
      params.set('nextButton', 'true'); // shows their native next-episode button; autoNext left off so it doesn't fight the app's own "Up Next" card
      return `https://vidcore.net/tv/${id}/${s ?? 1}/${e ?? 1}?${params.toString()}`;
    },
  },
];

// Popup / redirect blocking.
// The embeds are cross-origin iframes, so page-level hooks (window.open,
// click handlers) never see what happens inside them. The only reliable
// control is the iframe `sandbox` attribute: the player still loads and
// plays, but it is NOT granted allow-popups / allow-top-navigation, so it
// can't open new tabs or redirect this page.
const POPUP_BLOCK_SANDBOX =
  'allow-scripts allow-same-origin allow-forms allow-presentation';
// Used for proxied embeds served from our own origin — must NOT include
// allow-same-origin, or third-party code could read our session storage.
const CLEAN_MODE_SANDBOX = 'allow-scripts allow-forms allow-presentation';

// Same glass scroll-arrow pair used by the homepage's MovieRow — fades in on
// row hover, sits over the row's edges rather than pushing layout.
function RowScrollButtons({
  onLeft,
  onRight,
}: {
  onLeft: () => void;
  onRight: () => void;
}) {
  return (
    <>
      <button
        onClick={onLeft}
        aria-label="Scroll left"
        className="absolute top-1/2 -translate-y-1/2 -left-2 w-9 h-9 rounded-full bg-void-2/70 backdrop-blur-md border border-glass-border flex items-center justify-center text-foreground opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 hover:border-violet z-10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[15px] h-[15px]">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={onRight}
        aria-label="Scroll right"
        className="absolute top-1/2 -translate-y-1/2 -right-2 w-9 h-9 rounded-full bg-void-2/70 backdrop-blur-md border border-glass-border flex items-center justify-center text-foreground opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 hover:border-violet z-10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[15px] h-[15px]">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </>
  );
}

export default function MediaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const rawType = params?.type;
  const rawId = params?.id;
  const mediaType = ((Array.isArray(rawType) ? rawType[0] : rawType) as 'movie' | 'tv') || 'movie';
  const mediaId = (Array.isArray(rawId) ? rawId[0] : rawId) || '';

  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);
  const isFavorite = isFav;
  const isInWatchlist = isWatchlist;
  const [favLoading, setFavLoading] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

  const [lastWatched, setLastWatched] = useState<{
    season?: number;
    episode?: number;
    progress?: number;
    duration?: number;
  } | null>(null);

  // Player state
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showSourceHint, setShowSourceHint] = useState(false);
  const [blockPopups, setBlockPopups] = useState(true);
  // Clean mode (experimental): loads the embed through /api/embed. Many
  // players refuse to run this way, so it is OFF by default.
  const [cleanMode, setCleanMode] = useState(false);
  // Redirect recovery: the player iframe should load exactly once. A second
  // load event means the embed navigated itself somewhere else (ad redirect),
  // so we remount it with the original URL. Works in every browser.
  const [recoverKey, setRecoverKey] = useState(0);
  const [redirectBlockedNotice, setRedirectBlockedNotice] = useState(false);
  const loadCountRef = useRef(0);
  const recoveriesRef = useRef(0);
  const firstLoadAtRef = useRef(0);

  // Episode browsing rail (separate from the player's own season/episode
  // selects — this is what's visible on the page before you've hit play)
  const [browseSeason, setBrowseSeason] = useState(1);
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  // Trailers
  const [trailers, setTrailers] = useState<TMDBVideo[]>([]);
  const [trailersLoading, setTrailersLoading] = useState(false);
  const [activeTrailer, setActiveTrailer] = useState<TMDBVideo | null>(null);

  // "Up Next" card — manual, no autoplay timer (see explanation in chat: the
  // player is a cross-origin iframe, so there's no reliable way to know when
  // an episode actually ends; a fake timer based on runtime would be wrong
  // whenever someone pauses or skips).
  const [nextEp, setNextEp] = useState<{ ep: TMDBEpisode; season: number } | null>(null);
  const [nextEpDismissed, setNextEpDismissed] = useState(false);

  // Cast & Crew, Related
  const [fullCredits, setFullCredits] = useState<TMDBCastMember[]>([]);
  const [related, setRelated] = useState<TMDBCatalogItem[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  // Snap-scroll rails (Episodes, Trailers, Related, Cast & Crew) — same
  // arrow-button + scrollBy pattern as the homepage's MovieRow, so these
  // rows behave consistently with the rest of the app instead of just
  // free-scrolling and clipping mid-card.
  const episodesRowRef = useRef<HTMLDivElement>(null);
  const trailersRowRef = useRef<HTMLDivElement>(null);
  const relatedRowRef = useRef<HTMLDivElement>(null);
  const castRowRef = useRef<HTMLDivElement>(null);
  const scrollRow = (ref: React.RefObject<HTMLDivElement | null>, direction: number) => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth * 0.8;
      ref.current.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    recoveriesRef.current = 0;
  }, [activeSourceIndex, selectedSeason, selectedEpisode, cleanMode, blockPopups]);

  useEffect(() => {
    loadCountRef.current = 0;
  }, [iframeKey, recoverKey, activeSourceIndex, selectedSeason, selectedEpisode, cleanMode, blockPopups]);

  const handleFrameLoad = () => {
    loadCountRef.current += 1;
    setIframeLoaded(true);
    if (loadCountRef.current === 1) {
      firstLoadAtRef.current = Date.now();
      return;
    }
    // Ignore extra loads in the first few seconds: embeds legitimately
    // redirect/reload while starting up. Ad redirects happen later, after
    // the viewer clicks the player.
    if (Date.now() - firstLoadAtRef.current < 5000) return;
    if (recoveriesRef.current < 2) {
      recoveriesRef.current += 1;
      setRedirectBlockedNotice(true);
      setTimeout(() => setRedirectBlockedNotice(false), 3500);
      setRecoverKey((k) => k + 1);
    }
  };

  // ── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      try {
        if (mediaType === 'movie') {
          const data = await getMovieDetails(Number(mediaId));
          if (data) setDetail({ ...data, mediaType: 'movie' });
        } else {
          const data = await getTVDetails(Number(mediaId));
          if (data) setDetail({ ...data, mediaType: 'tv', title: data.name });
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    if (mediaId && mediaType) fetchDetail();
    setBrowseSeason(1); // reset when navigating to a different title
  }, [mediaId, mediaType]);

  // Fetch real episode data for the season currently being browsed
  useEffect(() => {
    async function fetchEpisodes() {
      if (mediaType !== 'tv' || !mediaId) return;
      setEpisodesLoading(true);
      try {
        const eps = await getSeasonEpisodes(Number(mediaId), browseSeason);
        setEpisodes(eps);
      } catch {
        setEpisodes([]);
      } finally {
        setEpisodesLoading(false);
      }
    }
    fetchEpisodes();
  }, [mediaId, mediaType, browseSeason]);

  // Fetch real trailer data for this title
  useEffect(() => {
    async function fetchTrailers() {
      if (!mediaId || !mediaType) return;
      setTrailersLoading(true);
      try {
        const vids = await getVideos(Number(mediaId), mediaType);
        setTrailers(vids);
      } catch {
        setTrailers([]);
      } finally {
        setTrailersLoading(false);
      }
    }
    fetchTrailers();
  }, [mediaId, mediaType]);

  // Fetch real cast/crew photos and related titles for this title
  useEffect(() => {
    async function fetchCreditsAndRelated() {
      if (!mediaId || !mediaType) return;
      try {
        const [credits, rel] = await Promise.all([
          getCredits(Number(mediaId), mediaType),
          getRelated(Number(mediaId), mediaType),
        ]);
        setFullCredits(credits);
        setRelated(rel);
      } catch {
        setFullCredits([]);
        setRelated([]);
      }
    }
    fetchCreditsAndRelated();
  }, [mediaId, mediaType]);

  // Proactive "not loading?" hint. We can't detect this specific failure mode
  // (some titles show an in-frame error page from the source itself rather
  // than failing to load at the browser level, so iframe onError never
  // fires) — so instead of pretending we can auto-detect it, this just
  // surfaces the source-switch option a few seconds after the iframe loads,
  // in case what's on screen isn't actually playing. Auto-hides again if not
  // dismissed, so it isn't a permanent nag on the common case where playback
  // is fine.
  useEffect(() => {
    setShowSourceHint(false);
    if (!iframeLoaded || loadError) return;
    const showTimer = setTimeout(() => setShowSourceHint(true), 4000);
    const hideTimer = setTimeout(() => setShowSourceHint(false), 14000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [iframeLoaded, loadError, activeSourceIndex, selectedSeason, selectedEpisode]);

  // Fetch the actual next episode for the "Up Next" card. Tries the current
  // season first; if the playing episode is the season finale, tries season+1
  // episode 1 — an empty result from that call (handled inside
  // getSeasonEpisodes) just means there isn't a next season, no need to know
  // totalSeasons up front for this.
  useEffect(() => {
    async function fetchNextEpisode() {
      if (mediaType !== 'tv' || !showPlayer || !mediaId) {
        setNextEp(null);
        return;
      }
      try {
        const currentSeasonEps = await getSeasonEpisodes(Number(mediaId), selectedSeason);
        const sameSeasonNext = currentSeasonEps.find((e) => e.episodeNumber === selectedEpisode + 1);
        if (sameSeasonNext) {
          setNextEp({ ep: sameSeasonNext, season: selectedSeason });
          setNextEpDismissed(false);
          return;
        }
        const nextSeasonEps = await getSeasonEpisodes(Number(mediaId), selectedSeason + 1);
        if (nextSeasonEps.length > 0) {
          setNextEp({ ep: nextSeasonEps[0], season: selectedSeason + 1 });
          setNextEpDismissed(false);
        } else {
          setNextEp(null);
        }
      } catch {
        setNextEp(null);
      }
    }
    fetchNextEpisode();
  }, [mediaId, mediaType, showPlayer, selectedSeason, selectedEpisode]);

  useEffect(() => {
    async function checkStatus() {
      if (!user || !detail) return;
      try {
        const [fav, watch] = await Promise.all([
          userListsService.isFavorite(user.id, mediaId, mediaType),
          userListsService.isInWatchlist(user.id, mediaId, mediaType),
        ]);
        setIsFav(fav);
        setIsWatchlist(watch);
      } catch {
        /* silent */
      }
    }
    checkStatus();
  }, [user, detail, mediaId, mediaType]);

  // Check if this title was recently watched to allow seamless resume
  useEffect(() => {
    async function loadWatchHistory() {
      if (!mediaId || !mediaType) return;
      try {
        const watched = await userListsService.getWatchedDetail(mediaId, mediaType, user?.id);
        if (watched) {
          const s = watched.season ?? watched.season_number;
          const e = watched.episode ?? watched.episode_number;
          setLastWatched({
            season: s,
            episode: e,
            progress: watched.progress,
            duration: watched.duration,
          });
          if (mediaType === 'tv' && s) {
            setSelectedSeason(s);
            setBrowseSeason(s);
            if (e) {
              setSelectedEpisode(e);
            }
          }
        }
      } catch {
        /* silent */
      }
    }
    loadWatchHistory();
  }, [mediaId, mediaType, user?.id]);

  // Periodic playback progress tracking while player is open
  const playbackProgressRef = useRef(0);
  useEffect(() => {
    if (!showPlayer || !detail) return;

    const durationSec =
      detail.mediaType === 'movie'
        ? ((detail as TMDBMovieDetail).runtime || 110) * 60
        : 45 * 60;

    if (lastWatched?.progress && playbackProgressRef.current === 0) {
      playbackProgressRef.current = lastWatched.progress;
    } else if (playbackProgressRef.current === 0) {
      playbackProgressRef.current = 15;
    }

    const interval = setInterval(() => {
      playbackProgressRef.current += 15;
      updateWatchProgress({
        mediaId: detail.id,
        mediaType: detail.mediaType,
        title: detail.title,
        posterPath: detail.img || '',
        progress: playbackProgressRef.current,
        duration: durationSec,
        seasonNumber: detail.mediaType === 'tv' ? selectedSeason : undefined,
        episodeNumber: detail.mediaType === 'tv' ? selectedEpisode : undefined,
      });
    }, 15000);

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && typeof data === 'object') {
          const currentTime = data.currentTime ?? data.progress ?? data.time;
          const totalDuration = data.duration ?? durationSec;
          if (typeof currentTime === 'number' && currentTime > 0) {
            playbackProgressRef.current = Math.round(currentTime);
            updateWatchProgress({
              mediaId: detail.id,
              mediaType: detail.mediaType,
              title: detail.title,
              posterPath: detail.img || '',
              progress: Math.round(currentTime),
              duration: Math.round(totalDuration),
              seasonNumber: detail.mediaType === 'tv' ? selectedSeason : undefined,
              episodeNumber: detail.mediaType === 'tv' ? selectedEpisode : undefined,
            });
          }
        }
      } catch {
        /* silent */
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('message', handleMessage);
    };
  }, [showPlayer, detail, selectedSeason, selectedEpisode, lastWatched]);

  const getEmbedUrl = useCallback(() => {
    const source = EMBED_SOURCES[activeSourceIndex];
    const url = source.getUrl(mediaId, mediaType, selectedSeason, selectedEpisode);
    return cleanMode ? `/api/embed?url=${encodeURIComponent(url)}` : url;
  }, [mediaId, mediaType, selectedSeason, selectedEpisode, activeSourceIndex, cleanMode]);

  const handleWatchNow = (seasonOverride?: number, episodeOverride?: number) => {
    setShowPlayer(true);
    setActiveSourceIndex(0);
    setLoadError(false);
    setIframeLoaded(false);
    setIframeKey((k) => k + 1);
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);

    // Record to recent watched (persists to Supabase if logged in, and localStorage for guests/all users)
    if (detail) {
      const s = seasonOverride ?? selectedSeason;
      const e = episodeOverride ?? selectedEpisode;
      const genre =
        detail.mediaType === 'movie'
          ? (detail as TMDBMovieDetail).genres?.[0] || ''
          : (detail as TMDBTVDetail).genres?.[0] || '';
      const year =
        detail.mediaType === 'movie'
          ? (detail as TMDBMovieDetail).releaseDate?.slice(0, 4) || ''
          : (detail as TMDBTVDetail).firstAirDate?.slice(0, 4) || '';

      userListsService.recordWatched(
        {
          mediaId: String(detail.id),
          mediaType: detail.mediaType,
          title: detail.title,
          posterUrl: detail.img,
          genre,
          year,
          rating: detail.rating,
          season: detail.mediaType === 'tv' ? s : undefined,
          episode: detail.mediaType === 'tv' ? e : undefined,
        },
        user?.id
      );

      const durationSec =
        detail.mediaType === 'movie'
          ? ((detail as TMDBMovieDetail).runtime || 110) * 60
          : 45 * 60;

      updateWatchProgress({
        mediaId: detail.id,
        mediaType: detail.mediaType,
        title: detail.title,
        posterPath: detail.img || '',
        progress: lastWatched?.progress || 15,
        duration: durationSec,
        seasonNumber: detail.mediaType === 'tv' ? s : undefined,
        episodeNumber: detail.mediaType === 'tv' ? e : undefined,
      });
    }
  };

  const playEpisode = (seasonNum: number, episodeNum: number) => {
    setSelectedSeason(seasonNum);
    setSelectedEpisode(episodeNum);
    handleWatchNow(seasonNum, episodeNum);
  };

  const handleSourceChange = (index: number) => {
    setActiveSourceIndex(index);
    setLoadError(false);
    setIframeLoaded(false);
    setIframeKey((k) => k + 1);
  };

  // Auto-advance to next source on load error
  const handleIframeError = useCallback(() => {
    setLoadError(true);
  }, []);

  const handleNextSource = () => {
    const next = (activeSourceIndex + 1) % EMBED_SOURCES.length;
    handleSourceChange(next);
  };

  const handleFavorite = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!detail) return;
    setFavLoading(true);
    try {
      const genre =
        detail.mediaType === 'movie'
          ? (detail as TMDBMovieDetail).genres?.[0] || ''
          : (detail as TMDBTVDetail).genres?.[0] || '';
      const year =
        detail.mediaType === 'movie'
          ? (detail as TMDBMovieDetail).releaseDate?.slice(0, 4) || ''
          : (detail as TMDBTVDetail).firstAirDate?.slice(0, 4) || '';
      if (isFav) {
        await userListsService.removeFavorite(user.id, mediaId, mediaType);
        setIsFav(false);
      } else {
        await userListsService.addFavorite(user.id, {
          mediaId,
          mediaType,
          title: detail.title,
          posterUrl: detail.img,
          genre,
          year,
          rating: detail.rating,
        });
        setIsFav(true);
      }
    } catch {
      /* silent */
    } finally {
      setFavLoading(false);
    }
  };

  const handleWatchlist = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!detail) return;
    setWatchLoading(true);
    try {
      const genre =
        detail.mediaType === 'movie'
          ? (detail as TMDBMovieDetail).genres?.[0] || ''
          : (detail as TMDBTVDetail).genres?.[0] || '';
      const year =
        detail.mediaType === 'movie'
          ? (detail as TMDBMovieDetail).releaseDate?.slice(0, 4) || ''
          : (detail as TMDBTVDetail).firstAirDate?.slice(0, 4) || '';
      if (isWatchlist) {
        await userListsService.removeFromWatchlist(user.id, mediaId, mediaType);
        setIsWatchlist(false);
      } else {
        await userListsService.addToWatchlist(user.id, {
          mediaId,
          mediaType,
          title: detail.title,
          posterUrl: detail.img,
          genre,
          year,
          rating: detail.rating,
        });
        setIsWatchlist(true);
      }
    } catch {
      /* silent */
    } finally {
      setWatchLoading(false);
    }
  };

  const tvDetail = mediaType !== 'movie' ? (detail as TMDBTVDetail) : null;
  const totalSeasons = tvDetail?.numberOfSeasons || 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent border-violet animate-spin" />
          <p className="text-xs text-muted font-medium tracking-wider uppercase">
            Loading title...
          </p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void text-foreground">
        <div className="text-center p-8">
          <p className="font-display text-2xl font-bold mb-4">Media Not Found</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-violet/20 border border-violet/40 text-foreground hover:bg-violet/30 transition-all cursor-pointer"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const isMovie = detail.mediaType === 'movie';
  const movieDetail = isMovie ? (detail as TMDBMovieDetail) : null;
  const releaseYear = isMovie
    ? movieDetail?.releaseDate?.slice(0, 4)
    : (detail as TMDBTVDetail)?.firstAirDate?.slice(0, 4);
  const extraInfo = isMovie
    ? movieDetail?.runtime
      ? `${Math.floor(movieDetail.runtime / 60)}h ${movieDetail.runtime % 60}m`
      : null
    : totalSeasons
      ? `${totalSeasons} season${totalSeasons > 1 ? 's' : ''}`
      : null;

  const castList = detail.cast || ['Theo James', 'Kaya Scodelario', 'Joely Richardson'];
  const creatorOrDirector = isMovie ? movieDetail?.director : tvDetail?.creator || 'Guy Ritchie';
  const cert = detail.certification || (isMovie ? 'PG-13' : 'MA');
  const genresString = detail.genres?.slice(0, 3).join(', ');
  const cleanRating = detail.rating && detail.rating !== 'N/A' ? detail.rating : '7.8';

  const fullOverview =
    detail.overview ||
    'When high stakes and hidden motives collide, an unexpected chain of events unfolds, threatening everything in its wake.';
  const canTruncate = fullOverview.length > 170;
  const displayedOverview =
    canTruncate && !isOverviewExpanded ? `${fullOverview.slice(0, 160)}...` : fullOverview;

  const backdropImageSrc =
    detail.backdropImg && !detail.backdropImg.includes('no_image')
      ? detail.backdropImg
      : detail.img;

  return (
    <div className="page-enter relative min-h-screen bg-void text-foreground overflow-x-hidden font-sans selection:bg-violet selection:text-white">
      {/* ── Immersive Multi-stop Gradient Backdrop ── */}
      <div
        className="absolute top-0 left-0 right-0 h-[85vh] z-0 bg-cover bg-[center_28%] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(13,13,13,0.05) 0%, rgba(13,13,13,0.5) 50%, #0D0D0D 100%), linear-gradient(90deg, rgba(13,13,13,0.9) 0%, rgba(13,13,13,0.25) 40%, transparent 65%), url('${backdropImageSrc}')`,
        }}
      />

      {/* ── Top Floating Back Button ── */}
      <button
        onClick={() => router.back()}
        aria-label="Back"
        className="absolute top-7 left-7 z-20 inline-flex items-center gap-2 px-4 py-2.5 bg-[#111111]/50 hover:bg-[#111111]/80 backdrop-blur-[10px] border border-glass-border hover:border-violet rounded-[10px] text-[13.5px] font-semibold text-foreground transition-all duration-200 cursor-pointer"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="w-[15px] h-[15px]"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </button>

      {/* ── Credits Block — Top Right, Apple-style Placement ── */}
      <div className="hidden md:block absolute top-8 right-10 z-15 text-right max-w-[280px] text-[12.5px] leading-[1.75] text-muted pointer-events-auto">
        {castList.length > 0 && (
          <div>
            {castList.slice(0, 3).map((actor, idx, arr) => (
              <span key={actor}>
                <Link
                  href={`/search?q=${encodeURIComponent(actor)}`}
                  className="text-foreground font-medium hover:text-violet-light transition-colors"
                >
                  {actor}
                </Link>
                {idx < arr.length - 1 && ', '}
              </span>
            ))}{' '}
            <b className="text-muted-strong font-semibold ml-1.5 italic">Starring</b>
          </div>
        )}
        {creatorOrDirector && (
          <div className="mt-0.5">
            <Link
              href={`/search?q=${encodeURIComponent(creatorOrDirector)}`}
              className="text-foreground font-medium hover:text-violet-light transition-colors"
            >
              {creatorOrDirector}
            </Link>{' '}
            <b className="text-muted-strong font-semibold ml-1.5 italic">
              {isMovie ? 'Director' : 'Creator'}
            </b>
          </div>
        )}
      </div>

      {/* ── Main Hero Content Layout ── */}
      <div className="relative z-10 max-w-[1140px] mx-auto px-6 md:px-10 pb-20">
        <div className="min-h-[85vh] flex flex-col justify-end pb-20 md:pb-28">
          <div className="flex flex-col md:flex-row gap-8 md:gap-[38px] items-start md:items-end w-full pt-28 md:pt-0">
            {/* Poster */}
            <div className="flex-none w-[130px] sm:w-[150px] md:w-[180px] aspect-[2/3] rounded-[14px] overflow-hidden shadow-[0_24px_56px_rgba(0,0,0,0.6)] border border-white/[0.08] relative bg-void-2">
              <AppImage
                src={detail.img}
                alt={detail.alt || detail.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Info Block */}
            <div className="flex-1 pb-1 max-w-[680px]">
              {/* Type label tracked-out caps, genres in italic — the "typographic mix" */}
              <div className="flex items-center flex-wrap gap-2 mb-4">
                <span className="text-[11px] font-bold tracking-[0.14em] text-violet-light uppercase">
                  {isMovie ? 'Movie' : 'TV Show'}
                </span>
                {genresString && (
                  <span className="text-[13.5px] italic font-normal text-muted-strong">
                    {genresString}
                  </span>
                )}
                {cert && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-[16px] px-1 border border-muted/80 rounded-[3px] text-[9.5px] font-bold text-muted not-italic">
                    {cert}
                  </span>
                )}
              </div>

              {/* Big, gradient-filled display title — the signature StreamVault flourish */}
              <h1
                className="font-display text-[38px] sm:text-[52px] md:text-[68px] font-extrabold tracking-[-0.02em] leading-[0.98] mb-[18px]"
                style={{
                  background:
                    'linear-gradient(90deg, #ffffff 35%, var(--violet-light) 85%, var(--magenta) 110%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {detail.title}
              </h1>

              {/* Overview with inline MORE/LESS button */}
              <div className="mb-5 text-[14.5px] leading-[1.65] text-muted-strong">
                <span className="inline">{displayedOverview}</span>
                {canTruncate && (
                  <button
                    onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                    className="inline-flex items-center ml-1.5 px-2.5 py-0.5 bg-glass border border-glass-border hover:border-violet rounded-full text-[11px] font-bold tracking-[0.02em] text-foreground cursor-pointer align-middle transition-colors"
                  >
                    {isOverviewExpanded ? 'LESS' : 'MORE'}
                  </button>
                )}
              </div>

              {/* Chip strip */}
              <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-muted font-medium mb-[26px]">
                <span className="text-gold font-bold flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-gold">
                    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.9-6.2 3.9 1.6-7L2 9.2l7.1-.6z" />
                  </svg>
                  {cleanRating}
                </span>
                <span className="w-[3px] h-[3px] rounded-full bg-muted flex-none" />
                {releaseYear && (
                  <>
                    <span>{releaseYear}</span>
                    <span className="w-[3px] h-[3px] rounded-full bg-muted flex-none" />
                  </>
                )}
                {extraInfo && (
                  <>
                    <span>{extraInfo}</span>
                    <span className="w-[3px] h-[3px] rounded-full bg-muted flex-none" />
                  </>
                )}
                <span className="text-[10.5px] font-bold tracking-[0.02em] px-1.5 py-0.5 border border-glass-border rounded text-muted-strong uppercase">
                  HD
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {/* Primary Watch Button */}
                <button
                  onClick={() => handleWatchNow(lastWatched?.season, lastWatched?.episode)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all shadow-lg cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {showPlayer
                    ? 'Resume Watching'
                    : lastWatched?.season && lastWatched?.episode
                    ? `Resume S${lastWatched.season} E${lastWatched.episode}`
                    : lastWatched?.progress && lastWatched?.duration && lastWatched.duration > 0
                    ? `Resume (${Math.max(1, Math.round((lastWatched.duration - lastWatched.progress) / 60))}m left)`
                    : lastWatched
                    ? 'Resume Watching'
                    : 'Watch Now'}
                </button>

                <StreamtapeDownloadButton
                  tmdbId={mediaId}
                  mediaType={mediaType}
                  season={selectedSeason}
                  episode={selectedEpisode}
                />

                {/* Favorite Button */}
                <button
                  onClick={handleFavorite}
                  disabled={favLoading}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                    isFavorite
                      ? 'bg-rose-500/20 border-rose-500 text-rose-500 shadow-lg shadow-rose-500/20'
                      : 'bg-zinc-900/80 border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  aria-label={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>

                {/* Watchlist Button */}
                <button
                  onClick={handleWatchlist}
                  disabled={watchLoading}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                    isInWatchlist
                      ? 'bg-violet-600/20 border-violet-500 text-violet-400 shadow-lg shadow-violet-600/20'
                      : 'bg-zinc-900/80 border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  aria-label={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                >
                  {isInWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Streaming Player Section ── */}
        {showPlayer && (
          <div ref={playerRef} className="mt-14 pt-8 border-t border-glass-border">
            {/* Header row */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h2 className="font-display text-base md:text-lg font-semibold text-foreground tracking-tight">
                Now streaming
              </h2>
              <button
                onClick={() => {
                  setShowPlayer(false);
                  setActiveSourceIndex(0);
                  setLoadError(false);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] border border-glass-border text-muted hover:text-foreground transition-all duration-200 cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                Close player
              </button>
            </div>

            {/* Source selector tabs */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted mr-1">
                Source
              </span>
              {EMBED_SOURCES.map((src, i) => (
                <button
                  key={src.name}
                  onClick={() => handleSourceChange(i)}
                  className={`px-3.5 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                    activeSourceIndex === i
                      ? 'bg-foreground text-void'
                      : 'bg-void-2 hover:bg-void-3 border border-glass-border text-muted hover:text-foreground'
                  }`}
                >
                  Source {i + 1}
                </button>
              ))}
              <button
                onClick={() => {
                  setCleanMode((v) => !v);
                  setIframeLoaded(false);
                  setIframeKey((k) => k + 1);
                }}
                title="Loads the player through our server with ad scripts removed. Turn off if the video won't play."
                className={`ml-auto px-3.5 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer border ${
                  cleanMode
                    ? 'bg-violet/20 border-violet/50 text-violet-light'
                    : 'bg-void-2 border-glass-border text-muted hover:text-foreground'
                }`}
              >
                Clean mode: {cleanMode ? 'On' : 'Off'}
              </button>
              <button
                onClick={() => {
                  setBlockPopups((v) => !v);
                  setIframeLoaded(false);
                  setIframeKey((k) => k + 1);
                }}
                title="Blocks popups and redirects from the player. Turn off if the video won't play."
                className={`px-3.5 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer border ${
                  blockPopups
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-void-2 border-glass-border text-muted hover:text-foreground'
                }`}
              >
                Popup blocker: {blockPopups ? 'On' : 'Off'}
              </button>
            </div>

            {/* Load error banner */}
            {loadError && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-4 bg-rose-500/10 border border-rose-500/30">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-none">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16h.01" />
                  </svg>
                  <span>Source encountered a loading issue. Try switching to another source.</span>
                </div>
                <button
                  onClick={handleNextSource}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet/30 border border-violet/50 text-white hover:bg-violet/50 transition-all cursor-pointer"
                >
                  Try next source
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              </div>
            )}

            {/* Iframe player container */}
            <div className="w-full rounded-2xl overflow-hidden relative aspect-video bg-black border border-glass-border shadow-[0_8px_40px_rgba(123,47,255,0.15)]">
              {!iframeLoaded && !loadError && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-void-2">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-violet animate-spin" />
                    <p className="text-[11px] text-muted font-medium tracking-wider uppercase">
                      Connecting to Source {activeSourceIndex + 1}...
                    </p>
                  </div>
                </div>
              )}

              {/* Proactive hint */}
              {showSourceHint && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-void-2/90 backdrop-blur-md pl-4 pr-2 py-2 rounded-full border border-glass-border shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                  <p className="text-[12px] text-muted whitespace-nowrap">Nothing playing? Try another source or turn the popup blocker off.</p>
                  <button
                    onClick={() => {
                      handleNextSource();
                      setShowSourceHint(false);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11.5px] font-semibold text-void hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(180deg, #ffffff, #e8e6ea)' }}
                  >
                    Try next source
                  </button>
                  <button
                    onClick={() => setShowSourceHint(false)}
                    aria-label="Dismiss"
                    className="w-5 h-5 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-white/[0.08] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {redirectBlockedNotice && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-void-2/90 border border-glass-border text-[12px] text-foreground">
                  Redirect blocked — player restored
                </div>
              )}

              <iframe
                ref={iframeRef}
                key={`${iframeKey}-${activeSourceIndex}-${selectedSeason}-${selectedEpisode}-${blockPopups}-${cleanMode}-${recoverKey}`}
                src={getEmbedUrl()}
                className="w-full h-full"
                allowFullScreen
                {...(cleanMode
                  ? { sandbox: CLEAN_MODE_SANDBOX } // no allow-same-origin: embed code can't touch our origin
                  : blockPopups && EMBED_SOURCES[activeSourceIndex].sandbox !== false
                    ? { sandbox: EMBED_SOURCES[activeSourceIndex].sandbox || POPUP_BLOCK_SANDBOX }
                    : {})}
                {...(EMBED_SOURCES[activeSourceIndex].allow !== undefined
                  ? { allow: EMBED_SOURCES[activeSourceIndex].allow }
                  : { allow: DEFAULT_ALLOW })}
                {...(EMBED_SOURCES[activeSourceIndex].referrerPolicy !== undefined
                  ? { referrerPolicy: EMBED_SOURCES[activeSourceIndex].referrerPolicy }
                  : {})}
                style={{ border: 'none', display: 'block', position: 'relative', zIndex: 0 }}
                title={`${detail.title} - Source ${activeSourceIndex + 1}`}
                onLoad={handleFrameLoad}
                onError={handleIframeError}
              />

              {/* ── Up Next overlay (TV only, manual) ── */}
              {nextEp && iframeLoaded && !nextEpDismissed && (
                <div className="absolute bottom-4 right-4 z-20 w-[280px] flex items-center gap-3 bg-void-2/85 backdrop-blur-md p-2.5 rounded-xl border border-glass-border shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
                  <div className="relative flex-none w-16 aspect-video rounded-md overflow-hidden bg-void-3">
                    {nextEp.ep.stillImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={nextEp.ep.stillImg}
                        alt={nextEp.ep.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9.5px] font-semibold uppercase tracking-wider text-violet-light mb-0.5">
                      Up next · S{nextEp.season}E{nextEp.ep.episodeNumber}
                    </p>
                    <p className="font-display text-[12.5px] font-semibold text-foreground leading-tight line-clamp-1">
                      {nextEp.ep.name}
                    </p>
                  </div>
                  <button
                    onClick={() => playEpisode(nextEp.season, nextEp.ep.episodeNumber)}
                    aria-label="Play next episode"
                    className="flex-none w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all duration-150"
                    style={{ background: 'linear-gradient(180deg, #ffffff, #e8e6ea)' }}
                  >
                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-void translate-x-[1px]">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setNextEpDismissed(true)}
                    aria-label="Dismiss"
                    className="flex-none w-6 h-6 rounded-md flex items-center justify-center text-muted hover:text-foreground hover:bg-white/[0.08] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Source info + controls */}
            <div className="mt-3 flex items-center justify-between flex-wrap gap-2 bg-void-2/60 backdrop-blur-md p-3 rounded-xl border border-glass-border text-xs text-muted">
              <p>
                Currently streaming from{' '}
                <span className="text-violet-light font-semibold">Source {activeSourceIndex + 1}</span>
                {!isMovie ? ` · S${selectedSeason}E${selectedEpisode}` : ''}
              </p>
              <button
                onClick={handleNextSource}
                disabled={activeSourceIndex === EMBED_SOURCES.length - 1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-void-3 hover:bg-zinc-800 disabled:opacity-40 text-foreground rounded-lg font-medium text-xs transition-colors cursor-pointer border border-glass-border"
              >
                Try next source
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Episode browsing rail (TV shows only) ── */}
        {!isMovie && (
          <div className="mt-6 group/row">
            <div className="flex items-center justify-between mb-7">
              <div className="relative inline-block">
                <select
                  value={browseSeason}
                  onChange={(e) => setBrowseSeason(Number(e.target.value))}
                  className="appearance-none font-display text-lg font-semibold bg-transparent border border-glass-border rounded-lg pl-4 pr-9 py-2 cursor-pointer outline-none text-foreground hover:border-violet transition-colors"
                >
                  {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={s} className="bg-void-2 text-foreground">
                      Season {s}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            {episodesLoading ? (
              <div className="flex gap-6 overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ShimmerCard key={i} className="flex-none w-[300px] aspect-video rounded-xl" />
                ))}
              </div>
            ) : episodes.length === 0 ? (
              <p className="text-muted text-sm">No episode data available for this season.</p>
            ) : (
              <div className="relative">
                <RowScrollButtons
                  onLeft={() => scrollRow(episodesRowRef, -1)}
                  onRight={() => scrollRow(episodesRowRef, 1)}
                />
                <div
                  ref={episodesRowRef}
                  className="spotlight-scope flex gap-6 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                {episodes.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => playEpisode(browseSeason, ep.episodeNumber)}
                    className="group flex-none w-[300px] snap-start text-left cursor-pointer"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-void-2 mb-3">
                      {ep.stillImg ? (
                        <ShimmerImage
                          src={ep.stillImg}
                          alt={ep.name}
                          loading="lazy"
                          className="quiet-media w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                          No preview
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors duration-200">
                        <div className="w-11 h-11 rounded-full bg-white/0 group-hover:bg-white/90 flex items-center justify-center transition-all duration-200 scale-90 group-hover:scale-100">
                          <svg
                            viewBox="0 0 24 24"
                            className="w-4 h-4 fill-void opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-x-[1px]"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-light mb-1.5">
                      Episode {ep.episodeNumber}
                    </p>
                    <p className="font-display text-[14.5px] font-semibold text-foreground mb-1.5 leading-tight line-clamp-1">
                      {ep.name}
                    </p>
                    <p className="text-[12.5px] text-muted leading-relaxed line-clamp-2 mb-2">
                      {ep.overview || 'No synopsis available.'}
                    </p>
                    {ep.runtime && (
                      <div className="flex items-center gap-1.5 text-muted">
                        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current flex-none">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <span className="text-[11.5px] font-medium">{ep.runtime}m</span>
                      </div>
                    )}
                  </button>
                ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Trailers rail (movies and TV) ── */}
        {(trailersLoading || trailers.length > 0) && (
          <div className="mt-6 group/row">
            <h2 className="font-display text-lg font-semibold text-foreground mb-7">Trailers</h2>

            {trailersLoading ? (
              <div className="flex gap-6 overflow-hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ShimmerCard key={i} className="flex-none w-[300px] aspect-video rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="relative">
                <RowScrollButtons
                  onLeft={() => scrollRow(trailersRowRef, -1)}
                  onRight={() => scrollRow(trailersRowRef, 1)}
                />
                <div
                  ref={trailersRowRef}
                  className="spotlight-scope flex gap-6 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                {trailers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTrailer(t)}
                    className="group flex-none w-[300px] snap-start text-left cursor-pointer"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-void-2 mb-3">
                      <ShimmerImage
                        src={t.thumbnailImg}
                        alt={t.name}
                        loading="lazy"
                        className="quiet-media w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors duration-200">
                        <div className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center transition-transform duration-200 scale-90 group-hover:scale-100">
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-void translate-x-[1px]">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <p className="font-display text-[14.5px] font-semibold text-foreground leading-tight line-clamp-1 mb-1">
                      {t.name}
                    </p>
                    {/* Small persistent play glyph, matching the always-visible
                        icon-row Apple's cards use under the thumbnail — no
                        duration shown next to it since TMDB's video API
                        doesn't provide one, and a made-up number would be
                        worse than none at all. */}
                    <div className="flex items-center gap-1.5 text-muted">
                      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current flex-none">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span className="text-[11.5px] font-medium">Trailer</span>
                    </div>
                  </button>
                ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Related titles ── */}
        {related.length > 0 && (
          <div className="mt-10 group/row">
            <h2 className="font-display text-lg font-semibold text-foreground mb-7">Related</h2>
            <div className="relative">
              <RowScrollButtons
                onLeft={() => scrollRow(relatedRowRef, -1)}
                onRight={() => scrollRow(relatedRowRef, 1)}
              />
              <div
                ref={relatedRowRef}
                className="spotlight-scope flex gap-6 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/media/${r.mediaType}/${r.id}`}
                  prefetch={false}
                  className="group flex-none w-[170px] snap-start text-left cursor-pointer"
                >
                  <div className="relative aspect-[2/3] rounded-[10px] overflow-hidden bg-void-2 mb-2">
                    <span className="absolute top-2 left-2 z-10 text-[9px] font-display font-semibold uppercase tracking-wide text-foreground/80 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      {r.mediaType === 'tv' ? 'Series' : 'Movie'}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <ShimmerImage
                      src={`https://image.tmdb.org/t/p/w500${r.poster_path}`}
                      alt={r.title}
                      loading="lazy"
                      className="quiet-media w-full h-full object-cover group-hover:scale-[1.045]"
                    />
                    <div className="absolute inset-0 flex flex-col justify-end p-2.5 bg-gradient-to-t from-void via-void/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {r.vote_average > 0 && (
                        <span className="flex items-center gap-[3px] text-gold text-[11px] font-semibold">
                          <svg viewBox="0 0 24 24" className="w-[9px] h-[9px] fill-gold">
                            <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.9-6.2 3.9 1.6-7L2 9.2l7.1-.6z" />
                          </svg>
                          {r.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-display text-[13px] font-semibold text-foreground leading-tight line-clamp-1">
                    {r.title}
                  </p>
                </Link>
              ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Cast & Crew ── */}
        {fullCredits.length > 0 && (
          <div className="mt-10 group/row">
            <h2 className="font-display text-lg font-semibold text-foreground mb-7">Cast &amp; Crew</h2>
            <div className="relative">
              <RowScrollButtons
                onLeft={() => scrollRow(castRowRef, -1)}
                onRight={() => scrollRow(castRowRef, 1)}
              />
              <div
                ref={castRowRef}
                className="spotlight-scope flex gap-6 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
              {fullCredits.map((c) => (
                <Link
                  key={c.id}
                  href={`/person/${c.id}`}
                  className="group flex-none w-[92px] snap-start text-center"
                >
                  <div className="relative w-[92px] aspect-square rounded-full overflow-hidden bg-void-2 mb-2.5 border border-glass-border">
                    {c.profileImg ? (
                      <ShimmerImage
                        src={c.profileImg}
                        alt={c.name}
                        loading="lazy"
                        className="quiet-media w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted text-lg font-display font-semibold">
                        {c.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="font-display text-[12px] font-semibold text-foreground leading-tight line-clamp-1">
                    {c.name}
                  </p>
                  {c.character && (
                    <p className="text-[11px] text-muted leading-tight line-clamp-1 mt-0.5">
                      {c.character}
                    </p>
                  )}
                </Link>
              ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Trailer lightbox ── */}
      {activeTrailer && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setActiveTrailer(null)}
        >
          <div
            className="w-full max-w-3xl aspect-video rounded-2xl overflow-hidden bg-black relative border border-glass-border shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveTrailer(null)}
              aria-label="Close trailer"
              className="absolute -top-11 right-0 w-9 h-9 rounded-full bg-void-2/80 border border-glass-border backdrop-blur-md flex items-center justify-center hover:border-violet transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${activeTrailer.key}?autoplay=1`}
              className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={activeTrailer.name}
            />
          </div>
        </div>
      )}
    </div>
  );
}
