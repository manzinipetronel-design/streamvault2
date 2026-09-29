import React from 'react';

export default function MediaDetailLoading() {
  return (
    <div className="relative min-h-screen bg-void text-foreground overflow-x-hidden font-sans">
      {/* Top Floating Back Button Placeholder */}
      <div className="absolute top-7 left-7 z-20 w-24 h-10 rounded-[37px] bg-white/[0.05] border border-glass-border animate-pulse" />

      {/* Hero skeleton */}
      <div className="relative z-10 max-w-[1140px] mx-auto px-6 md:px-10 pb-20">
        <div className="min-h-[85vh] flex flex-col justify-end pb-20 md:pb-28">
          <div className="flex flex-col md:flex-row gap-8 md:gap-[38px] items-start md:items-end w-full pt-28 md:pt-0">
            {/* Poster skeleton */}
            <div className="flex-none w-[130px] sm:w-[150px] md:w-[180px] aspect-[2/3] rounded-[14px] bg-void-2 border border-white/[0.08] animate-pulse" />

            {/* Info skeleton */}
            <div className="flex-1 pb-1 max-w-[680px] w-full">
              {/* Type and genres */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-4 rounded bg-white/[0.06] animate-pulse" />
                <div className="w-24 h-4 rounded bg-white/[0.04] animate-pulse" />
                <div className="w-8 h-4 rounded bg-white/[0.04] animate-pulse" />
              </div>

              {/* Title */}
              <div className="h-14 sm:h-16 w-3/4 max-w-lg rounded-lg bg-white/[0.08] animate-pulse mb-[18px]" />

              {/* Overview */}
              <div className="space-y-2 mb-5">
                <div className="h-4 w-full rounded bg-white/[0.05] animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-white/[0.05] animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-white/[0.05] animate-pulse" />
              </div>

              {/* Chips */}
              <div className="flex items-center gap-3 mb-[26px]">
                <div className="w-12 h-5 rounded bg-white/[0.06] animate-pulse" />
                <div className="w-12 h-5 rounded bg-white/[0.06] animate-pulse" />
                <div className="w-16 h-5 rounded bg-white/[0.06] animate-pulse" />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <div className="w-36 h-12 rounded-[10px] bg-white/[0.1] animate-pulse" />
                <div className="w-12 h-12 rounded-[10px] bg-white/[0.05] animate-pulse" />
                <div className="w-12 h-12 rounded-[10px] bg-white/[0.05] animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
