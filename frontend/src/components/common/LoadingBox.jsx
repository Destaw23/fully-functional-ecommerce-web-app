import React from 'react';

export default function LoadingBox() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative h-11 w-11">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
      <p className="text-sm font-medium text-slate-500">Loading...</p>
      <span className="sr-only">Loading</span>
    </div>
  );
}
