import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/layout/Hero';

import { getStreamers } from '@/lib/getStreamers';

import dynamic from 'next/dynamic';

import { LazyCouganHistoryBook } from '@/components/features/history/LazyCouganHistoryBook';
import { LazyGallery } from '@/components/features/LazyGallery';

const RealtimeStreamerList = dynamic(() => import('@/components/features/streamer/RealtimeStreamerList').then((mod) => mod.RealtimeStreamerList), {
  loading: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="aspect-square bg-zinc-900/50 rounded-xl animate-pulse border border-white/5" />
      ))}
    </div>
  ),
});

import { HomeHeader } from '@/components/features/home/HomeHeader';
import { Footer } from '@/components/layout/Footer';

export const revalidate = 120; // Revalidate every 2 minutes (reduced from 60s)

export default async function Home() {
  const streamers = await getStreamers();
  return (
    <main className="min-h-screen bg-black scroll-smooth pt-12 md:pt-16">
      <Navbar />
      <Hero />

      <LazyCouganHistoryBook />

      <LazyGallery />

      <section id="members" className="py-12 md:py-20 px-4 md:px-8 pt-12 md:pt-20 max-w-7xl mx-auto">
        <HomeHeader />

        <RealtimeStreamerList initialStreamers={streamers} />
      </section>
      <Footer />
    </main>
  );
}
