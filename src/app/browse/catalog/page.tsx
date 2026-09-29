import Link from 'next/link';
import CatalogGrid from '@/components/CatalogGrid';
import HeaderAvatar from '@/components/HeaderAvatar';
import { getMoviesByProvider, getMoviesByCompany, getMoviesByGenre } from '@/lib/services/tmdbService';

interface PageProps {
  searchParams: Promise<{ provider?: string; company?: string; genre?: string; name?: string }>;
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const { provider, company, genre, name } = await searchParams;

  const providerId = provider ? Number(provider) : null;
  const companyId = company ? Number(company) : null;
  const genreId = genre ? Number(genre) : null;
  const label = name || (providerId ? 'This service' : companyId ? 'This studio' : 'This category');

  const result =
    providerId != null
      ? await getMoviesByProvider(providerId)
      : companyId != null
        ? await getMoviesByCompany(companyId)
        : genreId != null
          ? await getMoviesByGenre(genreId)
          : { items: [], totalResults: 0, totalPages: 1 };

  return (
    <div className="page-enter min-h-screen bg-void text-foreground overflow-x-hidden font-sans antialiased selection:bg-violet selection:text-white pb-24">
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
        <Link href="/browse" className="link-sweep text-[13px] inline-block mb-6">
          ← Back to Browse
        </Link>

        <h1 className="font-display text-3xl md:text-[38px] font-extrabold leading-tight tracking-tight mb-2">
          {label}
        </h1>
        <p className="text-muted text-[15px] mb-10">
          {result.totalResults > 0
            ? `${result.totalResults.toLocaleString()} titles total · showing the ${result.items.length} most popular`
            : 'No titles found for this catalog.'}
        </p>

        <CatalogGrid items={result.items} providerId={providerId} companyId={companyId} genreId={genreId} />
      </main>
    </div>
  );
}
