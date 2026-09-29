'use client';
import React, { Suspense } from 'react';
import ListsContent from './ListsContent';
import Header from '@/components/Header';

export default function ListsPage() {
  return (
    <Suspense
      fallback={
        <main style={{ backgroundColor: '#0D0D0D', color: '#F0F0F0', minHeight: '100vh' }}>
          <Header />
          <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
            <div
              className="w-12 h-12 rounded-full border-2 animate-spin"
              style={{ borderColor: '#7B2FFF', borderTopColor: 'transparent' }}
            />
          </div>
        </main>
      }
    >
      <ListsContent />
    </Suspense>
  );
}
