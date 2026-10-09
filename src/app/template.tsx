'use client';

import React, { useEffect } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!(window as Window & { __svSkel?: number }).__svSkel) {
      window.dispatchEvent(new Event('route-ready'));
    }
  }, []);

  return <div className="page-enter">{children}</div>;
}
