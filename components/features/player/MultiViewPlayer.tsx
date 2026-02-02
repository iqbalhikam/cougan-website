'use client';

import { useState, useEffect } from 'react';
import { Streamer } from '@/types';
import { X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiViewPlayerProps {
  initialStreamers: Streamer[];
}

export function MultiViewPlayer({ initialStreamers }: MultiViewPlayerProps) {
  // Start with empty or first streamer? Let's start with empty so user can choose.
  // Fetch streamers from API to get live status
  const [streamerData, setStreamerData] = useState<Streamer[]>(initialStreamers);

  useEffect(() => {
    const fetchStreamers = async () => {
      try {
        const res = await fetch('/api/streamers');
        if (res.ok) {
          const data = await res.json();
          setStreamerData(data);
        }
      } catch (error) {
        console.error('Failed to fetch streamer data', error);
      }
    };

    fetchStreamers();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStreamers, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const [activeStreamers, setActiveStreamers] = useState<string[]>([]);

  const toggleStreamer = (id: string) => {
    if (activeStreamers.includes(id)) {
      setActiveStreamers((prev) => prev.filter((s) => s !== id));
    } else {
      // Limit to 4 for performance/layout reasons
      if (activeStreamers.length < 4) {
        setActiveStreamers((prev) => [...prev, id]);
      }
    }
  };

  // Dynamic grid class based on count
  const getGridClass = (count: number) => {
    switch (count) {
      case 1:
        return 'grid-cols-1 h-[80vh]';
      case 2:
        return 'grid-cols-1 md:grid-cols-2 h-[80vh]';
      case 3:
      case 4:
        return 'grid-cols-1 md:grid-cols-2 h-auto md:h-[80vh] grid-rows-2';
      default:
        return 'grid-cols-1';
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 bg-zinc-900/50 p-4 rounded-lg border border-white/5">
        <div className="flex items-center gap-2 text-white font-medium mr-auto">
          <Users className="text-gold" />
          <span>Active Streams ({activeStreamers.length}/4)</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {streamerData.map((s) => {
            const isActive = activeStreamers.includes(s.id);
            const isLive = s.status === 'live';
            return (
              <button
                key={s.id}
                onClick={() => toggleStreamer(s.id)}
                disabled={!isActive && (activeStreamers.length >= 4 || !isLive)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-2',
                  isActive
                    ? 'bg-gold text-black border-gold hover:bg-gold-dim'
                    : isLive
                      ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-gold hover:text-white'
                      : 'bg-zinc-900 text-zinc-600 border-zinc-800 opacity-50 cursor-not-allowed',
                )}>
                <span className={cn('w-2 h-2 rounded-full', isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500')} />
                {isActive ? 'Hide' : 'Add'} {s.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Grid */}
      <div className={cn('grid gap-4 w-full transition-all duration-300', getGridClass(activeStreamers.length))}>
        {activeStreamers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] bg-zinc-900/30 rounded-xl border border-dashed border-zinc-700">
            <Users className="w-16 h-16 text-zinc-600 mb-4" />
            <h3 className="text-xl text-zinc-400 font-medium">Select a family member to start watching</h3>
            <p className="text-zinc-600">Select up to 4 streams simultaneously</p>
          </div>
        ) : (
          activeStreamers.map((id) => {
            const streamer = streamerData.find((s) => s.id === id);
            if (!streamer) return null;
            return (
              <div key={id} className="relative w-full h-full min-h-[300px] bg-black rounded-lg overflow-hidden border border-zinc-800 group">
                {/* Remove Button Overlay */}
                <button onClick={() => toggleStreamer(id)} className="absolute top-2 right-2 z-10 bg-black/60 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-black transition-all opacity-0 group-hover:opacity-100">
                  <X size={16} />
                </button>

                <iframe
                  className="w-full h-full absolute inset-0"
                  src={`https://www.youtube.com/embed/${streamer.youtubeId}?autoplay=1&mute=1`}
                  title={streamer.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />

                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-white font-bold drop-shadow-md">{streamer.name}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
