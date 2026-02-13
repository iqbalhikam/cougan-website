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
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/60 to-black z-10" />
        <Image src="/images/background/full-cougan.png" alt="Cougan Famillia" fill className="object-cover object-center" priority />
        <div className="absolute bottom-0 left-0 right-0 h-50 bg-linear-to-t from-black via-black/80 to-transparent z-10" />
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
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-[#e0c090] tracking-widest uppercase font-serif drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] mb-4 md:mb-6 leading-tight">
            {dict.hero.byOrderOf} <br className="md:hidden" />
            <span className="text-gold border-b-2 border-gold/30 pb-1"> {dict.hero.theCouganFamily} </span>
          </motion.h1>
          <motion.p
            style={{ opacity: textOpacity2 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-zinc-300 mb-8 md:mb-10 max-w-xl md:max-w-2xl mx-auto font-light leading-relaxed px-2">
            {dict.hero.quote}
            <br className="hidden md:block" />
            <span className="text-gold/80 font-medium mt-2 block rounded-full px-2 text-sm md:text-base">{dict.hero.roleplay}</span>
          </motion.p>
          <motion.div
            style={{ opacity: buttonOpacity }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link href="/multiview" className="w-full sm:w-auto">
              <Button variant="gold" size="lg" className="w-full sm:w-auto rounded-full px-8 md:px-10 text-base md:text-lg font-bold">
                {dict.hero.watchMultiview}
              </Button>
            </Link>
            <a href="#members" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-8 md:px-10 text-base md:text-lg border-zinc-500 text-zinc-300 hover:text-white hover:border-white bg-black/40 backdrop-blur-sm">
                {dict.hero.meetTheFamily}
              </Button>
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
