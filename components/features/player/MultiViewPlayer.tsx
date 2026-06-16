'use client';

import { useState, useEffect } from 'react';
import { Streamer } from '@/types';
import { X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatOverlay } from '@/components/features/player/ChatOverlay';

import { useLanguage } from '@/components/providers/LanguageProvider';

interface MultiViewPlayerProps {
  initialStreamers: Streamer[];
}

export function MultiViewPlayer({ initialStreamers }: MultiViewPlayerProps) {
  const { dict } = useLanguage();
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
      // Limit to 10 for performance/layout reasons
      if (activeStreamers.length < 10) {
        setActiveStreamers((prev) => [...prev, id]);
      }
    }
  };

  // Dynamic grid class based on count
  const getGridClass = (count: number) => {
    switch (true) {
      case count === 0:
        return 'grid-cols-1';
      case count === 1:
        return 'grid-cols-1 min-h-[40vh] md:min-h-[80vh]';
      case count === 2:
        return 'grid-cols-1 md:grid-cols-2 h-auto min-h-[40vh] md:min-h-[80vh]';
      case count <= 4:
        return 'grid-cols-1 md:grid-cols-2 h-auto min-h-[80vh]';
      case count <= 6:
        return 'grid-cols-1 md:grid-cols-3 h-auto min-h-[80vh]';
      case count <= 8:
        return 'grid-cols-1 md:grid-cols-4 h-auto min-h-[80vh]';
      default:
        // 9-10 items
        return 'grid-cols-1 md:grid-cols-5 h-auto min-h-[80vh]';
    }
  };

  // Track which chats are open
  const [openChats, setOpenChats] = useState<Record<string, boolean>>({});
  const [domain, setDomain] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDomain(window.location.hostname);
    }
  }, []);

  const toggleChat = (streamerId: string) => {
    setOpenChats((prev) => ({
      ...prev,
      [streamerId]: !prev[streamerId],
    }));
  };

  // Determine grid based on VISIBLE slots, but if chat is open, it takes vertical space.
  // The layout automatically flows.

  // Bubble Size State
  const [bubbleSize, setBubbleSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [bubbleOpacity, setBubbleOpacity] = useState(1);
  const [bubbleBgOpacity, setBubbleBgOpacity] = useState(0.6);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 bg-zinc-900/50 p-4 rounded-lg border border-white/5">
        <div className="flex items-center gap-2 text-white font-medium mr-auto">
          <Users className="text-gold" />
          <span>
            {dict.multiview.activeStreams} ({activeStreamers.length}/10)
          </span>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-colors', showSettings ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white')}>
          {showSettings ? 'Hide Settings' : 'Bubble Settings'}
        </button>

        {/* Extended Settings Panel */}
        {showSettings && (
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 pt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-2 basis-full order-last">
            {/* Size */}
            <div className="flex items-center gap-2 bg-zinc-800/30 rounded-lg p-2">
              <span className="text-xs text-zinc-400 w-12">Size:</span>
              <div className="flex gap-1">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setBubbleSize(size)}
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-md transition-colors capitalize border border-transparent',
                      bubbleSize === size ? 'bg-zinc-600 text-white border-zinc-500' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800',
                    )}>
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Overall Opacity */}
            <div className="flex items-center gap-2 bg-zinc-800/30 rounded-lg p-2">
              <span className="text-xs text-zinc-400 w-12">Opacity:</span>
              <input type="range" min="0.1" max="1" step="0.1" value={bubbleOpacity} onChange={(e) => setBubbleOpacity(parseFloat(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-gold" />
              <span className="text-xs text-zinc-500 w-8 text-right">{Math.round(bubbleOpacity * 100)}%</span>
            </div>

            {/* Background Opacity */}
            <div className="flex items-center gap-2 bg-zinc-800/30 rounded-lg p-2">
              <span className="text-xs text-zinc-400 w-16">BG Opacity:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={bubbleBgOpacity}
                onChange={(e) => setBubbleBgOpacity(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-gold"
              />
              <span className="text-xs text-zinc-500 w-8 text-right">{Math.round(bubbleBgOpacity * 100)}%</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {streamerData
            .filter((s) => s.channelId && s.channelId.trim() !== '' && !s.channelId.includes('tiktok'))
            .map((s) => {
            const isActive = activeStreamers.includes(s.id);
            const isLive = s.status === 'live';
            return (
              <button
                key={s.id}
                onClick={() => toggleStreamer(s.id)}
                disabled={!isActive && (activeStreamers.length >= 10 || !isLive)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors border flex items-center gap-2',
                  isActive
                    ? 'bg-gold text-black border-gold hover:bg-gold-dim'
                    : isLive
                      ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-gold hover:text-white'
                      : 'bg-zinc-900 text-zinc-600 border-zinc-800 opacity-50 cursor-not-allowed',
                )}>
                <span className={cn('w-1.5 h-1.5 md:w-2 md:h-2 rounded-full', isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500')} />
                {isActive ? dict.multiview.hide : dict.multiview.add} {s.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Grid */}
      <div className={cn('grid gap-2 md:gap-4 w-full transition-all duration-300', getGridClass(activeStreamers.length))}>
        {activeStreamers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[40vh] md:h-[50vh] bg-zinc-900/50 rounded-lg border border-white/5 border-dashed">
            <div className="p-4 rounded-full bg-white/5 mb-4">
              <Users className="w-8 h-8 md:w-16 md:h-16 text-gold/50" />
            </div>
            <h3 className="text-sm md:text-xl text-white font-medium mb-1">{dict.multiview.selectMember}</h3>
            <p className="text-xs md:text-base text-zinc-400">{dict.multiview.selectLimit}</p>
          </div>
        ) : (
          activeStreamers.map((id) => {
            const streamer = streamerData.find((s) => s.id === id);
            if (!streamer) return null;
            const isChatOpen = !!openChats[id];

            return (
              <div key={id} className="flex flex-col w-full h-full bg-black rounded-lg overflow-hidden border border-zinc-800 group">
                <div className="relative w-full aspect-video">
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

                  {/* Chat Overlay (Bubbles + Button) */}
                  {streamer.activeLiveChatId && (
                    <div className="absolute inset-0 z-20 pointer-events-none">
                      <ChatOverlay chatId={streamer.activeLiveChatId} isChatOpen={isChatOpen} onToggleChat={() => toggleChat(id)} bubbleSize={bubbleSize} bubbleOpacity={bubbleOpacity} bubbleBgOpacity={bubbleBgOpacity} />
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                    <span className="text-white font-bold drop-shadow-md">{streamer.name}</span>
                  </div>
                </div>

                {/* Expanded Chat Box (Vertical Stack) */}
                {isChatOpen && (
                  <div className="w-full h-[400px] border-t border-zinc-800 bg-zinc-900 transition-all duration-300 ease-in-out">
                    <iframe src={`https://www.youtube.com/live_chat?v=${streamer.youtubeId}&embed_domain=${domain}&dark_theme=1`} className="w-full h-full border-none" allowFullScreen />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
