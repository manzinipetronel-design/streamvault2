import React from 'react';
import SkeletonShell from '@/components/SkeletonShell';

const delay = (i = 0) => ({ ['--i' as string]: i }) as React.CSSProperties;

function Bar({ className = '', i = 0 }: { className?: string; i?: number }) {
  return (
    <div
      className={`shimmer-diagonal sv-skel-in ${className}`}
      style={delay(i)}
      aria-hidden="true"
    />
  );
}

export function PosterRowSkeleton({
  count = 9,
  base = 0,
  title = 'w-44',
}: {
  count?: number;
  base?: number;
  title?: string;
}) {
  return (
    <div className="flex flex-col pt-9 pb-1" aria-hidden="true">
      <div className="flex items-baseline justify-between mb-5 px-4 md:px-0">
        <Bar className={`h-5 ${title} rounded-md`} i={base} />
        <Bar className="h-3.5 w-14 rounded" i={base} />
      </div>
      <div className="flex gap-[14px] overflow-hidden">
        {Array.from({ length: count }).map((_, index) => (
          <Bar
            key={index}
            i={base + 1 + index * 0.6}
            className="flex-none w-[125px] sm:w-[150px] md:w-[172px] aspect-[2/3] rounded-[8px]"
          />
        ))}
      </div>
    </div>
  );
}

export function PageHeadSkeleton({
  title = 'w-56',
  sub = 'w-72',
}: {
  title?: string;
  sub?: string;
}) {
  return (
    <div className="sv-page-head sv-catalog" aria-hidden="true">
      <div className="flex flex-col gap-2.5">
        <Bar className={`h-9 md:h-10 ${title} rounded-lg`} />
        <Bar className={`h-3.5 ${sub} rounded`} i={1} />
      </div>
      <Bar className="h-10 w-10 rounded-full" i={2} />
    </div>
  );
}

const CHIP_WIDTHS = ['w-14', 'w-20', 'w-16', 'w-24', 'w-16', 'w-20', 'w-14', 'w-24'];

