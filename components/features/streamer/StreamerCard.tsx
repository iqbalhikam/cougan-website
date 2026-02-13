'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Streamer } from '@/types';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

import { useLanguage } from '@/components/providers/LanguageProvider';

interface StreamerCardProps {
  streamer: Streamer;
}

export function StreamerCard({ streamer }: StreamerCardProps) {
  const { dict } = useLanguage();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -5 }} className="group relative overflow-hidden rounded-xl bg-zinc-900 border border-white/5 hover:border-gold/50 transition-colors">
      <div className="aspect-square relative w-full overflow-hidden bg-zinc-800">
        <Image src={streamer.avatar} alt={streamer.name} width={500} height={500} unoptimized className="object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1">{streamer.name}</h3>
          <p className="text-sm text-gold font-medium uppercase tracking-wider">{streamer.role}</p>
        </div>

        {streamer.status === 'live' && <div className="absolute top-4 right-4 px-2 py-1 bg-red-600 rounded text-xs font-bold text-white uppercase animate-pulse">{dict.streamer.live}</div>}
      </div>

      <div className="p-4 bg-zinc-900">
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/watch/${streamer.id}`} className="w-full">
            <Button variant="gold" size="sm" className="w-full">
              {dict.streamer.watchLive}
            </Button>
          </Link>
          <a href={`https://youtube.com/watch?v=${streamer.youtubeId}`} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button variant="outline" size="sm" className="w-full bg-transparent border-zinc-700 text-zinc-300 hover:text-white hover:border-white">
              {dict.streamer.youtube}
            </Button>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
