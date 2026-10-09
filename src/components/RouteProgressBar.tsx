'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// START on internal clicks as well as URL changes. DONE only when the new
// route is ready, with a failsafe so a navigation can never leave it stuck.
export default function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const isVisible = useRef(false);
  const creep = useRef<ReturnType<typeof setInterval> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failsafe = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  const clearTimers = useCallback(() => {
    if (creep.current) clearInterval(creep.current);
    if (hide.current) clearTimeout(hide.current);
    if (failsafe.current) clearTimeout(failsafe.current);
  }, []);

  const done = useCallback(() => {
    if (!isVisible.current) return;
    clearTimers();
    setProgress(100);
    hide.current = setTimeout(() => {
      isVisible.current = false;
      setVisible(false);
      setProgress(0);
    }, 280);
  }, [clearTimers]);

  const start = useCallback(() => {
    clearTimers();
    isVisible.current = true;
    setVisible(true);
    setProgress((current) => (current > 0 && current < 100 ? current : 8));
    creep.current = setInterval(() => {
      setProgress((current) =>
        current < 90 ? current + (90 - current) * 0.08 : current
      );
    }, 180);
    failsafe.current = setTimeout(done, 15000);
  }, [clearTimers, done]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    }

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [start]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    start();
  }, [pathname, searchParams, start]);

  useEffect(() => {
    window.addEventListener('route-ready', done);
    return () => window.removeEventListener('route-ready', done);
  }, [done]);

  useEffect(() => clearTimers, [clearTimers]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none" aria-hidden="true">
      <div
        className="relative h-full bg-gradient-to-r from-violet via-violet-light to-cyan shadow-[0_0_14px_rgba(123,47,255,0.85)] transition-[width,opacity] ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '200ms' : '300ms',
          opacity: progress === 100 ? 0 : 1,
        }}
      >
        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-r from-transparent to-white/70" />
      </div>
    </div>
  );
}