export function ChipRowSkeleton({ count = 7 }: { count?: number }) {
  return (
    <div className="sv-chip-row" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <Bar
          key={index}
          i={index * 0.5}
          className={`flex-none h-[37px] rounded-full ${CHIP_WIDTHS[index % CHIP_WIDTHS.length]}`}
        />
      ))}
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="sv-featured shimmer-diagonal" aria-hidden="true">
      <div className="sv-featured-body">
        <div className="h-3 w-28 rounded bg-white/10 mb-3" />
        <div className="h-8 md:h-10 w-3/4 rounded-lg bg-white/[0.12] mb-3" />
        <div className="h-3 w-40 rounded bg-white/10 mb-4" />
        <div className="h-3 w-full rounded bg-white/[0.07] mb-2" />
        <div className="h-3 w-4/5 rounded bg-white/[0.07] mb-5" />
        <div className="h-9 w-32 rounded-full bg-white/[0.16]" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <Bar key={index} i={index * 0.35} className="aspect-[2/3] rounded-[8px]" />
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <SkeletonShell>
      <div className="min-h-screen bg-void" aria-busy="true" aria-label="Loading">
        <section className="relative w-full min-h-[640px] overflow-hidden bg-void">
          <div className="pointer-events-none absolute -top-24 right-0 w-[60%] h-[70%] bg-gradient-to-b from-violet/[0.12] to-transparent blur-3xl" />
          <div className="relative z-20 min-h-[92vh] flex flex-col">
            <div className="flex-1 flex flex-col justify-center pl-5 pr-5 md:pl-28 md:pr-12 pt-24 pb-6">
              <div className="max-w-[640px]">
                <Bar className="h-3.5 w-44 rounded mb-5" />
                <Bar className="h-12 md:h-16 w-[78%] rounded-xl mb-3" i={1} />
                <Bar className="h-12 md:h-16 w-[52%] rounded-xl mb-6" i={2} />
                <Bar className="h-3.5 w-[70%] max-w-[440px] rounded mb-2.5" i={3} />
                <Bar className="h-3.5 w-[55%] max-w-[360px] rounded mb-8" i={3} />
                <div className="flex gap-3">
                  <Bar className="h-[50px] w-36 rounded-full" i={4} />
                  <Bar className="h-[50px] w-32 rounded-full" i={5} />
                </div>
              </div>
            </div>
            <div className="flex-none flex items-end justify-between gap-4 pl-5 pr-5 md:pl-28 md:pr-12 pb-24 sm:pb-8">
              <div className="hidden sm:flex items-end gap-2.5">
                <Bar className="w-[64px] h-[92px] rounded-[7px]" i={6} />
                {[0, 1, 2, 3, 4].map((index) => (
                  <Bar key={index} i={7 + index * 0.4} className="w-[50px] h-[74px] rounded-[7px]" />
                ))}
              </div>
              <div className="flex gap-2.5">
                {[0, 1, 2].map((index) => (
                  <Bar key={index} i={8 + index * 0.4} className="w-11 h-11 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </section>
        <div className="relative z-20 pb-16 pt-8 flex flex-col px-5 md:pl-28 md:pr-10">
          <PosterRowSkeleton base={6} title="w-40" />
          <PosterRowSkeleton base={8} title="w-48" />
        </div>
      </div>
    </SkeletonShell>
  );
}

export function CatalogSkeleton({ rows = 3, chips = 8 }: { rows?: number; chips?: number }) {
  return (
    <SkeletonShell>
      <div className="min-h-screen bg-void sv-page" aria-busy="true" aria-label="Loading">
        <div className="sv-page-inner">
          <BannerSkeleton />
          <PageHeadSkeleton />
          <ChipRowSkeleton count={chips} />
          {Array.from({ length: rows }).map((_, index) => (
            <PosterRowSkeleton key={index} base={index * 3} />
          ))}
        </div>
      </div>
    </SkeletonShell>
  );
}

export function GenericSkeleton({
  chips = 0,
  search = false,
  count = 18,
}: {
  chips?: number;
  search?: boolean;
  count?: number;
}) {
  return (
    <SkeletonShell>
      <div className="min-h-screen bg-void sv-page" aria-busy="true" aria-label="Loading">
        <div className="sv-page-inner">
          <PageHeadSkeleton />
          {search && (
            <div className="flex items-center gap-2.5 mb-8 max-w-xl">
              <Bar className="h-[46px] flex-1 rounded-full" />
              <Bar className="h-[46px] w-[46px] rounded-full" i={1} />
            </div>
          )}
          {chips > 0 && <ChipRowSkeleton count={chips} />}
          <GridSkeleton count={count} />
        </div>
      </div>
    </SkeletonShell>
  );
}

export function BrowseSkeleton() {
  return (
    <SkeletonShell>
      <div className="min-h-screen bg-void sv-page" aria-busy="true" aria-label="Loading">
        <div className="sv-page-inner">
          <div className="sv-page-head !items-start !mb-10">
            <div className="flex flex-col gap-3 max-w-xl w-full">
              <Bar className="h-9 md:h-10 w-[85%] rounded-lg" />
              <Bar className="h-9 md:h-10 w-[55%] rounded-lg" i={1} />
              <Bar className="h-3.5 w-[70%] rounded mt-1" i={2} />
            </div>
            <Bar className="h-10 w-10 rounded-full" i={2} />
          </div>

          <Bar className="h-3.5 w-24 rounded mb-3.5" />
          <div className="flex h-[420px] gap-1.5 rounded-2xl overflow-hidden" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <Bar key={index} i={index * 0.7} className="flex-1 min-w-16 rounded-2xl" />
            ))}
          </div>

          <section className="mt-20" aria-hidden="true">
            <Bar className="h-5 w-56 rounded-md mb-2" i={3} />
            <Bar className="h-3.5 w-64 rounded mb-6" i={3} />
            <div className="flex gap-9 overflow-hidden">
              {Array.from({ length: 8 }).map((_, index) => (
                <Bar key={index} i={4 + index * 0.4} className="flex-none h-9 w-28 rounded-md" />
              ))}
            </div>
          </section>

          <section className="mt-16" aria-hidden="true">
            <Bar className="h-5 w-24 rounded-md mb-6" i={5} />
            <div className="flex flex-wrap gap-3">
              {['w-44', 'w-32', 'w-52', 'w-24', 'w-28', 'w-32', 'w-36', 'w-24', 'w-32'].map(
                (width, index) => (
                  <Bar key={index} i={6 + index * 0.3} className={`h-16 ${width} rounded-lg`} />
                )
              )}
            </div>
          </section>

          <section className="mt-16" aria-hidden="true">
            <Bar className="h-5 w-36 rounded-md mb-6" i={7} />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 5 }).map((_, index) => (
                <Bar key={index} i={8 + index * 0.4} className="flex-none w-[300px] h-[170px] rounded-xl" />
              ))}
            </div>
          </section>

          <PosterRowSkeleton base={9} title="w-52" />
        </div>
      </div>
    </SkeletonShell>
  );
}

