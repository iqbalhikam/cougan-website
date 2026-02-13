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
    backgroundColor: '#e3d5b8', // Slightly lighter base
    backgroundImage: `
      linear-gradient(to right, rgba(0,0,0,0.1) 0%, transparent 5%, transparent 95%, rgba(0,0,0,0.1) 100%),
      repeating-linear-gradient(to right, transparent 0, transparent 2px, rgba(0,0,0,0.03) 3px),
      radial-gradient(circle at 50% 50%, rgba(200, 150, 50, 0.1), transparent 60%),
      url("https://www.transparenttextures.com/patterns/aged-paper.png")
    `,
    boxShadow: 'inset 0 0 30px rgba(80, 50, 20, 0.1)',
    backgroundSize: '100% 100%, 4px 100%, 100% 100%, auto',
    backgroundBlendMode: 'multiply, multiply, multiply, overlay',
  };

  const leatherStyle = {
    backgroundColor: '#1a0a0a',
    backgroundImage: `
      radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05), transparent 25%), 
      radial-gradient(circle at 70% 80%, rgba(255,255,255,0.03), transparent 20%),
      url("https://www.transparenttextures.com/patterns/black-leather.png"),
      linear-gradient(to bottom right, #000000, #2c1810)
    `,
    backgroundBlendMode: 'overlay, overlay, multiply, normal',
    boxShadow: 'inset 0 0 50px rgba(0,0,0,0.9), 5px 10px 20px rgba(0,0,0,0.6)',
  };

  const goldTextStyle = {
    background: 'linear-gradient(to bottom, #cfc09f 0%, #ffecb3 20%, #a47e3c 40%, #7c5a2b 60%, #cfc09f 80%, #ffecb3 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0px 1px 0px rgba(255,255,255,0.2), 0px -1px 0px rgba(0,0,0,0.6)',
    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))',
  };

  return (
    <section className="relative w-full mx-auto py-12 md:py-24 hidden md:flex flex-col items-center justify-center min-h-[500px] md:min-h-[700px] select-none overflow-hidden">
      {/* Atmosphere */}
      <div className="absolute inset-0 z-0 bg-radial-[circle_at_center,transparent_10%,rgba(0,0,0,0.85)_90%] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 md:gap-6 mb-8 md:mb-16 z-10 relative select-none pointer-events-none px-4 text-center">
        <div className="h-px w-12 md:w-24 bg-linear-to-r from-transparent to-gold/40 hidden md:block" />
        <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-gold drop-shadow-md shrink-0" />
        <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-[#e0c090] tracking-widest uppercase font-serif drop-shadow-lg text-center leading-tight">{dict.history.header}</h2>
        <div className="h-px w-12 md:w-24 bg-linear-to-l from-transparent to-gold/40 hidden md:block" />
      </div>

      {/* 3D Scene Container */}
      <motion.div
        animate={{
          x: flippedIndex === 0 ? '-25%' : flippedIndex > totalSheets ? '25%' : '0%',
          scale: typeof window !== 'undefined' && window.innerWidth < 768 ? 0.9 : 1,
        }}
        transition={{
          duration: 0.8,
          ease: 'easeInOut',
        }}
        className="relative perspective-distant md:perspective-[2000px] w-[95%] md:w-full max-w-lg md:max-w-5xl aspect-[0.7/1] md:aspect-[1.6/1] z-20 drop-shadow-2xl">
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
              <div className="absolute inset-2 md:inset-4 border-2 border-[#cfc09f]/30 rounded-sm shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8),1px_1px_2px_rgba(255,255,255,0.05)]" />
              <div className="absolute inset-4 md:inset-6 border border-[#cfc09f]/10 rounded-sm" />

              <div className="relative z-10 text-center p-4 md:p-8">
                <div className="relative inline-block mx-auto mb-4 md:mb-8">
                  <Image
                    src="/LOGO-COUGAN.gif"
                    alt="Cougan Family"
                    width={160}
                    height={160}
                    className="relative z-10 opacity-90 pointer-events-none select-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] w-24 h-24 md:w-40 md:h-40 object-contain"
                    unoptimized
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-[#cfc09f] blur-2xl opacity-10 rounded-full" />
                </div>
                <h1 className="text-2xl md:text-4xl lg:text-6xl font-serif font-bold tracking-widest uppercase mb-2 pointer-events-none" style={goldTextStyle}>
                  Cougan
                </h1>
                <div className="w-20 md:w-32 h-1 mx-auto mb-2 md:mb-4" style={{ background: 'linear-gradient(90deg, transparent, #cfc09f, #a47e3c, #cfc09f, transparent)' }} />
                <p className="text-[#a47e3c] font-serif tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-sm uppercase pointer-events-none drop-shadow-sm font-bold">{dict.history.officialRecords}</p>
              </div>
            </div>
          }
          backContent={
            <div className="absolute inset-0 rounded-l-md overflow-hidden border-l-2 md:border-l-4 border-y-2 md:border-y-4 border-[#1a0a0a] select-none" style={leatherStyle}>
              {/* Spine Effect */}
              <div className="absolute right-0 top-0 bottom-0 w-4 md:w-8 bg-linear-to-l from-black/60 to-transparent z-20" />

              <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/black-leather.png')]" />
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-4 md:p-10 opacity-90">
                <div className="border border-[#cfc09f]/30 p-4 md:p-8 rounded-sm bg-black/40 backdrop-blur-sm pointer-events-none shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <h3 className="text-xl md:text-4xl font-serif font-bold mb-2 md:mb-4 uppercase tracking-[0.2em]" style={goldTextStyle}>
                    {dict.history.confidential}
                  </h3>
                  <div className="w-8 md:w-12 h-0.5 mx-auto" style={{ background: 'linear-gradient(90deg, transparent, #cfc09f, transparent)' }} />
                  <p className="mt-2 md:mt-4 font-serif italic text-[#d4c5a9] text-xs md:text-sm opacity-60">
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
                    <div className="border-2 md:border-4 border-double border-[#2c1810]/30 p-4 md:p-8 w-full h-full flex flex-col justify-center items-center bg-[#d4c5a9]/20">
                      <div className="w-12 h-12 md:w-20 md:h-20 rounded-full border-2 border-[#8b4513]/30 flex items-center justify-center mb-4 md:mb-6 rotate-[-15deg] opacity-60">
                        <span className="text-[8px] md:text-[10px] font-serif font-bold text-[#8b4513] uppercase text-center leading-tight">{dict.history.officialDocumentVerified}</span>
                      </div>
                      <h3 className="text-xl md:text-4xl lg:text-5xl font-serif font-bold text-[#1a0f0a] mb-4 md:mb-6 drop-shadow-sm tracking-tight leading-tight">{chapter.title}</h3>
                      <div className="w-20 md:w-32 h-1 bg-[#8b4513] mb-4 md:mb-8 opacity-60" />
                      <p className="font-serif italic text-[#3e2723] max-w-xs text-xs md:text-lg leading-relaxed">{dict.history.quote}</p>
                      <div className="mt-auto w-full flex justify-between items-end">
                        <span className="font-serif text-[10px] md:text-sm font-bold text-black/60">{i * 2 + 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
              }
              backContent={
                <div className="absolute inset-0 rounded-l-sm overflow-hidden border-r border-black/10 select-none" style={{ ...paperStyle }}>
                  <div className="absolute inset-0 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-40" />
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-[#8b4513] opacity-10 blur-xl mix-blend-multiply pointer-events-none" />
                  {/* Content Page (Back/Left) */}
                  <div className="relative z-10 p-4 md:p-8 lg:p-12 h-full flex flex-col pointer-events-none">
                    <div className="flex justify-between items-start mb-4 md:mb-6 border-b border-black/20 pb-2">
                      <span className="font-serif text-[8px] md:text-[10px] text-black/40 uppercase tracking-widest">
                        {dict.history.caseFile} #{1000 + chapter.id}
                      </span>
                      <span className="font-serif text-sm md:text-lg text-black/70 font-bold">
                        {dict.history.chapter} {chapter.id}
                      </span>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                      <p className="text-xs md:text-base lg:text-[1.15rem] text-[#2c1810] font-serif leading-relaxed md:leading-[1.8] tracking-wide font-medium drop-shadow-sm opacity-90 line-clamp-10 md:line-clamp-none">
                        <span className="float-left text-3xl md:text-5xl font-bold text-[#8b4513] mr-2 md:mr-3 mt-[-4px] md:mt-[-10px] font-serif border border-black/10 px-1 md:px-2 bg-black/5 rounded-sm">{chapter.content.charAt(0)}</span>
                        {chapter.content.slice(1)}
                      </p>
                    </div>
                    <div className="mt-auto pt-2 md:pt-4 flex justify-between items-center border-t border-black/10">
                      <span className="font-serif text-[8px] md:text-xs text-black/40 italic">{dict.history.header}</span>
                      <span className="font-serif text-[10px] md:text-sm font-bold text-black/60">{i * 2 + 2}</span>
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
                  className="mx-auto opacity-30 grayscale contrast-150 pointer-events-none select-none drop-shadow-2xl w-20 h-20 md:w-32 md:h-32 object-contain"
                  unoptimized
                  draggable={false}
                />
                <p className="mt-4 md:mt-6 font-serif text-[10px] md:text-xs text-[#cfc09f]/40 uppercase tracking-widest">{dict.history.endOfFile}</p>
              </div>
            </div>
          }
          backContent={
            <div className="absolute inset-0 bg-[#0f0f0f] border-y-2 md:border-y-4 border-l-2 md:border-l-4 border-[#2a2a2a] rounded-l-md shadow-2xl select-none" style={leatherStyle}>
              <div className="absolute right-0 top-0 bottom-0 w-4 md:w-8 bg-linear-to-l from-black/60 to-transparent z-20" />
              <div className="absolute inset-0 opacity-60 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/black-leather.png')]" />
              <div className="absolute inset-4 md:inset-8 border border-black/40 rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />
              <div className="flex items-center justify-center h-full">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border border-[#cfc09f]/10 flex items-center justify-center opacity-30 mix-blend-overlay">
                  <div className="w-12 h-12 md:w-20 md:h-20 rounded-full border border-[#cfc09f]/5" />
                </div>
              </div>
            </div>
          }
        />
      </motion.div>

      {/* External Controls */}
      <div className="mt-8 md:mt-16 flex gap-4 md:gap-10 items-center z-10 transition-opacity duration-500 max-w-full px-4" style={{ opacity: flippedIndex === 0 || flippedIndex > totalSheets ? 0 : 1 }}>
        {/* Only show controls when book is OPEN */}
        <button
          onClick={prevPage}
          disabled={flippedIndex <= 1}
          className="group flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-sm border border-gold/20 bg-black/60 text-gold hover:bg-gold/10 hover:border-gold/50 transition-all disabled:opacity-20 disabled:hover:bg-transparent backdrop-blur-md">
          <ChevronLeft size={16} className="md:w-[18px] md:h-[18px]" />
          <span className="font-serif tracking-[0.2em] text-[10px] md:text-xs uppercase">{dict.history.previous}</span>
        </button>

        <div className="text-gold/40 font-serif text-[10px] md:text-xs tracking-[0.3em] uppercase whitespace-nowrap">
          {dict.history.file} {flippedIndex} <span className="mx-1 md:mx-2 text-gold/20">|</span> {totalSheets}
        </div>

        <button
          onClick={nextPage}
          disabled={flippedIndex > totalSheets}
          className="group flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-sm border border-gold/20 bg-black/60 text-gold hover:bg-gold/10 hover:border-gold/50 transition-all disabled:opacity-20 disabled:hover:bg-transparent backdrop-blur-md">
          <span className="font-serif tracking-[0.2em] text-[10px] md:text-xs uppercase">{dict.history.next}</span>
          <ChevronRight size={16} className="md:w-[18px] md:h-[18px]" />
        </button>
      </div>
    </section>
  );
}
