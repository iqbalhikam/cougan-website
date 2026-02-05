import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/layout/Hero';
import { StreamerCard } from '@/components/features/streamer/StreamerCard';
import { getStreamers } from '@/lib/getStreamers';

import { CouganHistoryBook } from '@/components/features/history/CouganHistoryBook';

export const revalidate = 120; // Revalidate every 2 minutes (reduced from 60s)

export default async function Home() {
  const streamers = await getStreamers();
  return (
    <main className="min-h-screen bg-black scroll-smooth pt-16">
      <Navbar />
      <Hero />

      <CouganHistoryBook />

      <section id="members" className="py-20 px-4 md:px-8 pt-20 max-w-7xl mx-auto">
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            The <span className="text-gold">Family</span> Members
          </h2>
          <p className="text-zinc-400 max-w-2xl">Watch the live perspectives of every Cougan family member. Choose your POV or watch them all at once in Multi-View.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {streamers.map((streamer) => (
            <StreamerCard key={streamer.id} streamer={streamer} />
          ))}
        </div>
      </section>
      <footer className="py-10 border-t border-white/10 text-center text-zinc-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Cougan Fams. All rights reserved.</p>
      </footer>
    </main>
  );
}
