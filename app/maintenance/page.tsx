'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export default function MaintenancePage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Attempt auto-play
    const playAudio = async () => {
      if (audioRef.current) {
        try {
          audioRef.current.volume = 0.5;
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.log('Autoplay prevented:', err);
        }
      }
    };
    playAudio();
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <main className="h-screen w-screen bg-black flex flex-col items-center justify-center p-4 overflow-hidden relative selection:bg-gold/30">
      {/* Audio Element */}
      <audio ref={audioRef} loop src="/backsound/mafia-soong.mp3" />

      {/* Music Control - Discreet */}
      <button onClick={toggleAudio} className="absolute top-8 right-8 z-50 text-gold/50 hover:text-gold transition-colors duration-300">
        {isPlaying ? (
          <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          </svg>
        )}
      </button>

      {/* Dark Noir Background with Heavy Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black"></div>

      {/* Subtle Grid Pattern - Lower Opacity */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.02)_1px,transparent_1px)] bg-size-[100px_100px] opacity-10"></div>

      {/* Dramatic Top Spotlight */}
      <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[60%] h-[60%] bg-gold/5 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Film Grain */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

      <div className="relative z-10 max-w-6xl mx-auto text-center flex flex-col h-full justify-between py-12">
        {/* Top Decorative Line */}
        <div className="flex items-center justify-center gap-4 opacity-70">
          <div className="h-[1px] w-32 bg-linear-to-r from-transparent via-gold to-transparent"></div>
          <div className="w-1.5 h-1.5 rotate-45 border border-gold"></div>
          <div className="h-[1px] w-32 bg-linear-to-r from-transparent via-gold to-transparent"></div>
        </div>

        {/* Content Container - Centered Vertically */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 md:gap-12">
          {/* Logo Section - Compact */}
          <div className="relative inline-block scale-90 md:scale-100">
            {/* Dramatic Backlight */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gold/5 blur-3xl rounded-full"></div>

            {/* Logo Frame */}
            <div className="relative border-y-2 border-gold/30 py-6 px-12 bg-black/40 backdrop-blur-sm">
              <div className="absolute inset-x-0 -top-px h-[1px] bg-linear-to-r from-transparent via-gold/50 to-transparent"></div>
              <div className="absolute inset-x-0 -bottom-px h-[1px] bg-linear-to-r from-transparent via-gold/50 to-transparent"></div>

              <div className="flex items-center justify-center gap-8 md:gap-12">
                {/* Cougan Logo */}
                <div className="relative group">
                  <div className="relative w-24 h-24 md:w-32 md:h-32 transition-transform duration-500 group-hover:scale-105">
                    <Image src="/LOGO-COUGAN.gif" alt="Cougan Family" width={128} height={128} className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]" unoptimized />
                  </div>
                </div>

                {/* Vintage X */}
                <div className="flex flex-col items-center gap-3 opacity-80">
                  <div className="w-[1px] h-8 bg-linear-to-b from-transparent via-gold to-transparent"></div>
                  <span className="text-3xl font-serif text-gold">✕</span>
                  <div className="w-[1px] h-8 bg-linear-to-b from-transparent via-gold to-transparent"></div>
                </div>

                {/* BSG Logo */}
                <div className="relative group">
                  <div className="relative w-24 h-24 md:w-32 md:h-32 transition-transform duration-500 group-hover:scale-105">
                    <Image src="/BSG_LOGO.png" alt="BSG" width={128} height={128} className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Text Section */}
          <div className="space-y-4">
            {/* Slogan */}
            <p className="text-lg md:text-xl font-serif italic text-gold/80 tracking-widest mb-2">By Order Of The Cougan Family</p>

            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">
              <span className="block text-2xl md:text-3xl font-light tracking-[0.2em] text-zinc-500 mb-2 font-sans">TEMPORARILY</span>
              <span className="bg-linear-to-b from-gold via-yellow-200 to-gold bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(212,175,55,0.4)]">CLOSED</span>
            </h1>

            <div className="h-[1px] w-24 mx-auto bg-gold/30 my-6"></div>

            <p className="text-zinc-400 font-light text-lg tracking-wide">The Family is conducting important business.</p>
          </div>

          {/* Minimal Info Row */}
          <div className="flex gap-8 md:gap-16 pt-4">
            <div className="flex flex-col items-center gap-2 group cursor-default">
              <div className="w-10 h-10 rounded-full border border-gold/20 flex items-center justify-center group-hover:border-gold/50 group-hover:bg-gold/5 transition-all duration-500">
                <svg className="w-4 h-4 text-gold/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-gold/70 transition-colors">Intermission</span>
            </div>
            <div className="flex flex-col items-center gap-2 group cursor-default">
              <div className="w-10 h-10 rounded-full border border-gold/20 flex items-center justify-center group-hover:border-gold/50 group-hover:bg-gold/5 transition-all duration-500">
                <svg className="w-4 h-4 text-gold/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-gold/70 transition-colors">Security</span>
            </div>
            <div className="flex flex-col items-center gap-2 group cursor-default">
              <div className="w-10 h-10 rounded-full border border-gold/20 flex items-center justify-center group-hover:border-gold/50 group-hover:bg-gold/5 transition-all duration-500">
                <svg className="w-4 h-4 text-gold/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-gold/70 transition-colors">Premium</span>
            </div>
          </div>
        </div>

        {/* Footer - Minimal */}
        <div className="flex flex-col items-center gap-6 opacity-60">
          <div className="flex gap-6">
            {/* Socials - Just Icons */}
            <a href="#" className="text-zinc-500 hover:text-gold transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://youtube.com/@ananggaming" target="_blank" className="text-zinc-500 hover:text-gold transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            <a href="https://discord.gg/anangwaw" target="_blank" className="text-zinc-500 hover:text-gold transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
          </div>
          <p className="text-[10px] tracking-[0.2em] text-zinc-700 uppercase font-medium">Los Santos • GTA V Roleplay</p>
        </div>
      </div>
    </main>
  );
}