export function DetailSkeleton() {
  return (
    <SkeletonShell>
      <div
        className="relative min-h-screen bg-void text-foreground overflow-x-hidden font-sans"
        aria-busy="true"
        aria-label="Loading"
      >
        <Bar className="absolute top-7 left-7 z-20 h-10 w-24 rounded-[37px]" />
        <div className="pointer-events-none absolute -top-24 right-0 w-[60%] h-[60%] bg-gradient-to-b from-violet/[0.10] to-transparent blur-3xl" />

        <div className="relative z-10 max-w-[1140px] mx-auto px-6 md:px-10 pb-20">
          <div className="min-h-[70vh] flex flex-col justify-end pb-16 md:pb-20">
            <div className="flex flex-col md:flex-row gap-8 md:gap-[38px] items-start md:items-end w-full pt-28 md:pt-0">
              <Bar className="flex-none w-[130px] sm:w-[150px] md:w-[225px] aspect-[2/3] rounded-[14px]" i={1} />
              <div className="flex-1 pb-1 max-w-[680px] w-full">
                <div className="flex items-center gap-3 mb-4">
                  <Bar className="w-16 h-4 rounded" i={2} />
                  <Bar className="w-28 h-4 rounded" i={2.5} />
                  <Bar className="w-10 h-4 rounded" i={3} />
                </div>
                <Bar className="h-12 sm:h-16 w-3/4 max-w-lg rounded-lg mb-[18px]" i={3} />
                <div className="space-y-2 mb-5">
                  <Bar className="h-4 w-full rounded" i={4} />
                  <Bar className="h-4 w-5/6 rounded" i={4.5} />
                  <Bar className="h-4 w-2/3 rounded" i={5} />
                </div>
                <div className="flex items-center gap-3 mb-[26px]">
                  <Bar className="w-12 h-5 rounded" i={5} />
                  <Bar className="w-12 h-5 rounded" i={5.4} />
                  <Bar className="w-16 h-5 rounded" i={5.8} />
                </div>
                <div className="flex items-center gap-2.5">
                  <Bar className="w-36 h-12 rounded-[10px]" i={6} />
                  <Bar className="w-12 h-12 rounded-[10px]" i={6.4} />
                  <Bar className="w-12 h-12 rounded-[10px]" i={6.8} />
                  <Bar className="w-12 h-12 rounded-[10px]" i={7.2} />
                </div>
              </div>
            </div>
          </div>

          <Bar className="h-6 w-32 rounded-md mb-6" i={7} />
          <div className="flex gap-5 overflow-hidden mb-12" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <Bar key={index} i={8 + index * 0.5} className="flex-none w-[320px] aspect-video rounded-xl" />
            ))}
          </div>

          <PosterRowSkeleton base={9} title="w-28" count={7} />

          <Bar className="h-6 w-40 rounded-md mt-10 mb-6" i={10} />
          <div className="flex gap-5 overflow-hidden" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="flex-none flex flex-col items-center gap-2">
                <Bar className="h-[88px] w-[88px] rounded-full" i={11 + index * 0.3} />
                <Bar className="h-3 w-16 rounded" i={11 + index * 0.3} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonShell>
  );
}

export function LoginSkeleton() {
  return (
    <SkeletonShell>
      <main className="min-h-screen bg-[#0A0A0C] flex items-center justify-center p-4" aria-busy="true">
        <div className="w-full max-w-md">
          <Bar className="h-11 w-40 rounded-2xl mx-auto mb-6" />
          <div className="rounded-3xl p-8 bg-black/60 border border-white/10 space-y-4">
            <Bar className="h-11 rounded-xl" i={1} />
            <Bar className="h-12 rounded-xl" i={2} />
            <Bar className="h-12 rounded-xl" i={3} />
            <Bar className="h-12 rounded-xl" i={4} />
          </div>
        </div>
      </main>
    </SkeletonShell>
  );
}
