'use client';

import Image from 'next/image';
import { BackgroundSlider } from './BackgroundSlider';

export default function MaintenanceScreen() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden p-4">
      {/* Background Atmosphere */}
      <BackgroundSlider />
      <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] pointer-events-none"></div>
      <div className="absolute inset-0 bg-linear-to-b from-black via-transparent to-black z-10 pointer-events-none"></div>

      <div className="z-20 flex flex-col items-center text-center space-y-8 max-w-2xl w-full">
        {/* Main Cougan Logo */}
        <div className="flex items-center">
          <div className="relative w-20 h-20 md:w-36 md:h-36 lg:w-60 lg:h-60 animate-pulse-slow drop-shadow-[0_0_25px_rgba(180,148,31,0.3)]">
            <Image src="/LOGO-COUGAN.gif" alt="Cougan Family Logo" fill className="object-cover" priority unoptimized />
          </div>
          <div className="relative w-14 h-14 md:w-24 md:h-24 lg:w-50 lg:h-50 animate-pulse-slow drop-shadow-[0_0_25px_rgba(180,148,31,0.3)]">
            <Image src="/mantenace-bg/x.png" alt="Cougan Family Logo" fill className="object-contain" priority unoptimized />
          </div>
          <div className="relative flex items-center justify-center w-20 h-20 md:w-36 md:h-36 lg:w-60 lg:h-60 animate-pulse-slow drop-shadow-[0_0_25px_rgba(180,148,31,0.3)]">
            <Image src="/BSG_LOGO.png" alt="BSG Logo" fill className="object-contain hover:grayscale-0 transition-all duration-700 grayscale" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-widest text-gold uppercase drop-shadow-md" style={{ fontFamily: 'Times New Roman, serif' }}>
            Under Maintenance
          </h1>
          <div className="h-1 w-24 bg-blood mx-auto rounded-full"></div>
          <p className="text-gray-400 text-lg md:text-xl font-light tracking-wide italic">&quot;We are currently improving this website. There are no witnesses.&quot;</p>
        </div>

        {/* BSG Logo - Partner/Footer */}
        <div className="pt-12 opacity-80 hover:opacity-100 transition-opacity duration-500">
          <p className="text-[15px] text-gray-500 tracking-[0.2em] mt-2 uppercase">By Order Of The Cougan Family</p>
          <p className="text-[10px] text-gray-600 tracking-[0.2em] mt-2 uppercase">Powered by Cougan x BSG</p>
        </div>
      </div>
    </main>
  );
}
