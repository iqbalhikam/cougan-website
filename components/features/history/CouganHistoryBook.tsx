'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, PanInfo, useMotionValue, useTransform, useAnimation, MotionValue } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

import { useLanguage } from '@/components/providers/LanguageProvider';

// --- Types & Data ---

// --- Sub-Component: Draggable Page ---
// We isolate the page logic to handle its own motion value state

interface PageProps {
  index: number;
  flippedIndex: number;
  totalSheets: number;
  onFlip: (dir: 'next' | 'prev') => void;

  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  isCover?: boolean;
}

const Page = ({ index, flippedIndex, totalSheets, onFlip, frontContent, backContent }: PageProps) => {
  const isFlipped = index < flippedIndex;

  // Motion Value for this specific page's rotation
  // If isFlipped (index < flippedIndex), target is -180. If not, 0.
  const rotateY = useMotionValue(isFlipped ? -180 : 0);
  const controls = useAnimation();

  // Sync state changes (when button is clicked externaly)
  useEffect(() => {
    controls.start({
      rotateY: isFlipped ? -180 : 0,
      transition: { duration: 0.8, ease: 'easeInOut' },
    });
  }, [isFlipped, controls]);

  const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Determine direction
    // If we are closed (0) -> Drag Left (negative x) rotates towards -180
    // If we are flipped (-180) -> Drag Right (positive x) rotates towards 0

    const current = rotateY.get();
    // Sensitivity factor
    const delta = info.delta.x * 0.4;

    let newRot = current + delta;

    // Clamp
    if (newRot > 0) newRot = 0;
    if (newRot < -180) newRot = -180;

    rotateY.set(newRot);
  };

  const handlePanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const current = rotateY.get();
    const velocity = info.velocity.x;

    // Thresholds to snap
    // If we are mostly open (> -90) and flicked left or passed -90 -> Go Next (-180)

    let target = isFlipped ? -180 : 0; // Default stay

    if (!isFlipped) {
      // Attempting to Open (0 -> -180)
      if (current < -40 || velocity < -50) {
        target = -180;
        onFlip('next'); // Notify parent state update
      } else {
        target = 0;
      }
    } else {
      // Attempting to CLose (-180 -> 0)
      if (current > -140 || velocity > 50) {
        target = 0;
        onFlip('prev');
      } else {
        target = -180;
      }
    }

    controls.start({ rotateY: target, transition: { type: 'spring', stiffness: 60, damping: 15 } });
  };

  // Dynamic Z-Index Calculation based on rotation
  // If rot > -90, it belongs to "Right Stack" order.
  // If rot < -90, it belongs to "Left Stack" order.
  const zIndex = useTransform(rotateY, (rot) => {
    if (rot > -90) return totalSheets + 1 - index; // 0deg (Right)
    return index; // -180deg (Left)
  });

  return (
    <motion.div
      className="absolute top-0 bottom-0 left-1/2 w-1/2 origin-left cursor-grab active:cursor-grabbing select-none"
      style={{
        transformStyle: 'preserve-3d',
        rotateY: rotateY as MotionValue<number>,
        zIndex,
      }}
      animate={controls} // Allow both drag and state animation
      onPan={handlePan}
      onPanEnd={handlePanEnd}>
      {/* Front Face */}
      <div className="absolute inset-0 backface-hidden select-none" style={{ backfaceVisibility: 'hidden' }}>
        {frontContent}
        <motion.div className="absolute inset-0 bg-black pointer-events-none select-none" style={{ opacity: useTransform(rotateY, [0, -180], [0, 0.6]) }} />
      </div>

      {/* Back Face */}
      <div className="absolute inset-0 backface-hidden select-none" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
        {backContent}
        <motion.div className="absolute inset-0 bg-black pointer-events-none select-none" style={{ opacity: useTransform(rotateY, [-180, 0], [0, 0.6]) }} />
      </div>
    </motion.div>
  );
};

// --- Main Component ---

