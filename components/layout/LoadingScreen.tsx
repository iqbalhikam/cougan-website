'use client';

import { useState, useEffect, useRef } from 'react';

export default function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [debugMsg, setDebugMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let mounted = true;

    const playVideo = async () => {
      if (videoRef.current) {
        // Enforce unmuted state initially causing browser to attempt playing with audio
        videoRef.current.muted = false;

        try {
          // Try playing with sound first
          await videoRef.current.play();
          if (mounted) setIsMuted(false);
        } catch (e: unknown) {
          console.log('Autoplay with sound failed, falling back to muted:', e);
          // Fallback to muted autoplay
          if (videoRef.current) {
            videoRef.current.muted = true;
            try {
              await videoRef.current.play();
              if (mounted) setIsMuted(true);
            } catch (mutedErr) {
              console.error('Muted autoplay also failed:', mutedErr);
              if (mounted) setDebugMsg('Autoplay failed even when muted');
            }
          }
        }
      }
    };

    if (isVisible) {
      document.body.style.overflow = 'hidden';
      playVideo();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      mounted = false;
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const handleVideoEnd = () => {
    startExit();
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video error:', e);
    setDebugMsg('Video failed to load');
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      const currentTime = videoRef.current.currentTime;
      if (duration > 0) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };

  const startExit = () => {
    setIsFading(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 1000);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-1000 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}>
      {/* Debug Message Overlay */}
      {debugMsg && <div className="absolute top-10 left-10 text-red-500 z-[101] bg-white p-2 text-xs">{debugMsg}</div>}

      <video ref={videoRef} playsInline onEnded={handleVideoEnd} onError={handleVideoError} onTimeUpdate={handleTimeUpdate} className="h-full w-full object-cover">
        <source src="/loading-screen.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Unmute Button (Only visible if muted) */}
      {isMuted && (
        <button
          onClick={handleUnmute}
          className="absolute top-8 right-8 z-[101] p-3 bg-black/40 hover:bg-white/10 text-white border border-white/20 hover:border-white/40 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 group"
          aria-label="Unmute">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 2.485.735 4.816 2.035 6.784.354.55.962.88 1.62.88h1.285l4.5 4.5c.944.944 2.56.275 2.56-1.06V4.06zM18.58 12a6.47 6.47 0 00-1.38-3.956.75.75 0 011.164-.993A7.97 7.97 0 0119.5 12c0 2.049-.776 3.916-2.046 5.304a.75.75 0 11-1.129-1.015A6.47 6.47 0 0018.58 12z" />
          </svg>
        </button>
      )}

      {/* Progress Bar Container */}
      <div className="absolute bottom-0 left-0 right-0 z-[101] h-0.5 bg-white/10 overflow-hidden">
        <div className="h-full bg-linear-to-r from-red-900 via-red-600 to-red-500 transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(220,38,38,0.8)]" style={{ width: `${progress}%` }} />
      </div>

      {/* Skip Button */}
      <button
        onClick={startExit}
        className="absolute bottom-8 right-8 z-[101] px-3 py-1 bg-black/40 hover:bg-white/10 text-white text-xs font-medium tracking-widest uppercase border border-white/20 hover:border-white/40 rounded backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 group flex items-center gap-1.5">
        <span>Skip Intro</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 transition-transform group-hover:translate-x-0.5">
          <path
            fillRule="evenodd"
            d="M13.28 11.47a.75.75 0 010 1.06l-4.75 4.75a.75.75 0 01-1.06-1.06L11.69 12 7.47 7.78a.75.75 0 011.06-1.06l4.75 4.75zm6 0a.75.75 0 010 1.06l-4.75 4.75a.75.75 0 01-1.06-1.06L17.69 12l-4.22-4.22a.75.75 0 011.06-1.06l4.75 4.75z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
