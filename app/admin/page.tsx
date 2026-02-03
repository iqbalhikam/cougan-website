import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getStreamersDA } from '@/lib/actions/streamers';
import { getBacksounds } from '@/lib/actions/backsound';
import { SortableStreamerList } from '@/components/admin/SortableStreamerList';
import { BacksoundManager } from '@/components/admin/BacksoundManager';

export default async function AdminDashboard() {
  const streamers = await getStreamersDA();
  const backsounds = await getBacksounds();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Streamer Management</h2>
        <Link href="/admin/new">
          <Button className="bg-gold text-black hover:bg-yellow-500">Add New Member</Button>
        </Link>
      </div>

      <SortableStreamerList initialStreamers={streamers} />

      <div className="mt-12 mb-8">
        <h2 className="text-3xl font-bold mb-6">Backsound Management</h2>
        <BacksoundManager initialBacksounds={backsounds} />
      </div>
    </div>
  );
}
