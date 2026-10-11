import Link from 'next/link';
import HeaderAvatar from '@/components/HeaderAvatar';
import HeroSpotlight from '@/components/HeroSpotlight';
import FeaturedBanner from '@/components/FeaturedBanner';
import MovieRow from '@/components/MovieRow';
import TopSearchBar from '@/components/TopSearchBar';
import { getKidsCatalog, KIDS_CATALOGS, type TMDBKidsCollection } from '@/lib/services/tmdbService';

type KidsCatalogPage = 'home' | 'browse' | 'movies' | 'series' | 'new';

const MOVIE_COLLECTIONS: TMDBKidsCollection[] = ['all-movies', 'animated-movies', 'family-movies'];
const SERIES_COLLECTIONS: TMDBKidsCollection[] = [
  'all-series',
  'animated-series',
  'kids-series',
  'family-series',
];
const ALL_COLLECTIONS = [...MOVIE_COLLECTIONS, ...SERIES_COLLECTIONS];

function collectionsForPage(page: KidsCatalogPage): TMDBKidsCollection[] {
  if (page === 'movies') return MOVIE_COLLECTIONS;
  if (page === 'series') return SERIES_COLLECTIONS;
  return ALL_COLLECTIONS;
}

function kidsCatalogHref(collection: TMDBKidsCollection) {
  return `/browse/catalog?kids=${collection}`;
}

