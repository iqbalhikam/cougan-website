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

  const divisions = streamer.divisions || [];
  const isFams = divisions.includes('FAMS');
  const isSwag = divisions.includes('SWAG');
  const isDonn = divisions.includes('DONN');
  const isBusiness = divisions.includes('BUSINESS');
  
  const isOut = streamer.factionStatus === 'OUT';
  const isCk = streamer.factionStatus === 'CK';

  const isTikTok = streamer.channelId?.includes('tiktok.com') || streamer.channelId?.includes('tiktok');
  const isEmptyChannel = !streamer.channelId || streamer.channelId.trim() === '';
  
  const platformLink = isTikTok 
    ? streamer.channelId 
    : streamer.youtubeId 
      ? `https://youtube.com/watch?v=${streamer.youtubeId}`
      : streamer.channelId?.startsWith('UC') ? `https://youtube.com/channel/${streamer.channelId}` : `https://youtube.com/${streamer.channelId}`;
      
  const platformText = isTikTok ? 'TIKTOK' : dict.streamer.youtube;

  // Mafia / Syndicate Color Coding
  const getDivisionTheme = (type: string) => {
    switch(type) {
      case 'FAMS': return { color: 'text-amber-400', border: 'border-amber-400/50', bg: 'bg-amber-400' }; 
      case 'SWAG': return { color: 'text-red-600', border: 'border-red-600/50', bg: 'bg-red-600' }; 
      case 'DONN': return { color: 'text-yellow-600', border: 'border-yellow-600/50', bg: 'bg-yellow-600' }; 
      case 'BUSINESS': return { color: 'text-blue-400', border: 'border-blue-400/50', bg: 'bg-blue-400' };
      case 'CK': return { color: 'text-zinc-600', border: 'border-zinc-700/50', bg: 'bg-zinc-600' };
      case 'OUT': return { color: 'text-zinc-500', border: 'border-zinc-800/50', bg: 'bg-zinc-500' };
      default: return { color: 'text-zinc-400', border: 'border-zinc-800/50', bg: 'bg-zinc-400' };
    }
  };

  const renderDossierStamp = (label: string, type: string) => {
    const theme = getDivisionTheme(type);
    return (
      <div className={`flex items-center gap-2 px-2 py-1 border border-y-0 border-r-0 border-l-[3px] ${theme.border} bg-black/60 backdrop-blur-sm`}>
        <span className={`text-[8px] font-bold tracking-[0.3em] uppercase ${theme.color}`}>{label}</span>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      whileHover={{ y: -5 }} 
      className="group relative flex flex-col bg-background rounded-sm overflow-hidden border border-zinc-900 hover:border-zinc-700 transition-all duration-500 shadow-2xl"
    >
      {/* Dossier Portrait Section */}
      <div className="aspect-square relative w-full overflow-hidden bg-black">
        <Image 
          src={streamer.avatar || '/images/logo/swag.webp'} 
          alt={streamer.name} 
          width={500} 
          height={500} 
          unoptimized 
          className={`object-cover object-top w-full h-full transition-all duration-1000 group-hover:scale-105 ${
            isCk || isOut ? 'grayscale opacity-40 contrast-125' : 'grayscale-[0.85] contrast-[1.15] group-hover:grayscale-0'
          }`} 
        />
        
        {/* Deep shadow overlay to simulate dark room / dossier lighting */}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-black/20 opacity-90 group-hover:opacity-100 transition-opacity duration-700" />

        {/* SWAG Watermark Overlay */}
        {isSwag && (
          <div className="absolute bottom-6 right-4 w-20 h-20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none z-0 mix-blend-screen drop-shadow-2xl">
            <Image 
              src="/images/logo/swag.webp" 
              alt="SWAG Logo" 
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        )}

        {/* Top Stamps */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
          <div className="flex flex-col gap-1">
            {isFams && renderDossierStamp('FAMS', 'FAMS')}
            {isSwag && renderDossierStamp('SWAG', 'SWAG')}
            {isDonn && renderDossierStamp('DONN', 'DONN')}
            {isBusiness && renderDossierStamp('BUSINESS', 'BUSINESS')}
            {divisions.includes('MEMBER') && renderDossierStamp('MEMBER', 'MEMBER')}
            {isCk && renderDossierStamp('CK', 'CK')}
            {isOut && renderDossierStamp('OUT', 'OUT')}
          </div>
          
          {/* Live Indicator - Subtle but dangerous red */}
          {streamer.status === 'live' && (
            <div className="flex items-center gap-1.5 bg-black/80 px-2 py-1 border border-red-900/30 backdrop-blur-md">
              <div className="w-1 h-1 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse" />
              <span className="text-[8px] font-bold tracking-[0.3em] text-red-500 uppercase">{dict.streamer.live}</span>
            </div>
          )}
        </div>

        {/* Subject Identity */}
        <div className="absolute bottom-4 left-4 right-4 z-10 border-l-[3px] border-zinc-800 pl-3 group-hover:border-amber-700/50 transition-colors duration-700">
          <p className="text-[8px] tracking-[0.4em] uppercase text-zinc-500 mb-0.5 font-semibold">
            {streamer.role?.name || 'Classified'}
          </p>
          <h3 className="text-xl font-serif tracking-wide text-zinc-200 group-hover:text-white transition-colors duration-300 drop-shadow-2xl">
            {streamer.name}
          </h3>
        </div>
      </div>

      {/* Dossier Footer / Notes */}
      <div className="p-4 flex flex-col gap-3 flex-1 bg-background relative border-t border-zinc-900">
        
        {streamer.lore ? (
          <div className="relative">
            <span className="absolute -top-1.5 -left-1 text-lg text-zinc-800 font-serif leading-none">"</span>
            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed font-serif italic pl-2">
              {streamer.lore}
            </p>
          </div>
        ) : (
          <div className="h-6" /> // Spacer
        )}
        
        {/* Actions - Sharp and absolute bottom */}
        <div className="grid grid-cols-2 gap-0 mt-auto pt-3 border-t border-zinc-900">
          {isEmptyChannel || isTikTok ? (
            <div className="w-full border-r border-zinc-900 cursor-not-allowed">
              <Button disabled variant="ghost" size="sm" className="w-full rounded-none text-zinc-600 font-medium tracking-[0.2em] uppercase text-[8px] h-8">
                {dict.streamer.watchLive}
              </Button>
            </div>
          ) : (
            <Link href={`/watch/${streamer.id}`} className="w-full border-r border-zinc-900">
              <Button variant="ghost" size="sm" className="w-full rounded-none hover:bg-zinc-900 text-zinc-300 hover:text-white font-medium tracking-[0.2em] uppercase text-[8px] h-8 transition-all duration-300">
                {dict.streamer.watchLive}
              </Button>
            </Link>
          )}
          {isEmptyChannel ? (
            <div className="w-full cursor-not-allowed">
              <Button disabled variant="ghost" size="sm" className="w-full rounded-none text-zinc-600 font-medium tracking-[0.2em] uppercase text-[8px] h-8">
                {platformText}
              </Button>
            </div>
          ) : (
            <a href={platformLink} target="_blank" rel="noopener noreferrer" className="w-full">
              <Button variant="ghost" size="sm" className="w-full rounded-none hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 font-medium tracking-[0.2em] uppercase text-[8px] h-8 transition-all duration-300">
                {platformText}
              </Button>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
