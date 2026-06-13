'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

import { useLanguage } from '@/components/providers/LanguageProvider';

export function Hero() {
  const { scrollY } = useScroll();
  const { dict } = useLanguage();
  const textOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const textOpacity2 = useTransform(scrollY, [0, 300], [1, 0]);
  const buttonOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <div className="relative w-full min-h-[80vh] md:min-h-screen overflow-hidden flex flex-col items-center justify-center ">
      {/* Background Image - Drives Height */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-linear-to-b from-background/90 via-background/70 to-background z-10" />
        <Image src="/images/background/full-cougan.webp" alt="Cougan Famillia" fill className="object-cover object-center grayscale opacity-40" priority quality={100} sizes="100vw" />
        <div className="absolute bottom-0 left-0 right-0 h-50 bg-linear-to-t from-background via-background/90 to-transparent z-10" />
      </div>

      {/* Content - Absolute Overlay */}
      <div className="relative z-20 flex flex-col items-center justify-center px-4 w-full h-full pt-20">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="mb-4 md:mb-8">
          {/* <Image src="/LOGO-COUGAN.gif" alt="Cougan Fams Logo" width={500} height={500} className="w-40 md:w-56 lg:w-64 h-auto object-contain" unoptimized /> */}
        </motion.div>
        <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
          <motion.h1
            style={{ opacity: textOpacity }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-white tracking-widest uppercase mb-4 md:mb-6 leading-tight">
            {dict.hero.byOrderOf} <br className="md:hidden" />
            <span className="text-zinc-500 border-b border-zinc-800 pb-2"> {dict.hero.theCouganFamily} </span>
          </motion.h1>
          <motion.p
            style={{ opacity: textOpacity2 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-zinc-400 mb-10 max-w-xl md:max-w-2xl mx-auto font-serif italic leading-relaxed px-4 border-l-2 border-zinc-800 text-left">
            "{dict.hero.quote}"
            <span className="text-zinc-600 font-sans uppercase tracking-[0.3em] mt-4 block text-[10px]">{dict.hero.roleplay}</span>
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
