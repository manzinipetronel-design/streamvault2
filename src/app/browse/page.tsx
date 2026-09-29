import Link from 'next/link';
import MovieRow from '@/components/MovieRow';
import HeaderAvatar from '@/components/HeaderAvatar';
import {
  getGenreTiles,
  getEraRows,
  getFeaturedCollections,
  getNetworkLogos,
  getStudioLogos,
  TMDBGenreTile,
  TMDBLogo,
} from '@/lib/services/tmdbService';

// One-line mood copy per genre — ours, not TMDB's. Keeps the panel from
// feeling like an empty decorative label once it expands.
const GENRE_BLURB: Record<string, string> = {
  Action: 'High stakes, higher body counts.',
  Horror: 'Sleep with the lights on.',
  'Sci-Fi': 'Other worlds, familiar problems.',
  Romance: 'Slow burns and grand gestures.',
  Animation: 'Drawn, rendered, or stop-motion.',
  Thriller: 'Something is always about to go wrong.',
  Fantasy: 'Maps in the front cover, magic in the plot.',
  Mystery: "Everyone's a suspect until the last act.",
};

// Fallback text — only rendered if TMDB has no logo image for that entry, so
// a lookup miss never leaves an empty tile. `accent` colors the glow that
// appears behind the logo on hover, standing in for each brand's own color
// since the logo images themselves are small monochrome icons.
const NETWORK_FALLBACK: Record<string, { label: string; accent: string }> = {
  Netflix: { label: 'NETFLIX', accent: '#e5304a' },
  'Disney Plus': { label: 'Disney+', accent: '#4db8ff' },
  'Amazon Prime Video': { label: 'prime video', accent: '#00a8e1' },
  Max: { label: 'MAX', accent: '#c9a4ff' },
  'Apple TV Plus': { label: 'Apple TV+', accent: '#e5e5e5' },
  Hulu: { label: 'hulu', accent: '#1ce783' },
  Crunchyroll: { label: 'Crunchyroll', accent: '#f47521' },
  'Paramount Plus': { label: 'Paramount+', accent: '#0064ff' },
};

const STUDIO_FALLBACK: Record<string, string> = {
  'Marvel Studios': 'MARVEL STUDIOS',
  Pixar: 'PIXAR',
  'Walt Disney Pictures': 'WALT DISNEY PICTURES',
  'Warner Bros. Pictures': 'WARNER BROS.',
  'Universal Pictures': 'UNIVERSAL',
  'DreamWorks Animation': 'DREAMWORKS',
  Paramount: 'PARAMOUNT',
  'Columbia Pictures': 'COLUMBIA PICTURES',
  '20th Century Studios': '20TH CENTURY STUDIOS',
  'Legendary Pictures': 'LEGENDARY',
};

function NetworkTile({ logo }: { logo: TMDBLogo }) {
  const fb = NETWORK_FALLBACK[logo.name] || { label: logo.name, accent: '#7B2FFF' };
  const href =
    logo.id != null
      ? `/browse/catalog?provider=${logo.id}&name=${encodeURIComponent(fb.label)}`
      : `/search?q=${encodeURIComponent(fb.label)}`;
  return (
    <Link
      href={href}
      style={{ ['--accent' as string]: fb.accent }}
      className="group relative flex-none flex items-center justify-center px-9"
    >
      {logo.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo.logoUrl}
          alt={fb.label}
          className="h-11 max-w-[140px] object-contain grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
        />
      ) : (
        <span
          className="font-display font-semibold text-2xl text-muted group-hover:text-[color:var(--accent)] transition-colors duration-300 whitespace-nowrap"
        >
          {fb.label}
        </span>
      )}
    </Link>
  );
}

function StudioTile({ logo }: { logo: TMDBLogo }) {
  const label = STUDIO_FALLBACK[logo.name] || logo.name;
  const href =
    logo.id != null
      ? `/browse/catalog?company=${logo.id}&name=${encodeURIComponent(label)}`
      : `/search?q=${encodeURIComponent(label)}`;
  return (
    <Link
      href={href}
      className="group inline-flex items-center justify-center h-16 px-6 rounded-lg bg-zinc-100/90 opacity-80 hover:opacity-100 hover:-translate-y-0.5 transition-all duration-300"
    >
      {logo.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo.logoUrl} alt={label} className="h-8 max-w-[140px] object-contain" />
      ) : (
        <span className="text-xs text-center leading-tight text-zinc-800 font-bold">{label}</span>
      )}
    </Link>
  );
}

