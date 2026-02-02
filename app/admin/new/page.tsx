import { StreamerForm } from '@/components/admin/StreamerForm';

export default function NewStreamerPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center ">
      <h2 className="text-3xl font-bold mb-8">Add New Member</h2>
      <StreamerForm />
    </div>
  );
}
