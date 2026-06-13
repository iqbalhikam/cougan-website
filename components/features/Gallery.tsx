'use client';

import React, { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

// Using local client creation to avoid import issues if the global client isn't perfectly set up
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface GalleryItem {
  name: string;
  url: string;
}

export function Gallery() {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' }, [Autoplay({ delay: 4000, stopOnInteraction: false })]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const fetchImages = useCallback(async () => {
    try {
      // List files in 'gallery' folder of 'cougan' bucket
      const { data, error } = await supabase.storage.from('cougan').list('gallery');

      if (error) {
        console.error('Error fetching images:', error);
        return;
      }

      if (data) {
        // Filter out placeholders and map to URL
        const imageList = data
          .filter((item) => item.name !== '.emptyFolderPlaceholder')
          .map((item) => {
            const { data: publicUrlData } = supabase.storage.from('cougan').getPublicUrl(`gallery/${item.name}`);

            return {
              name: item.name,
              url: publicUrlData.publicUrl,
            };
          });
        setImages([...imageList, ...imageList, ...imageList]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full py-12 md:py-16 bg-background overflow-hidden" id="gallery">
      {/* 1. Background Atmosphere - Deep, dark, and smoky */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-zinc-900/10 via-background to-background pointer-events-none" />

      {/* 2. Subtle Noise Texture for Film Noir feel */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

      {/* 3. Cinematic Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_120%)] pointer-events-none z-10" />

      <div className="container mx-auto px-4 relative z-20">
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} viewport={{ once: true }} className="max-w-7xl mx-auto px-4 md:px-12 mb-8 md:mb-12 text-left relative z-20 flex items-center gap-4">
          <div className="w-8 md:w-16 h-[2px] bg-zinc-700" />
          <h2 className="text-lg md:text-2xl font-serif text-zinc-200 tracking-[0.2em] uppercase shrink-0">Gallery</h2>
          <div className="flex-1 h-px bg-zinc-900" />
        </motion.div>

        {/* Carousel Section */}
        <div className="relative max-w-7xl mx-auto px-4 md:px-12">
          {/* Decorative Frame Elements */}
          <div className="absolute -top-4 left-0 md:left-8 w-16 h-16 border-t-2 border-l-2 border-zinc-800 z-0"></div>
          <div className="absolute -bottom-4 right-0 md:right-8 w-16 h-16 border-b-2 border-r-2 border-zinc-800 z-0"></div>

          <div className="overflow-hidden px-4" ref={emblaRef}>
            <div className="flex touch-pan-y -ml-4 items-center py-10">
              {images.map((img, index) => (
                <div className="flex-[0_0_80%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0 pl-4 transition-all duration-500" key={index}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`relative group cursor-pointer transition-all duration-500 ${index === selectedIndex ? 'scale-100 z-10' : 'scale-90 opacity-60 hover:opacity-100 hover:scale-95'}`}>
                    {/* Image Container */}
                    <div className={`relative aspect-3/4 overflow-hidden rounded-sm border shadow-2xl transition-all duration-500 ${index === selectedIndex ? 'border-zinc-500 shadow-[0_10px_40px_rgba(0,0,0,0.8)]' : 'border-zinc-900'}`}>
                      {/* Interactive Image: B&W to Color */}
                      <Image
                        src={img.url}
                        alt={`Gallery Member ${index + 1}`}
                        fill
                        unoptimized
                        className={`object-cover object-center filter transition-all duration-700 ease-out ${index === selectedIndex ? 'grayscale-0 contrast-105' : 'grayscale contrast-125 group-hover:grayscale-0'}`}
                        sizes="(max-width: 768px) 85vw, (max-width: 1200px) 45vw, 30vw"
                      />

                      {/* Dark gradient overlay at bottom for name/info if needed */}
                      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-background to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-70"></div>

                      {/* Dossier stamp texture overlay */}
                      <div className="absolute inset-0 bg-black/10 mix-blend-multiply pointer-events-none"></div>
                    </div>

                    {/* Label/Decoration (optional) */}
                    <div className={`absolute -bottom-5 left-1/2 -translate-x-1/2 transition-all duration-500 transform ${index === selectedIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                      <div className="bg-background border-l-[3px] border-zinc-500 px-4 py-1.5 shadow-2xl">
                        <span className="text-zinc-300 text-[10px] font-bold tracking-[0.3em] uppercase">RECORD-{index + 1}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-8 mt-4 relative z-20">
            <button
              onClick={scrollPrev}
              className="w-12 h-10 border border-zinc-800 bg-background flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500 hover:bg-zinc-900 transition-all duration-300 group"
              aria-label="Previous image">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-3">
              {(() => {
                const maxIndicators = 4;
                const total = scrollSnaps.length;
                let start = selectedIndex - Math.floor((maxIndicators - 1) / 2);
                if (start < 0) start = 0;
                if (start + maxIndicators > total) start = total - maxIndicators;
                if (start < 0) start = 0; // In case total < maxIndicators

                return scrollSnaps.slice(start, start + maxIndicators).map((_, i) => {
                  const index = start + i;
                  return (
                    <button
                      key={index}
                      onClick={() => scrollTo(index)}
                      className={`h-1.5 transition-all duration-500 ${index === selectedIndex ? 'w-8 bg-zinc-300' : 'w-4 bg-zinc-800 hover:bg-zinc-600'}`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  );
                });
              })()}
            </div>

            <button
              onClick={scrollNext}
              className="w-12 h-10 border border-zinc-800 bg-background flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500 hover:bg-zinc-900 transition-all duration-300 group"
              aria-label="Next image">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-zinc-600 font-sans text-[10px] tracking-[0.5em] uppercase opacity-70">CONFIDENTIAL • DO NOT DISTRIBUTE</p>
        </div>
      </div>
    </section>
  );
}
