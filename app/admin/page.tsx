import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getStreamersDA } from '@/lib/actions/streamers';
import { SortableStreamerList } from '@/components/admin/SortableStreamerList';

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
    </div>
  );
}
