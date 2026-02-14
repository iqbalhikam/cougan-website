'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, Upload, Image as ImageIcon, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Initialize Supabase client
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface GalleryItem {
  name: string;
  url: string;
}

export function GalleryManager() {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      // List files in 'gallery' folder of 'cougan' bucket
      const { data, error } = await supabase.storage.from('cougan').list('gallery', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (error) {
        console.error('Error fetching images:', error);
        return;
      }

      if (data) {
        const imageList = data
          .filter((item) => item.name !== '.emptyFolderPlaceholder')
          .map((item) => {
            const { data: publicUrlData } = supabase.storage.from('cougan').getPublicUrl(`gallery/${item.name}`);
            return {
              name: item.name,
              url: publicUrlData.publicUrl,
            };
          });
        setImages(imageList);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error } = await supabase.storage.from('cougan').upload(filePath, selectedFile);

      if (error) {
        alert(`Error uploading image: ${error.message}`);
      } else {
        setSelectedFile(null);
        // Reset file input if possible, or just let React handle it via key
        // Refetch images
        await fetchImages();
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('An unexpected error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageName: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const { error } = await supabase.storage.from('cougan').remove([`gallery/${imageName}`]);

      if (error) {
        alert(`Error deleting image: ${error.message}`);
      } else {
        setImages(images.filter((img) => img.name !== imageName));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gold" />
            Gallery Management
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Manage photos in the &quot;La Famiglia&quot; gallery.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchImages} disabled={loading} className="border-zinc-700 hover:bg-zinc-800 text-zinc-300">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Upload Section */}
      <div className="bg-black/40 rounded-lg p-4 mb-8 border border-zinc-800/50">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Upload New Image</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gold/10 file:text-gold hover:file:bg-gold/20 text-zinc-300 bg-zinc-900/50 border-zinc-700"
          />
          <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="bg-gold text-black hover:bg-yellow-500 min-w-[120px]">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-zinc-500 mt-2">Recommended aspect ratio: 4:5 (Portrait) or 16:9 (Landscape). Max size: 5MB.</p>
      </div>

      {/* Image Grid */}
      {loading && images.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-lg">
          <ImageIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">No images found in gallery.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <AnimatePresence>
            {images.map((img) => (
              <motion.div
                key={img.name}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative aspect-square bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
                <Image src={img.url} alt={img.name} fill className="object-cover transition-transform duration-300 group-hover:scale-110" sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw" />

                {/* Overlay with Delete Button */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(img.name)} className="rounded-full w-10 h-10 hover:bg-red-600" title="Delete Image">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>

                {/* File Name (Truncated) */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1 text-[10px] text-zinc-400 truncate">{img.name}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
