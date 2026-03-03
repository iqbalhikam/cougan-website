'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

interface ChatMessage {
  id: string;
  snippet: {
    displayMessage: string;
    publishedAt: string;
    type: string;
  };
  authorDetails: {
    displayName: string;
    profileImageUrl: string;
    isVerified: boolean;
    isChatOwner: boolean;
    isChatSponsor: boolean;
    isChatModerator: boolean;
  };
}

interface ChatOverlayProps {
  chatId: string;
  isChatOpen: boolean;
  onToggleChat: () => void;
  bubbleSize?: 'small' | 'medium' | 'large';
  bubbleOpacity?: number;
  bubbleBgOpacity?: number;
}

export function ChatOverlay({ chatId, isChatOpen, onToggleChat, bubbleSize = 'medium', bubbleOpacity = 1, bubbleBgOpacity = 0.6 }: ChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Ref polling logic
  const tokenRef = useRef<string | null>(null);

  // Size configuration
  const sizeConfig = {
    small: {
      container: 'py-1 px-2 max-w-[50%]',
      avatar: 16,
      avatarClass: 'w-4 h-4',
      name: 'text-[9px] mb-0',
      message: 'text-[10px] leading-tight',
      gap: 'gap-1.5',
    },
    medium: {
      container: 'py-1.5 px-3 max-w-[60%] md:max-w-[80%]',
      avatar: 20,
      avatarClass: 'w-5 h-5',
      name: 'text-[10px] mb-0.5',
      message: 'text-xs leading-tight',
      gap: 'gap-2',
    },
    large: {
      container: 'py-2 px-4 max-w-[70%] md:max-w-[90%]',
      avatar: 28,
      avatarClass: 'w-7 h-7',
      name: 'text-xs mb-0.5',
      message: 'text-sm leading-snug',
      gap: 'gap-3',
    },
  };

  const config = sizeConfig[bubbleSize];

  useEffect(() => {
    let isActive = true;

    // Keep polling even if chat is open, as requested
    // if (isChatOpen) return;

    const fetchChat = async () => {
      if (!isActive) return;
      try {
        const params = new URLSearchParams({ chatId });
        if (tokenRef.current) params.append('pageToken', tokenRef.current);

        const res = await fetch(`/api/chat?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (!isActive) return;

          if (data.nextPageToken) {
            tokenRef.current = data.nextPageToken;
          }
          if (data.items && data.items.length > 0) {
            setMessages((prev) => {
              const newMsgs = data.items.filter((newMsg: ChatMessage) => !prev.some((oldMsg) => oldMsg.id === newMsg.id));
              return [...prev, ...newMsgs].slice(-8); // Keep last 8 bubbles
            });
          }
        }
      } catch (err) {
        console.error('Chat fetch error:', err);
      }
    };

    // Initial fetch
    fetchChat();
    // Poll every 5 seconds
    const interval = setInterval(fetchChat, 5000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [chatId, isChatOpen]);

  // Remove old messages periodically to keep DOM light
  useEffect(() => {
    if (messages.length === 0) return;

    const timer = setInterval(() => {
      setMessages((prev) => {
        return prev;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="absolute inset-0 flex flex-col justify-end pointer-events-none px-4 mask-image-gradient pb-14 transition-all duration-300">
      <div style={{ opacity: bubbleOpacity }} className="flex flex-col items-start space-y-2 overflow-hidden justify-end pb-2 min-h-[200px]">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              style={{
                backgroundColor: `rgba(0, 0, 0, ${bubbleBgOpacity})`,
              }}
              className={`backdrop-blur-md rounded-full flex items-center shadow-lg border border-white/10 ${config.container} ${config.gap}`}>
              <Image src={msg.authorDetails.profileImageUrl} alt={msg.authorDetails.displayName} width={config.avatar} height={config.avatar} className={`rounded-full border border-white/20 ${config.avatarClass}`} />
              <div className="flex flex-col">
                <span className={`font-bold text-white/70 leading-none ${config.name}`}>{msg.authorDetails.displayName}</span>
                <span className={`text-white font-medium drop-shadow-sm line-clamp-2 ${config.message}`}>{msg.snippet.displayMessage}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="pointer-events-auto mt-2">
        <button onClick={onToggleChat} className="bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 transition-colors shadow-lg group">
          <span className={`w-2 h-2 rounded-full ${isChatOpen ? 'bg-red-500' : 'bg-green-500'} animate-pulse group-hover:bg-opacity-80`} />
          {isChatOpen ? 'Close Chat' : 'Join Chat'}
        </button>
      </div>

      <div className="absolute top-0 left-0 right-0 h-10 bg-linear-to-b from-transparent to-transparent pointer-events-none" />
    </div>
  );
}
