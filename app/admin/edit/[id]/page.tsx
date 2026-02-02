import { StreamerForm } from '@/components/admin/StreamerForm';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function EditStreamerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const streamer = await prisma.streamer.findUnique({
    where: { id },
  });

  if (!streamer) {
    redirect('/admin');
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <h2 className="text-3xl font-bold mb-8">Edit Member</h2>
      <StreamerForm initialData={streamer} isEdit />
    </div>
  );
}
