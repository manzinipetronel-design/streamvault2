'use client';

import React, { useEffect } from 'react';

type SkelWindow = Window & { __svSkel?: number };

export default function SkeletonShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const windowWithSkeletons = window as SkelWindow;
    windowWithSkeletons.__svSkel = (windowWithSkeletons.__svSkel || 0) + 1;
    return () => {
      windowWithSkeletons.__svSkel = Math.max(0, (windowWithSkeletons.__svSkel || 1) - 1);
      setTimeout(() => {
        if (!windowWithSkeletons.__svSkel) window.dispatchEvent(new Event('route-ready'));
      }, 0);
    };
  }, []);

  return <>{children}</>;
}
