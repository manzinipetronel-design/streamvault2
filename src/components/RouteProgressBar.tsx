'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Slim top-of-viewport progress bar for route transitions — the same idea
// as GitHub/YouTube/Vercel's own loading bar. Next.js App Router doesn't
// expose real fetch-progress for a navigation, so this uses an honest
// two-signal approach instead of a blind timeout:
//   1. START: fires the instant the URL changes (usePathname/useSearchParams)
//   2. DONE: fires when the new route's `template.tsx` actually mounts —
//      dispatched as a real DOM event from template.tsx itself, so "done"
//      reflects the new page genuinely being in the tree, not a guess.
export default function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const creepTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // START — a new navigation began.
  useEffect(() => {
    // Skip on initial mount: this is the first paint, not a transition.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (creepTimer.current) clearInterval(creepTimer.current);

    setVisible(true);
    setProgress(20); // instant jump so it feels responsive, not laggy

    // Creep toward 85% while we wait for the real "done" signal — never
    // completes on its own, since only the mount event should do that.
    creepTimer.current = setInterval(() => {
      setProgress((p) => (p < 85 ? p + (85 - p) * 0.1 : p));
    }, 200);

    return () => {
      if (creepTimer.current) clearInterval(creepTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // DONE — the new route's template.tsx has actually mounted.
  useEffect(() => {
    function handleRouteReady() {
      if (creepTimer.current) clearInterval(creepTimer.current);
      setProgress(100);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 220); // let the 100% state paint before fading out
    }

    window.addEventListener('route-ready', handleRouteReady);
    return () => window.removeEventListener('route-ready', handleRouteReady);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-violet-500 to-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.7)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '150ms' : '300ms',
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
