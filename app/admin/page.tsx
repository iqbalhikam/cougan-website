import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getStreamersDA } from '@/lib/actions/streamers';
import { SortableStreamerList } from '@/components/admin/SortableStreamerList';
import { MusicManager } from '@/components/admin/MusicManager';

export default async function AdminDashboard() {
  const streamers = await getStreamersDA();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Streamer Management</h2>
        <Link href="/admin/new">
          <Button className="bg-gold text-black hover:bg-yellow-500">Add New Member</Button>
        </Link>
      </div>

      <SortableStreamerList initialStreamers={streamers} />

      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Backsound Management</h1>
          <p className="text-zinc-400">Upload file MP3 (max 5MB) untuk diputar di halaman utama. Maksimal 15 lagu.</p>
        </div>

        <MusicManager />
      </div>
    </div>
  );
}
