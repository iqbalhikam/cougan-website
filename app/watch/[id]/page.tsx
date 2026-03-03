import { Navbar } from '@/components/layout/Navbar';
import { getStreamers } from '@/lib/getStreamers'; // Import for dynamic data
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, VideoOff } from 'lucide-react';

export const revalidate = 0; // Force dynamic to ensure live status is checked on every navigation

// In Next.js 15, params is a Promise.
interface WatchPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateStaticParams() {
  const streamers = await getStreamers();
  return streamers.map((streamer) => ({
    id: streamer.id,
  }));
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { id } = await params;

  // Fetch fresh data to get status and youtubeId
  const allStreamers = await getStreamers();
  const streamer = allStreamers.find((s) => s.id === id);

  if (!streamer) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black flex flex-col pt-16">
      <Navbar />

      <div className="flex-1 container mx-auto p-4 pt-20 flex flex-col items-center">
        <div className="w-full max-w-6xl">
          <Link href="/" className="inline-flex items-center text-zinc-400 hover:text-gold mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Family
          </Link>

          <div className="aspect-video w-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl shadow-gold/5 mb-6 relative group">
            {streamer.status === 'live' && streamer.youtubeId ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${streamer.youtubeId}?autoplay=1`}
                title={streamer.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50">
                <VideoOff className="w-16 h-16 text-zinc-700 mb-4" />
                <h3 className="text-xl font-bold text-zinc-500">Stream is Offline</h3>
                <p className="text-zinc-600 mt-2">Waiting for {streamer.name} to go live...</p>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900/50 p-6 rounded-xl border border-white/5">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{streamer.name}</h1>
              <div className="flex items-center gap-3">
                <span className="bg-gold text-black px-3 py-1 rounded text-sm font-bold uppercase">{streamer.role?.name || 'Unknown'}</span>
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
