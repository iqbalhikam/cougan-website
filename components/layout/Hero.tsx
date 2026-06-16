'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

import { useLanguage } from '@/components/providers/LanguageProvider';

interface HeroProps {
  backgrounds?: { url: string }[];
  transitionSpeed?: number;
}

export function Hero({ backgrounds = [], transitionSpeed = 5 }: HeroProps) {
  const { scrollY } = useScroll();
  const { dict } = useLanguage();
  const textOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const textOpacity2 = useTransform(scrollY, [0, 300], [1, 0]);
  const buttonOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Fallback to static image if no backgrounds are provided
  const images = backgrounds.length > 0 ? backgrounds : [{ url: '/images/background/full-cougan.webp' }];

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, transitionSpeed * 1000);

    return () => clearInterval(interval);
  }, [images.length, transitionSpeed]);

  return (
    <div className="relative w-full min-h-[80vh] md:min-h-screen overflow-hidden flex flex-col items-center justify-center ">
      {/* Background Image - Drives Height */}
      <div className="absolute inset-0 w-full h-full bg-zinc-950">
        <div className="absolute inset-0 bg-linear-to-b from-background/80 via-background/60 to-background z-10 pointer-events-none" />
        
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }} // Transisi memudar (fade)
            className="absolute inset-0"
          >
            <Image 
              src={images[currentIndex]?.url || '/images/background/full-cougan.webp'} 
              alt={`Cougan Famillia Background ${currentIndex + 1}`} 
              fill 
              className="object-cover object-center grayscale opacity-50" 
              priority={currentIndex === 0} 
              quality={100} 
              sizes="100vw" 
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-0 left-0 right-0 h-50 bg-linear-to-t from-background via-background/90 to-transparent z-10" />
      </div>

      {/* Content - Absolute Overlay */}
      <div className="relative z-20 flex flex-col items-center justify-center px-4 w-full h-full pt-20 pointer-events-none">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="mb-4 md:mb-8 pointer-events-auto">
          {/* <Image src="/LOGO-COUGAN.gif" alt="Cougan Fams Logo" width={500} height={500} className="w-40 md:w-56 lg:w-64 h-auto object-contain" unoptimized /> */}
        </motion.div>
        <div className="text-center max-w-4xl mx-auto flex flex-col items-center pointer-events-auto">
          <motion.h1
            style={{ opacity: textOpacity }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.8)] tracking-widest uppercase mb-1 md:mb-2 leading-tight">
            {dict.hero.byOrderOf} <br className="md:hidden" />
            <span className="text-transparent [-webkit-text-stroke:1px_rgba(161,161,170,0.8)]"> {dict.hero.theCouganFamily} </span>
          </motion.h1>
          <motion.p
            style={{ opacity: textOpacity2 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-8 md:mb-10">
            <span className="text-zinc-500 font-sans uppercase tracking-[0.3em] block text-[10px] sm:text-xs">{dict.hero.roleplay}</span>
          </motion.p>
          <motion.div
            style={{ opacity: buttonOpacity }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link href="/multiview" className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto rounded-none px-10 text-[10px] tracking-[0.2em] uppercase font-bold bg-white text-black hover:bg-zinc-200">
                {dict.hero.watchMultiview}
              </Button>
            </Link>
            <a href="#members" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-none px-10 text-[10px] tracking-[0.2em] uppercase border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-900/50 backdrop-blur-sm">
                {dict.hero.meetTheFamily}
              </Button>
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
