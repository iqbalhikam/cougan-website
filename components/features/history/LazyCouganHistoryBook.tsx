'use client';

import dynamic from 'next/dynamic';

const CouganHistoryBook = dynamic(() => import('@/components/features/history/CouganHistoryBook').then((mod) => mod.CouganHistoryBook), {
  ssr: false,
  loading: () => <div className="hidden md:flex min-h-[700px] w-full items-center justify-center text-gold/20 animate-pulse">Loading Archives...</div>,
});

export function LazyCouganHistoryBook() {
  return <CouganHistoryBook />;
}
