'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Streamer } from '@/types';
import { StreamerCard } from '@/components/features/streamer/StreamerCard';
import { supabase } from '@/lib/supabase/client';

interface RealtimeStreamerListProps {
  initialStreamers: Streamer[];
}

export function RealtimeStreamerList({ initialStreamers }: RealtimeStreamerListProps) {
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel('streamer-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'streamers',
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {initialStreamers.map((streamer) => (
        <StreamerCard key={streamer.id} streamer={streamer} />
      ))}
    </div>
  );
}
