import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-violet animate-spin" />
        <p className="text-xs text-muted font-medium tracking-wider uppercase">
          Loading page...
        </p>
      </div>
    </div>
  );
}
