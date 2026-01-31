import { Navbar } from '@/components/Navbar';
import { streamers } from '@/data/streamers';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// In Next.js 15, params is a Promise.
// But checking package.json, user has "next": "16.1.6" (Wait, 16? Next.js 15 is latest stable, maybe it's a canary or upcoming? Or I misread Step 9 input.
// Re-checking Step 9: "next": "16.1.6". Wait, Next.js 15 is current. 16 might be very new or user is on a specific version.
// Regardless, treating params as Promise is the safe forward-compatible way for App Router now.

interface WatchPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateStaticParams() {
  return streamers.map((streamer) => ({
    id: streamer.id,
  }));
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { id } = await params;
  const streamer = streamers.find((s) => s.id === id);

  if (!streamer) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black flex flex-col">
      <Navbar />

      <div className="flex-1 container mx-auto p-4 pt-20 flex flex-col items-center">
        <div className="w-full max-w-6xl">
          <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-gold mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Family
          </Link>

          <div className="aspect-video w-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl shadow-gold/5 mb-6">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${streamer.youtubeId}?autoplay=1`}
              title={streamer.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900/50 p-6 rounded-xl border border-white/5">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{streamer.name}</h1>
              <div className="flex items-center gap-3">
                <span className="bg-gold text-black px-3 py-1 rounded text-sm font-bold uppercase">{streamer.role}</span>
                {streamer.status === 'live' && (
                  <span className="flex items-center text-red-500 font-bold text-sm animate-pulse">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                    LIVE SIGNAL
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <a href={`https://youtube.com/watch?v=${streamer.youtubeId}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:border-red-600 hover:bg-red-600/10 transition-colors">
                  Open on YouTube
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
