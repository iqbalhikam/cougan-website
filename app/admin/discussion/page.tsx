import { getDiscussions } from "@/lib/actions/discussion";
import RealtimeAdminDiscussionFeed from "@/components/admin/RealtimeAdminDiscussionFeed";

export const metadata = {
  title: "Manage Discussions | Admin",
};

export default async function AdminDiscussionPage() {
  const threads = await getDiscussions();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold text-white">Moderate Discussions</h1>
      </div>

      <RealtimeAdminDiscussionFeed initialDiscussions={threads} />
    </div>
  );
}
