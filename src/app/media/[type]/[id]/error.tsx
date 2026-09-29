'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function MediaDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Media detail page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-void text-foreground px-6">
      <div className="text-center max-w-md p-8 rounded-2xl bg-void-2 border border-glass-border shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-bold mb-2">Unable to Load Title</h2>
        <p className="text-xs text-muted leading-relaxed mb-6">
          An unexpected error occurred while loading this media item. You can retry or browse other titles.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-violet hover:bg-violet-light text-white transition-all cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] border border-glass-border text-foreground transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
