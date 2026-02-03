'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const IMAGES = ['/family.png', '/family2.png', '/gashima.jpg', '/silent.png', '/srigala-cougan.jpg'];

export function BackgroundSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % IMAGES.length);
    }, 6000); // Change every 6 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <AnimatePresence mode="popLayout">
        <motion.div key={index} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 0.4, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5, ease: 'easeInOut' }} className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${IMAGES[index]})` }} />
          {/* Heavy Overlay for Text Readability */}
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-black"></div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
