'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface AudioPlayerProps {
  playlist: string[];
}

export function AudioPlayer({ playlist }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]), { stiffness: 400, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]), { stiffness: 400, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isExpanded) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseX.set(x / rect.width - 0.5);
    mouseY.set(y / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => {
          console.log('Play failed:', e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    const playAudio = async () => {
      if (audioRef.current && isPlaying) {
        try {
          await audioRef.current.play();
        } catch (error) {
          console.log('Autoplay blocked by browser policy. Waiting for user interaction...', error);
          const enableAudio = () => {
            if (audioRef.current) {
              audioRef.current
                .play()
                .then(() => {
                  setIsPlaying(true);
                  document.removeEventListener('click', enableAudio);
                  document.removeEventListener('keydown', enableAudio);
                })
                .catch((e) => console.log('Retry play failed:', e));
            }
          };
          document.addEventListener('click', enableAudio);
          document.addEventListener('keydown', enableAudio);
        }
      }
    };
    playAudio();
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) setIsMuted(false);
    if (newVolume === 0) setIsMuted(true);
  };

  const handleTrackEnd = () => {
    if (isLooping) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log('Loop play failed:', e));
      }
    } else {
      handleNext();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  const handleNext = () => {
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % playlist.length);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTrackTitle = (url: string) => {
    if (!url) return '';
    try {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      const decoded = decodeURIComponent(filename);
      // Remove extension, numeric timestamp prefix, and replace underscores with spaces
      return decoded.replace(/\.[^/.]+$/, "").replace(/^\d+-/, "").replace(/_/g, " ");
    } catch {
      return 'Unknown Track';
    }
  };

  if (!playlist || playlist.length === 0) return null;

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      layout
      initial={{ borderRadius: 40 }}
      animate={{
        width: isExpanded ? (window.innerWidth < 640 ? 'calc(100vw - 3rem)' : 384) : 56,
        height: isExpanded ? 96 : 56,
        boxShadow: isExpanded || !isPlaying
          ? 'inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.1), 0 8px 32px 0 rgba(0,0,0,0.3)'
          : 'inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.1), 0 8px 32px 0 rgba(250, 204, 21, 0.25)'
      }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.7 }}
      className="fixed bottom-6 left-6 z-50 bg-white/10 backdrop-blur-2xl border border-white/20 overflow-hidden flex items-center group"
    >
      <audio ref={audioRef} src={playlist[currentTrackIndex]} onEnded={handleTrackEnd} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} autoPlay />

      {/* Main Toggle Button */}
      <motion.button
        layout
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-14 h-14 flex items-center justify-center shrink-0 z-20 outline-none"
      >
        <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${isExpanded ? 'bg-transparent' : 'bg-white/10 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_2px_8px_rgba(0,0,0,0.1)] hover:bg-white/20 hover:scale-105 active:scale-95'}`}>
          {!isExpanded ? (
            <div className="flex items-end gap-[3px] h-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-linear-to-t from-yellow-400 to-yellow-200 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]"
                  animate={{ height: isPlaying ? ['4px', '16px', '4px'] : '4px' }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
                />
              ))}
            </div>
          ) : (
            <motion.svg
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              className="w-5 h-5 text-white/80 hover:text-white drop-shadow-md"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          )}
        </div>
      </motion.button>

      {/* Expanded Controls */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col flex-1 pl-1 pr-6 w-full"
          >
            {/* Track Title */}
            <div className="w-full text-[14px] font-bold tracking-tight text-white/95 antialiased truncate mb-2 drop-shadow-md">
              {playlist[currentTrackIndex] ? getTrackTitle(playlist[currentTrackIndex]) : ''}
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-4">
                {/* Prev */}
                <button onClick={handlePrev} className="text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all drop-shadow-md">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                {/* Play/Pause */}
                <button onClick={togglePlay} className="text-white hover:scale-110 active:scale-95 transition-all">
                  {isPlaying ? (
                    <svg className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <div className="bg-white/10 border border-white/20 rounded-full p-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]">
                      <svg className="w-5 h-5 text-white drop-shadow-md ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                </button>

                {/* Next */}
                <button onClick={handleNext} className="text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all drop-shadow-md">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>

                {/* Loop */}
                <button onClick={() => setIsLooping(!isLooping)} className={`hover:scale-110 active:scale-95 transition-all drop-shadow-md ${isLooping ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-white/70 hover:text-white'}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors drop-shadow-md">
                  {isMuted || volume === 0 ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
                <div className="relative flex items-center group/volume w-16 h-1.5 cursor-pointer">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    style={{ backgroundSize: `${volume * 100}% 100%` }}
                    className="absolute inset-0 w-full h-full bg-black/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] rounded-full appearance-none cursor-pointer bg-linear-to-r from-white to-white bg-no-repeat [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:opacity-0 group-hover/volume:[&::-webkit-slider-thumb]:opacity-100 [&::-webkit-slider-thumb]:transition-opacity [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.4)] hover:[&::-webkit-slider-thumb]:scale-125 z-10"
                  />
                </div>
              </div>
            </div>

            {/* Progress Bar & Time */}
            <div className="flex items-center gap-3 text-[10px] text-white/70 font-bold tracking-wider">
              <span className="w-8 text-right drop-shadow-sm">{formatTime(currentTime)}</span>
              <div className="relative flex-1 flex items-center group/progress h-1.5 cursor-pointer">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  style={{ backgroundSize: `${duration > 0 ? (currentTime / duration) * 100 : 0}% 100%` }}
                  className="absolute inset-0 w-full h-full bg-black/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] rounded-full appearance-none cursor-pointer bg-linear-to-r from-yellow-400 to-yellow-400 bg-no-repeat [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:opacity-0 group-hover/progress:[&::-webkit-slider-thumb]:opacity-100 [&::-webkit-slider-thumb]:transition-opacity [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.4)] hover:[&::-webkit-slider-thumb]:scale-125 z-10"
                />
              </div>
              <span className="w-8 drop-shadow-sm">{formatTime(duration)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