function MoodPanel({ tile }: { tile: TMDBGenreTile }) {
  const bg = tile.posters.length > 0 ? tile.posters : ['', '', ''];
  return (
    <Link
      href={`/browse/catalog?genre=${tile.id}&name=${encodeURIComponent(tile.name)}`}
      className="group relative flex-1 min-w-16 rounded-2xl overflow-hidden transition-[flex-grow] duration-500 ease-out hover:flex-[5] bg-void-2"
    >
      {/* poster collage background — quiet/grayscale at rest, revealed on hover */}
      <div className="absolute inset-0 flex">
        {bg.slice(0, 3).map((p, i) => (
          <div
            key={i}
            className="flex-1 bg-cover bg-center grayscale-[35%] brightness-[0.7] group-hover:grayscale-0 group-hover:brightness-90 group-hover:scale-105 transition-all duration-500"
            style={p ? { backgroundImage: `url(${p})` } : { background: '#1a1a1f' }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent" />

      <div className="relative h-full flex items-end p-5">
        {/* collapsed: vertical spine label */}
        <span className="font-display font-semibold text-[15px] text-foreground whitespace-nowrap [writing-mode:vertical-rl] rotate-180 group-hover:opacity-0 group-hover:absolute transition-opacity duration-300">
          {tile.name}
        </span>

        {/* expanded: full title + count + blurb */}
        <div className="max-w-[220px] opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-100">
          <div className="font-display font-extrabold text-2xl leading-tight mb-1.5">
            {tile.name}
          </div>
          {tile.totalResults > 0 && (
            <div className="text-[12.5px] text-muted font-medium">
              {tile.totalResults.toLocaleString()} titles
            </div>
          )}
          <div className="text-[12.5px] text-muted mt-1.5 leading-relaxed">
            {GENRE_BLURB[tile.name]}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function BrowsePage() {
  const [genres, eras, collections, networkLogos, studioLogos] = await Promise.all([
    getGenreTiles(),
    getEraRows(),
    getFeaturedCollections(),
    getNetworkLogos(),
    getStudioLogos(),
  ]);

  return (
    <div className="page-enter min-h-screen bg-void text-foreground overflow-x-hidden font-sans antialiased selection:bg-violet selection:text-white pb-24">
      {/* Nav — same treatment as the homepage */}
      <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-b from-black/90 via-black/40 to-transparent px-6 md:px-12 py-5 flex items-center justify-between backdrop-blur-[2px]">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-light to-magenta bg-clip-text text-transparent"
          >
            STREAMVAULT
          </Link>
          <nav className="desktop-nav hidden md:flex items-center gap-6 text-[13px] text-muted font-medium">
            <Link href="/" className="hover:text-foreground transition duration-200">
              Home
            </Link>
            <Link href="/series" className="hover:text-foreground transition duration-200">
              Series
            </Link>
            <Link href="/movies" className="hover:text-foreground transition duration-200">
              Movies
            </Link>
            <Link href="/browse" className="text-foreground">
              Browse
            </Link>
            <Link href="/lists" className="hover:text-foreground transition duration-200">
              Watchlist
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/search"
            className="text-muted hover:text-foreground text-sm font-medium transition cursor-pointer"
          >
            Search
          </Link>
          <HeaderAvatar />
        </div>
      </header>

      <main className="pt-28 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="max-w-xl mb-10">
          <h1 className="font-display text-3xl md:text-[38px] font-extrabold leading-tight tracking-tight mb-3">
            Find something worth staying up for.
          </h1>
          <p className="text-muted text-[15px] leading-relaxed">
            Sorted by mood rather than category — hover a panel to see what&apos;s inside.
          </p>
        </div>

        {/* Mood rail */}
        <div className="text-[13px] text-muted mb-3.5">Pick a mood</div>
        <div className="flex h-[420px] gap-1.5 rounded-2xl overflow-hidden">
          {genres.map((g) => (
            <MoodPanel key={g.id} tile={g} />
          ))}
        </div>

        {/* Popular Networks */}
        <section className="mt-20">
          <div className="mb-6">
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Already paying for it?
            </h2>
            <p className="text-[13px] text-muted mt-1">
              Jump straight to what&apos;s on each service
            </p>
          </div>
          <div className="marquee-mask">
            <div className="marquee-track py-1">
              {[...networkLogos, ...networkLogos].map((logo, i) => (
                <NetworkTile key={`${logo.name}-${i}`} logo={logo} />
              ))}
            </div>
          </div>
        </section>

        {/* Studios */}
        <section className="mt-16">
          <h2 className="font-display text-xl font-semibold tracking-tight mb-6">Studios</h2>
          <div className="flex flex-wrap gap-3">
            {studioLogos.map((logo) => (
              <StudioTile key={logo.name} logo={logo} />
            ))}
          </div>
        </section>

        {/* Collections */}
        {collections.length > 0 && (
          <section className="mt-16">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display text-xl font-semibold tracking-tight">Collections</h2>
              <Link href="/search" className="link-sweep text-[13px]">
                Explore all
              </Link>
            </div>
            <div className="spotlight-scope flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {collections.map((c) => (
                <Link
                  key={c.id}
                  href={`/search?q=${encodeURIComponent(c.name)}`}
                  className="group relative flex-none w-[300px] h-[170px] rounded-xl overflow-hidden"
                >
                  <div
                    className="quiet-media absolute inset-0 bg-cover bg-center group-hover:scale-105"
                    style={{ backgroundImage: `url(${c.backdropImg})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void via-void/30 to-void/10" />
                  <div className="relative h-full flex flex-col justify-end p-4">
                    <h3 className="font-display font-semibold text-lg leading-tight">{c.name}</h3>
                    <p className="text-xs text-muted font-medium mt-1">{c.movieCount} movies</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Era rows — MovieRow already carries the quiet-poster + rank treatment */}
      <div className="mt-4 flex flex-col">
        {eras.map((era) => (
          <div key={era.key}>
            <div className="px-6 md:px-12 -mb-1">
              <p className="text-[13px] text-muted -mt-1">{era.subtitle}</p>
            </div>
            <MovieRow
              title={era.title}
              items={era.items.map((m) => ({
                id: m.id,
                title: m.title,
                overview: m.overview,
                poster_path: m.img,
                vote_average: parseFloat(m.rating) || undefined,
                release_date: m.year ? `${m.year}-01-01` : undefined,
              }))}
              isMock
            />
          </div>
        ))}
      </div>
    </div>
  );
}