export function CouganHistoryBook() {
  const { dict } = useLanguage();
  const historyChapters = dict.history.chapters;
  const [flippedIndex, setFlippedIndex] = useState(0);

  const totalSheets = historyChapters.length + 1;

  const handleFlip = (dir: 'next' | 'prev') => {
    if (dir === 'next' && flippedIndex <= totalSheets) {
      setFlippedIndex((prev) => prev + 1);
    } else if (dir === 'prev' && flippedIndex > 0) {
      setFlippedIndex((prev) => prev - 1);
    }
  };

  const nextPage = () => handleFlip('next');
  const prevPage = () => handleFlip('prev');

  // Visual Curl Style
  const curlStyle = {
    backgroundImage: `linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.3) 50%, rgba(255,255,255,0.4) 55%, transparent 60%)`,
    position: 'absolute' as const,
    right: 0,
    bottom: 0,
    width: '100px',
    height: '100px',
    pointerEvents: 'none' as const,
    zIndex: 50,
    opacity: 0.6,
  };

  const paperStyle = {
    backgroundColor: '#0a0a0a',
    backgroundImage: `
      linear-gradient(to right, rgba(255,255,255,0.02) 0%, transparent 5%, transparent 95%, rgba(255,255,255,0.02) 100%),
      repeating-linear-gradient(to right, transparent 0, transparent 2px, rgba(255,255,255,0.01) 3px),
      radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02), transparent 60%)
    `,
    boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8)',
    backgroundSize: '100% 100%, 4px 100%, 100% 100%',
    backgroundBlendMode: 'screen',
  };

  const leatherStyle = {
    backgroundColor: '#050505',
    backgroundImage: `
      radial-gradient(circle at 30% 30%, rgba(255,255,255,0.02), transparent 25%), 
      radial-gradient(circle at 70% 80%, rgba(255,255,255,0.01), transparent 20%),
      linear-gradient(to bottom right, #000000, #0a0a0a)
    `,
    backgroundBlendMode: 'screen',
    boxShadow: 'inset 0 0 50px rgba(0,0,0,0.9), 5px 10px 20px rgba(0,0,0,0.8)',
  };

  const goldTextStyle = {
    color: '#ffffff',
    textShadow: '0px 1px 0px rgba(255,255,255,0.1), 0px -1px 0px rgba(0,0,0,0.8)',
    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.8))',
  };

  return (
    <section className="relative w-full mx-auto py-8 md:py-12 hidden md:flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px] select-none overflow-hidden">
      {/* Atmosphere */}
      <div className="absolute inset-0 z-0 bg-radial-[circle_at_center,transparent_10%,rgba(0,0,0,0.85)_90%] pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-4xl mx-auto px-4 mb-8 z-10 relative select-none pointer-events-none text-left flex items-center gap-4">
        <div className="w-8 md:w-16 h-[2px] bg-zinc-700" />
        <h2 className="text-lg md:text-2xl font-serif text-zinc-200 tracking-[0.2em] uppercase shrink-0">The Archives</h2>
        <div className="flex-1 h-px bg-zinc-900" />
      </div>

      {/* 3D Scene Container */}
      <motion.div
        animate={{
          x: flippedIndex === 0 ? '-25%' : flippedIndex > totalSheets ? '25%' : '0%',
          scale: typeof window !== 'undefined' && window.innerWidth < 768 ? 0.9 : 0.85,
        }}
        transition={{
          duration: 0.8,
          ease: 'easeInOut',
        }}
        className="relative perspective-distant md:perspective-[2000px] w-[95%] md:w-full max-w-lg md:max-w-4xl aspect-[0.7/1] md:aspect-[1.6/1] z-20 drop-shadow-2xl">
        <div className="absolute top-0 bottom-0 left-1/2 w-8 md:w-12 -ml-4 md:-ml-6 bg-[#0a0a0a] transform translate-z-[-2px] rounded-sm" style={{ boxShadow: '0 0 10px rgba(0,0,0,0.8)' }} />

        {/* 1. FRONT COVER */}
        <Page
          index={0}
          flippedIndex={flippedIndex}
          totalSheets={totalSheets}
          onFlip={handleFlip}
          frontContent={
            <div className="absolute inset-0 flex flex-col items-center justify-center border-y-2 md:border-y-4 border-r-2 md:border-r-4 border-[#1a0a0a] rounded-r-md shadow-2xl select-none" style={leatherStyle}>
              {/* Spine Crease */}
              <div className="absolute left-0 top-0 bottom-0 w-3 md:w-6 bg-linear-to-r from-black/80 to-transparent z-20" />

              <div style={curlStyle} />
              <div className="absolute inset-0 opacity-60 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/black-leather.png')]" />

              {/* Embossed Border */}
              <div className="absolute inset-2 md:inset-4 border-2 border-zinc-800/50 rounded-sm shadow-[inset_1px_1px_2px_rgba(0,0,0,0.9),1px_1px_2px_rgba(255,255,255,0.02)]" />
              <div className="absolute inset-4 md:inset-6 border border-zinc-800/30 rounded-sm" />

              <div className="relative z-10 text-center p-4 md:p-8">
                <div className="relative inline-block mx-auto mb-4 md:mb-8">
                  <Image
                    src="/LOGO-COUGAN.gif"
                    alt="Cougan Family"
                    width={160}
                    height={160}
                    className="relative z-10 opacity-70 pointer-events-none grayscale contrast-125 select-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] w-24 h-24 md:w-40 md:h-40 object-contain"
                    unoptimized
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-black blur-2xl opacity-50 rounded-full" />
                </div>
                <h1 className="text-2xl md:text-4xl lg:text-6xl font-serif tracking-widest uppercase mb-2 pointer-events-none" style={goldTextStyle}>
                  Cougan
                </h1>
                <div className="w-20 md:w-32 h-px mx-auto mb-2 md:mb-4 bg-zinc-800" />
                <p className="text-zinc-600 font-sans tracking-[0.3em] md:tracking-[0.4em] text-[8px] md:text-[10px] uppercase pointer-events-none font-bold">{dict.history.officialRecords}</p>
              </div>
            </div>
          }
          backContent={
            <div className="absolute inset-0 rounded-l-md overflow-hidden border-l-2 md:border-l-4 border-y-2 md:border-y-4 border-[#1a0a0a] select-none" style={leatherStyle}>
              {/* Spine Effect */}
              <div className="absolute right-0 top-0 bottom-0 w-4 md:w-8 bg-linear-to-l from-black/60 to-transparent z-20" />

              <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/black-leather.png')]" />
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-4 md:p-10 opacity-90">
                <div className="border border-zinc-800 p-4 md:p-8 rounded-sm bg-black/60 backdrop-blur-sm pointer-events-none shadow-[0_0_15px_rgba(0,0,0,0.8)]">
                  <h3 className="text-xl md:text-3xl font-serif mb-2 md:mb-4 uppercase tracking-[0.3em] text-white">
                    {dict.history.confidential}
                  </h3>
                  <div className="w-8 md:w-12 h-px bg-zinc-800 mx-auto" />
                  <p className="mt-2 md:mt-4 font-sans uppercase tracking-[0.2em] text-zinc-600 text-[8px] md:text-[10px]">
                    {dict.history.propertyOf}
                    <br />
                    {dict.history.theFamily}
                  </p>
                </div>
              </div>
            </div>
          }
        />

        {/* 2. CHAPTERS */}
        {historyChapters.map((chapter, i) => {
          const index = i + 1;
          return (
            <Page
              key={chapter.id}
              index={index}
              flippedIndex={flippedIndex}
              totalSheets={totalSheets}
              onFlip={handleFlip}
              frontContent={
                <div className="absolute inset-0 rounded-r-sm overflow-hidden border-l border-black/10 select-none" style={{ ...paperStyle }}>
                  <div style={curlStyle} />
                  <div className="absolute inset-0 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-40" />
                  {/* Title Page (Front/Right) */}
                  <div className="relative z-10 p-4 md:p-8 lg:p-12 h-full flex flex-col justify-center items-center text-center pointer-events-none">
                    <div className="border border-zinc-800 p-4 md:p-8 w-full h-full flex flex-col justify-center items-center bg-background">
                      <div className="w-12 h-12 md:w-20 md:h-20 rounded-sm border border-zinc-800 flex items-center justify-center mb-4 md:mb-6 opacity-60">
                        <span className="text-[6px] md:text-[8px] font-sans font-bold text-zinc-500 uppercase tracking-widest text-center leading-tight">ARCHIVE<br/>RECORD</span>
                      </div>
                      <h3 className="text-xl md:text-4xl lg:text-5xl font-serif text-white mb-4 md:mb-6 tracking-wide leading-tight">{chapter.title}</h3>
                      <div className="w-20 md:w-32 h-px bg-zinc-800 mb-4 md:mb-8" />
                      <p className="font-serif italic text-zinc-400 max-w-xs text-xs md:text-lg leading-relaxed">{dict.history.quote}</p>
                      <div className="mt-auto w-full flex justify-between items-end">
                        <span className="font-sans text-[8px] md:text-[10px] tracking-widest text-zinc-700">{i * 2 + 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
              }
              backContent={
                <div className="absolute inset-0 rounded-l-sm overflow-hidden border-r border-black/10 select-none" style={{ ...paperStyle }}>
                  <div className="absolute inset-0 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-40" />
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white opacity-5 blur-3xl pointer-events-none" />
                  {/* Content Page (Back/Left) */}
                  <div className="relative z-10 p-4 md:p-8 lg:p-12 h-full flex flex-col pointer-events-none">
                    <div className="flex justify-between items-start mb-4 md:mb-6 border-b border-zinc-800 pb-2">
                      <span className="font-sans text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-[0.3em]">
                        {dict.history.caseFile} #{1000 + chapter.id}
                      </span>
                      <span className="font-sans text-[8px] md:text-[10px] text-zinc-400 tracking-[0.3em] uppercase">
                        {dict.history.chapter} {chapter.id}
                      </span>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                      <p className="text-xs md:text-sm lg:text-base text-zinc-300 font-serif leading-relaxed md:leading-[1.8] tracking-wide opacity-90 line-clamp-10 md:line-clamp-none">
                        <span className="float-left text-2xl md:text-4xl text-white mr-2 md:mr-3 mt-[-2px] md:mt-[-4px] font-serif border-l-[3px] border-zinc-700 pl-2 pr-1">{chapter.content.charAt(0)}</span>
                        {chapter.content.slice(1)}
                      </p>
                    </div>
                    <div className="mt-auto pt-2 md:pt-4 flex justify-between items-center border-t border-zinc-800">
                      <span className="font-sans tracking-widest text-[8px] md:text-[10px] text-zinc-700 uppercase">{dict.history.header}</span>
                      <span className="font-sans text-[8px] md:text-[10px] tracking-widest text-zinc-700">{i * 2 + 2}</span>
                    </div>
                  </div>
                </div>
              }
            />
          );
        })}

        {/* 3. BACK COVER */}
        <Page
          index={totalSheets}
          flippedIndex={flippedIndex}
          totalSheets={totalSheets}
          onFlip={handleFlip}
          frontContent={
            <div className="absolute inset-0 rounded-r-md overflow-hidden border-r-2 md:border-r-4 border-y-2 md:border-y-4 border-[#1a0a0a] select-none" style={leatherStyle}>
              <div className="absolute left-0 top-0 bottom-0 w-3 md:w-6 bg-linear-to-r from-black/80 to-transparent z-20" />
              <div style={curlStyle} />
              <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/black-leather.png')]" />
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-4 md:p-10 opacity-90 pointer-events-none">
                <Image
                  src="/LOGO-COUGAN.gif"
                  alt="Cougan Emblem"
                  width={120}
                  height={120}
                  className="mx-auto opacity-20 grayscale contrast-150 pointer-events-none select-none drop-shadow-2xl w-20 h-20 md:w-32 md:h-32 object-contain"
                  unoptimized
                  draggable={false}
                />
                <p className="mt-4 md:mt-6 font-sans text-[8px] md:text-[10px] text-zinc-700 uppercase tracking-[0.4em]">END OF FILE</p>
              </div>
            </div>
          }
          backContent={
            <div className="absolute inset-0 bg-background border-y-2 md:border-y-4 border-l-2 md:border-l-4 border-zinc-900 rounded-l-md shadow-2xl select-none" style={leatherStyle}>
              <div className="absolute right-0 top-0 bottom-0 w-4 md:w-8 bg-linear-to-l from-black/60 to-transparent z-20" />
              <div className="absolute inset-4 md:inset-8 border border-zinc-900 rounded-sm" />
              <div className="flex items-center justify-center h-full">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border border-zinc-800 flex items-center justify-center opacity-30">
                  <div className="w-12 h-12 md:w-20 md:h-20 rounded-full border border-zinc-800" />
                </div>
              </div>
            </div>
          }
        />
      </motion.div>

      {/* External Controls */}
      <div className="mt-4 md:mt-8 flex gap-4 md:gap-8 items-center z-10 transition-opacity duration-500 max-w-full px-4" style={{ opacity: flippedIndex === 0 || flippedIndex > totalSheets ? 0 : 1 }}>
        {/* Only show controls when book is OPEN */}
        <button
          onClick={prevPage}
          disabled={flippedIndex <= 1}
          className="group flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-none border border-zinc-800 bg-background text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all disabled:opacity-20 disabled:hover:bg-transparent">
          <ChevronLeft size={16} className="md:w-[18px] md:h-[18px]" />
          <span className="font-sans tracking-[0.3em] text-[8px] md:text-[10px] uppercase">{dict.history.previous}</span>
        </button>

        <div className="text-zinc-600 font-sans text-[8px] md:text-[10px] tracking-[0.4em] uppercase whitespace-nowrap">
          {dict.history.file} {flippedIndex} <span className="mx-1 md:mx-2 text-zinc-800">|</span> {totalSheets}
        </div>

        <button
          onClick={nextPage}
          disabled={flippedIndex > totalSheets}
          className="group flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-none border border-zinc-800 bg-background text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all disabled:opacity-20 disabled:hover:bg-transparent">
          <span className="font-sans tracking-[0.3em] text-[8px] md:text-[10px] uppercase">{dict.history.next}</span>
          <ChevronRight size={16} className="md:w-[18px] md:h-[18px]" />
        </button>
      </div>
    </section>
  );
}
