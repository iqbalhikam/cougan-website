import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getStreamersDA } from '@/lib/actions/streamers';
import { SortableStreamerList } from '@/components/admin/SortableStreamerList';
import { MusicManager } from '@/components/admin/MusicManager';
import { GalleryManager } from '@/components/admin/GalleryManager';
import { signOut } from '@/lib/actions/auth';
import { getAdminRole } from '@/lib/admin-auth';
import { getAdmins } from '@/lib/actions/admin-management';
import { AdminManager } from '@/components/admin/AdminManager';

export default async function AdminDashboard() {
  const streamers = await getStreamersDA();
  const role = await getAdminRole();
  const admins = role === 'SUPER_ADMIN' ? await getAdmins() : [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex gap-4 w-full sm:w-auto">
          <Link href="/admin/new" className="w-full sm:w-auto">
            <Button className="bg-gold text-black hover:bg-yellow-500 w-full sm:w-auto">Add New Member</Button>
          </Link>
          <form action={signOut}>
            <Button variant="destructive" className="w-full sm:w-auto">
              Logout
            </Button>
          </form>
        </div>
      </div>
        
        <SortableStreamerList initialStreamers={streamers} />


      <div className="max-w-full mx-auto pt-8 ">


        <MusicManager />
      </div>

      <div className="max-w-full mx-auto pt-8 border-zinc-800">
        <GalleryManager />
      </div>

      {role === 'SUPER_ADMIN' && (
        <div className="max-w-full mx-auto pt-8 border-zinc-800">
          <AdminManager initialAdmins={admins} />
        </div>
      )}
    </div>
  );
}
