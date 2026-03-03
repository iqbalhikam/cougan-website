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
  // State selectedFile dihapus karena kita langsung upload file yang masuk

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
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

  // --- PERBAIKAN UTAMA DI SINI ---
  // Fungsi ini menangani pemilihan file DAN langsung melakukan upload
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      // Gunakan timestamp biar nama file unik
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error } = await supabase.storage.from('cougan').upload(filePath, file);

      if (error) {
        alert(`Error uploading image: ${error.message}`);
      } else {
        // Refresh gallery setelah sukses
        await fetchImages();
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('An unexpected error occurred during upload.');
    } finally {
      setUploading(false);
      // Reset value input agar user bisa mengupload file yang sama lagi jika mau
      e.target.value = '';
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
    <div className="bg-zinc-900 rounded-xl p-6  border border-zinc-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gold" />
            Gallery Management
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Manage photos in the &quot;La Famiglia&quot; gallery.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchImages} disabled={loading} className="border-zinc-700 hover:bg-zinc-800 hover:text-gold text-black">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Upload Section */}
      <div className=" rounded-lg p-4 mb-8">
        <label
          className={`
      flex flex-col items-center justify-center w-full h-32 
      border-2 border-dashed border-zinc-700 rounded-lg 
      bg-zinc-900/50 hover:bg-gold/10 transition-colors cursor-pointer
      ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
    `}>
          {/* Kondisi Tampilan: Uploading vs Standby */}
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 mb-3 text-gold animate-spin" />
                <p className="mb-2 text-sm text-zinc-400">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mb-3 text-zinc-400" />
                <p className="mb-2 text-sm text-zinc-400">
                  <span className="font-semibold text-gold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-zinc-500">SVG, PNG, JPG or GIF</p>
              </>
            )}
          </div>

          {/* Input Disembunyikan (Hidden) */}
          <Input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={handleDirectUpload} // Menggunakan fungsi gabungan baru
            className="hidden"
          />
        </label>

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
