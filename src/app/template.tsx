'use client';

import React, { useEffect } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  // Tells RouteProgressBar (mounted in layout.tsx, so it persists across
  // navigations) that the new route has actually mounted — this is what
  // lets the bar complete on a real signal instead of a guessed timeout.
  useEffect(() => {
    window.dispatchEvent(new Event('route-ready'));
  }, []);

  return <div className="page-enter">{children}</div>;
}
