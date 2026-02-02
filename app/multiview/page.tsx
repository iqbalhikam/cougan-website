import { Navbar } from '@/components/layout/Navbar';
import { MultiViewPlayer } from '@/components/features/player/MultiViewPlayer';
import { getStreamers } from '@/lib/getStreamers';

export const revalidate = 60;

export default async function MultiViewPage() {
  const streamers = await getStreamers();

  return (
    <main className="min-h-screen bg-black flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto p-4 pt-36">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Multi-View Command Center</h1>
          <p className="text-zinc-400">Monitor multiple family perspectives simultaneously.</p>
        </div>
        <MultiViewPlayer initialStreamers={streamers} />
      </div>
    </main>
  );
}
