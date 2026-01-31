'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export function Hero() {
  const { scrollY } = useScroll();
  const textOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const textOpacity2 = useTransform(scrollY, [0, 300], [1, 0]);
  const buttonOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <div className="relative w-full overflow-hidden bg-black flex items-center justify-center">
      {/* Background Image - Drives Height */}
      <div className="relative w-full">
        <div className="absolute inset-0 bg-black/10 z-10" />
        <Image width={1920} height={1080} src="/Cougan-Fams.jpg" alt="Cougan Famillia" className="w-full h-auto object-contain block" />
        <div className="absolute bottom-0 left-0 right-0 h-50 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
      </div>

      {/* Content - Absolute Overlay */}
      <div className="absolute inset-0 z-20  flex flex-col items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="mb-6 md:mb-8">
          {/* <Image src="/LOGO-COUGAN.gif" alt="Cougan Fams Logo" width={500} height={500} className="w-40 md:w-56 lg:w-64 h-auto object-contain" unoptimized /> */}
        </motion.div>
        <div className="text-center px-4 max-w-full mx-auto flex flex-col items-center">
          <motion.h1
            style={{ opacity: textOpacity }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter mb-4 md:mb-6">
            COUGAN <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-dim"> FAMILY </span>
          </motion.h1>

          <motion.p
            style={{ opacity: textOpacity2 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-zinc-300 mb-6 md:mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Blood makes you related. Loyalty makes you family.
            <br className="hidden md:block" />
            <span className="text-gold/80 font-medium mt-1 block">Premium GTA V Roleplay Entertainment</span>
          </motion.p>

          <motion.div
            style={{ opacity: buttonOpacity }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <Link href="/multiview">
              <Button variant="gold" size="lg" className="rounded-full px-8 md:px-10 text-base md:text-lg font-bold">
                Watch Multiview
              </Button>
            </Link>
            <a href="#members">
              <Button variant="outline" size="lg" className="rounded-full px-8 md:px-10 text-base md:text-lg border-zinc-500 text-zinc-300 hover:text-white hover:border-white bg-black/40 backdrop-blur-sm">
                Meet the Family
              </Button>
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