function KidsCategoryTiles({
  catalogs,
}: {
  catalogs: {
    collection: TMDBKidsCollection;
    result: Awaited<ReturnType<typeof getKidsCatalog>>;
  }[];
}) {
  return (
    <div className="flex h-[300px] gap-1.5 overflow-hidden rounded-2xl md:h-[420px]">
      {catalogs.map(({ collection, result }) => {
        const { title } = KIDS_CATALOGS[collection];
        const posters = result.items
          .slice(0, 3)
          .map((item) => item.poster_path)
          .filter(Boolean);
        while (posters.length < 3) posters.push('');
        return (
          <Link
            key={collection}
            href={kidsCatalogHref(collection)}
            className="group relative flex min-w-16 flex-1 items-end overflow-hidden rounded-2xl bg-void-2 p-5 transition-[flex-grow] duration-500 ease-out hover:flex-[5]"
          >
            <div className="absolute inset-0 flex">
              {posters.map((posterPath, index) => (
                <div
                  key={`${collection}-poster-${index}`}
                  className="flex-1 bg-cover bg-center grayscale-[35%] brightness-[0.7] transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0 group-hover:brightness-90"
                  style={
                    posterPath
                      ? {
                          backgroundImage: `url(https://image.tmdb.org/t/p/w342${posterPath})`,
                        }
                      : { background: '#1a1a1f' }
                  }
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent" />
            <span className="relative font-display text-[15px] font-semibold text-foreground [writing-mode:vertical-rl] rotate-180 transition-opacity duration-300 group-hover:opacity-0">
              {title}
            </span>
            <span className="absolute bottom-5 left-5 max-w-[220px] translate-y-1.5 font-display text-2xl font-extrabold leading-tight opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              {title}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default async function KidsCatalog({ page }: { page: KidsCatalogPage }) {
  const collections = collectionsForPage(page);
  const catalogs = await Promise.all(
    collections.map(async (collection) => ({
      collection,
      ...KIDS_CATALOGS[collection],
      result: await getKidsCatalog(collection),
    }))
  );

  const movieCatalog = catalogs.find(({ collection }) =>
    page === 'series' ? collection === 'all-series' : collection === 'all-movies'
  );
  const seriesCatalog = catalogs.find(({ collection }) => collection === 'all-series');
  const heroItems = [movieCatalog, seriesCatalog]
    .flatMap((catalog) => catalog?.result.items.slice(0, 3) ?? [])
    .map((item) => ({ ...item, mediaType: item.mediaType }));

  const heading =
    page === 'movies'
      ? 'Movies'
      : page === 'series'
        ? 'Series'
        : page === 'browse'
          ? 'Find something worth staying up for.'
          : page === 'new'
            ? 'New & Popular'
            : 'Kids & family picks';
  const subtitle =
    page === 'movies'
      ? 'Everything to watch, browsable by genre'
      : page === 'series'
        ? 'Shows and series, browsable by genre'
        : page === 'browse'
          ? 'Browse animated adventures, family favorites, and kids’ shows.'
          : page === 'new'
            ? 'Fresh family arrivals and popular kids’ stories'
            : 'Animated adventures, family favorites, and kids’ shows.';

  if (page === 'home') {
    return (
      <div className="page-enter min-h-screen overflow-x-hidden bg-void font-sans antialiased text-foreground selection:bg-violet selection:text-white">
        <TopSearchBar />
        {heroItems.length > 0 ? (
          <HeroSpotlight
            items={heroItems}
            mockHero={{
              id: 0,
              title: 'Family-friendly adventures',
              overview: 'Discover animated stories, family movies, and shows for young explorers.',
            }}
          />
        ) : (
          <div className="min-h-[640px] bg-void px-5 pt-24 md:px-10">
            <h1 className="font-display text-3xl font-extrabold">Family-friendly adventures</h1>
            <p className="mt-3 text-sm text-muted">
              Kids titles are temporarily unavailable. Please try again shortly.
            </p>
          </div>
        )}
        <div className="relative z-20 flex flex-col px-5 pb-16 pt-8 md:pl-28 md:pr-10">
          {catalogs.map(({ collection, title, mediaType, result }, index) => (
            <MovieRow
              key={collection}
              title={title}
              items={result.items}
              mediaType={mediaType}
              enableKidsControls
              showRank={index === 0}
              viewAllHref={kidsCatalogHref(collection)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter min-h-screen overflow-x-hidden bg-void font-sans antialiased text-foreground selection:bg-violet selection:text-white sv-page">
      <div className="sv-page-inner">
        <div className={`sv-page-head ${page === 'browse' ? '!items-start !mb-10' : 'sv-catalog'}`}>
          <div className={page === 'browse' ? 'max-w-xl' : undefined}>
            <h1
              className={
                page === 'browse'
                  ? 'mb-3 font-display text-3xl font-extrabold leading-tight tracking-tight md:text-[38px]'
                  : 'sv-page-title font-display'
              }
            >
              {heading}
            </h1>
            <p className={page === 'browse' ? 'text-[15px] leading-relaxed text-muted' : 'sv-page-sub'}>
              {subtitle}
            </p>
          </div>
          <HeaderAvatar />
        </div>

        {page === 'browse' && (
          <>
            <div className="mb-3.5 text-[13px] text-muted">Pick a family mood</div>
            <KidsCategoryTiles catalogs={catalogs} />
          </>
        )}

        {(page === 'movies' || page === 'series') && movieCatalog && (
          <>
            <FeaturedBanner
              items={movieCatalog.result.items.slice(0, 6).map((item) => ({
                id: item.id,
                title: item.title,
                overview: item.overview,
                backdropPath: item.backdrop_path,
                posterPath: item.poster_path,
                year: item.release_date.split('-')[0],
                rating: item.vote_average,
              }))}
              mediaType={movieCatalog.mediaType}
              eyebrow={page === 'movies' ? 'Family-friendly movies' : 'Family-friendly shows'}
            />
            <div className="sv-chip-row">
              {collections.map((collection) => (
                <Link key={collection} href={kidsCatalogHref(collection)} className="sv-chip">
                  {KIDS_CATALOGS[collection].title}
                </Link>
              ))}
            </div>
          </>
        )}

        {page === 'new' && movieCatalog && (
          <FeaturedBanner
            items={movieCatalog.result.items.slice(0, 6).map((item) => ({
              id: item.id,
              title: item.title,
              overview: item.overview,
              backdropPath: item.backdrop_path,
              posterPath: item.poster_path,
              year: item.release_date.split('-')[0],
              rating: item.vote_average,
            }))}
            mediaType={movieCatalog.mediaType}
            eyebrow="Popular with families"
          />
        )}

        <div className={`flex flex-col pb-16 ${page === 'new' ? 'relative z-20 -mt-8 pb-32' : ''}`}>
          {catalogs.map(({ collection, title, mediaType, result }, index) => (
            <MovieRow
              key={collection}
              title={title}
              items={result.items}
              mediaType={mediaType}
              enableKidsControls
              showRank={(page === 'movies' || page === 'series' || page === 'new') && index === 0}
              spotlightStyles={page === 'new'}
              viewAllHref={kidsCatalogHref(collection)}
            />
          ))}
          {catalogs.every(({ result }) => result.items.length === 0) && (
            <p className="px-4 py-10 text-sm text-muted" role="status">
              No kids&apos; titles are available right now. Please try again later.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
