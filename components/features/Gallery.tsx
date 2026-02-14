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
      <div className="flex justify-center items-center py-20 bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-[#e0c090]" />
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full py-32 bg-black overflow-hidden" id="gallery">
      {/* 1. Background Atmosphere - Deep, dark, and smoky */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black pointer-events-none" />

      {/* 2. Subtle Noise Texture for Film Noir feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

      {/* 3. Cinematic Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_120%)] pointer-events-none z-10" />

      <div className="container mx-auto px-4 relative z-20">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: 'easeOut' }} viewport={{ once: true }} className="text-center mb-20">
          <div className="inline-block relative">
            <h2 className="text-5xl md:text-7xl font-serif text-gold mb-6 tracking-[0.2em] uppercase drop-shadow-[0_10px_20px_rgba(0,0,0,1)] relative z-10">GALLERY</h2>
            {/* Blood red accent behind title */}
            <div className="absolute -inset-4 bg-red-900/20 blur-3xl rounded-[50%] -z-10 opacity-60"></div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8 opacity-80">
            <div className="h-px w-12 md:w-24 bg-linear-to-r from-transparent to-gold"></div>
            <div className="w-2 h-2 rotate-45 border border-gold"></div>
            <div className="h-px w-12 md:w-24 bg-linear-to-l from-transparent to-gold"></div>
          </div>

          <p className="text-zinc-500 font-serif italic text-xl md:text-2xl max-w-3xl mx-auto tracking-wide leading-relaxed">&quot;Every picture tells a story, captured in time.&quot;</p>
        </motion.div>

        {/* Carousel Section */}
        <div className="relative max-w-7xl mx-auto px-4 md:px-12">
          {/* Decorative Frame Elements */}
          <div className="absolute -top-4 left-0 md:left-8 w-16 h-16 border-t-2 border-l-2 border-gold/30 rounded-tl-lg z-0"></div>
          <div className="absolute -bottom-4 right-0 md:right-8 w-16 h-16 border-b-2 border-r-2 border-gold/30 rounded-br-lg z-0"></div>

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
                    <div className={`relative aspect-3/4 overflow-hidden rounded-md border shadow-2xl transition-all duration-500 ${index === selectedIndex ? 'border-gold/50 shadow-[0_10px_40px_rgba(212,175,55,0.2)]' : 'border-white/5'}`}>
                      {/* Interactive Image: B&W to Color */}
                      <Image
                        src={img.url}
                        alt={`Gallery Member ${index + 1}`}
                        fill
                        className={`object-cover object-center filter transition-all duration-700 ease-out ${index === selectedIndex ? 'grayscale-0 contrast-105' : 'grayscale contrast-125 group-hover:grayscale-0'}`}
                        sizes="(max-width: 768px) 85vw, (max-width: 1200px) 45vw, 30vw"
                      />

                      {/* Dark gradient overlay at bottom for name/info if needed */}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/90 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-60"></div>

                      {/* Old Photo texture overlay */}
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-20 mix-blend-multiply pointer-events-none"></div>

                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                    </div>

                    {/* Label/Decoration (optional) */}
                    <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 transition-all duration-500 transform ${index === selectedIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                      <div className="bg-black/80 backdrop-blur-md border border-gold/30 px-6 py-1 rounded-full shadow-lg">
                        <span className="text-gold text-xs font-serif tracking-widest uppercase">Cougan</span>
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
              className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-gold hover:border-gold/50 hover:bg-gold/5 transition-all duration-300 group"
              aria-label="Previous image">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-3">
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${index === selectedIndex ? 'w-8 bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]' : 'bg-white/20 hover:bg-white/40'}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={scrollNext}
              className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-gold hover:border-gold/50 hover:bg-gold/5 transition-all duration-300 group"
              aria-label="Next image">
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bottom Quote/Signature */}
        <div className="mt-24 text-center">
          <p className="text-blood font-serif text-sm tracking-[0.5em] uppercase opacity-70 drop-shadow-sm">EST. 2024</p>
        </div>
      </div>
    </section>
  );
}
