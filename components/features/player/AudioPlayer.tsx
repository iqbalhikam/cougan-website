'use client';

import { useState, useRef, useEffect } from 'react';

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
  const audioRef = useRef<HTMLAudioElement>(null);

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
    // Attempt auto-play on mount
    const playAudio = async () => {
      if (audioRef.current && isPlaying) {
        try {
          await audioRef.current.play();
        } catch (error) {
          console.log('Autoplay blocked by browser policy. Waiting for user interaction...', error);

          // Fallback: Play on first interact
          const enableAudio = () => {
            if (audioRef.current) {
              audioRef.current
                .play()
                .then(() => {
                  setIsPlaying(true);
                  // Remove listeners once played
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
    handleNext();
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

  if (!playlist || playlist.length === 0) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${isExpanded ? 'w-[calc(100vw-2rem)] md:w-96' : 'w-16'} h-16 bg-black/80 backdrop-blur-md border border-white/10 rounded-full overflow-hidden flex items-center shadow-lg group`}>
      <audio ref={audioRef} src={playlist[currentTrackIndex]} onEnded={handleTrackEnd} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} autoPlay />

      {/* Main Toggle Button */}
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-16 h-16 flex items-center justify-center text-white shrink-0 hover:text-gold transition-colors z-10">
        <svg className={`w-6 h-6 ${isPlaying ? 'animate-spin-slow' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </button>

      {/* Expanded Controls */}
      <div className={`flex flex-col flex-1 pl-0 pr-6 transition-opacity duration-300 overflow-hidden ${isExpanded ? 'opacity-100 visible w-auto' : 'opacity-0 invisible absolute w-0'}`}>
        {/* Controls Row */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            {/* Prev */}
            <button onClick={handlePrev} className="text-zinc-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-zinc-200 hover:text-white transition-colors">
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button onClick={handleNext} className="text-zinc-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Volume Icon */}
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
              {isMuted || volume === 0 ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-gold"
            />
          </div>
        </div>

        {/* Progress Bar & Time */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:rounded-full"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
