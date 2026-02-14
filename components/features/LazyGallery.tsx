'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const Gallery = dynamic(() => import('@/components/features/Gallery').then((mod) => mod.Gallery), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center py-32 bg-black">
      <Loader2 className="w-8 h-8 animate-spin text-gold" />
    </div>
  ),
});

export function LazyGallery() {
  return <Gallery />;
}
