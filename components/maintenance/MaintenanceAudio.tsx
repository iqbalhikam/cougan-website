'use client';

import { useEffect, useRef, useState } from 'react';

export function MaintenanceAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Try to play immediately
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Autoplay started!
          })
          .catch((error) => {
            // Autoplay was prevented.
            console.log('Autoplay prevented:', error);
          });
      }
    }

    const handleInteraction = () => {
      if (!hasInteracted && audioRef.current) {
        audioRef.current.play().catch((e) => console.error(e));
        setHasInteracted(true);
      }
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [hasInteracted]);

  return (
    <>
      <audio ref={audioRef} loop src="/backsound/mafia-soong.mp3" />
    </>
  );
}
