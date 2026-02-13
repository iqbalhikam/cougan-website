import { Navbar } from '@/components/layout/Navbar';
import { MultiViewPlayer } from '@/components/features/player/MultiViewPlayer';
import { getStreamers } from '@/lib/getStreamers';

import { MultiviewHeader } from '@/components/features/multiview/MultiviewHeader';

export const revalidate = 60;

export default async function MultiViewPage() {
  const streamers = await getStreamers();

  return (
    <main className="min-h-screen bg-black flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto p-4 pt-36">
        <MultiviewHeader />
        <MultiViewPlayer initialStreamers={streamers} />
      </div>
    </main>
  );
}
