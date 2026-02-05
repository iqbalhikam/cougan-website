'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Music, Loader2, TrashIcon } from 'lucide-react';

interface Track {
  id: string;
  filename: string; // Nama file di storage
  url: string;
  size: number;
}

export function MusicManager() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const MAX_STORAGE_BYTES = 100 * 1024 * 1024; // 100 MB
  const totalUsedBytes = tracks.reduce((acc, t) => acc + t.size, 0);
  const remainingBytes = MAX_STORAGE_BYTES - totalUsedBytes;
  const usagePercentage = (totalUsedBytes / MAX_STORAGE_BYTES) * 100;

  // Recommendation Logic
  const songsCount = tracks.length;
  const TARGET_SONGS = 15;
  const remainingSlots = TARGET_SONGS - songsCount;

  let suggestionText = '';
  if (remainingSlots > 0 && remainingBytes > 0) {
    const avgSize = remainingBytes / remainingSlots;
    suggestionText = `Sisa slot: ${remainingSlots}. Agar muat hingga ${TARGET_SONGS} lagu, rata-rata ukuran file: ${(avgSize / 1024 / 1024).toFixed(2)} MB`;
  } else if (remainingBytes > 0) {
    suggestionText = `Storage tersedia: ${(remainingBytes / 1024 / 1024).toFixed(2)} MB. Upload lagu sesuai kapasitas tersisa.`;
  } else {
    suggestionText = 'Storage penuh!';
  }

  // Fetch data saat load
  const fetchTracks = async () => {
    try {
      const res = await fetch('/api/music');
      const data = await res.json();
      if (Array.isArray(data)) setTracks(data);
    } catch (e) {
      console.error('Gagal ambil data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  // Handle Upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/music', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Reset input & refresh list
      e.target.value = '';
      fetchTracks();
      alert('Berhasil upload!');
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, filename: string) => {
    if (!confirm('Yakin ingin menghapus lagu ini?')) return;

    try {
      const res = await fetch('/api/music', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, filename }),
      });

      if (!res.ok) throw new Error('Gagal hapus');

      // Update UI langsung tanpa fetch ulang (Optimistic)
      setTracks((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      alert('Gagal menghapus file' + error);
    }
  };

  const formatSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

  return (
    <div className="space-y-6 p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Music className="w-5 h-5 text-green-400" />
          Music Manager
        </h2>

        <span className="text-sm text-zinc-400">{tracks.length} Lagu Uploaded</span>
      </div>

      {/* Upload Area */}
      <div className="flex flex-col w-full gap-2">
        <div className="flex justify-between text-sm text-zinc-400">
          <span>Storage Used: {formatSize(totalUsedBytes)} / 100 MB</span>
          <span>{usagePercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-2.5 overflow-hidden">
          <div className={`h-2.5 rounded-full ${usagePercentage > 90 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(usagePercentage, 100)}%` }}></div>
        </div>
        <p className="text-xs text-yellow-500 mt-1">{suggestionText}</p>

        <div className="flex gap-4 items-center bg-zinc-800/50 p-4 rounded-lg border border-dashed border-zinc-700 mt-4">
          <Input
            type="file"
            accept="audio/*"
            onChange={handleUpload}
            disabled={uploading || remainingBytes <= 0}
            className="bg-transparent border-0 file:bg-zinc-700 file:text-white file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md hover:file:bg-zinc-600"
          />
          {uploading && <Loader2 className="w-5 h-5 animate-spin text-green-400" />}
        </div>
      </div>

      {/* List Lagu */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center text-zinc-500 py-4">Memuat data...</div>
        ) : tracks.length === 0 ? (
          <div className="text-center text-zinc-500 py-4 italic">Belum ada musik. Upload sekarang!</div>
        ) : (
          tracks.map((track) => (
            <div key={track.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg group hover:bg-zinc-750 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                  <Music className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  {/* Tampilkan nama file yang lebih bersih jika perlu logic split string */}
                  <span className="text-sm text-white font-medium truncate max-w-[200px] md:max-w-md">{track.filename.split('-').slice(1).join('-')}</span>
                  <span className="text-xs text-zinc-500">{formatSize(track.size)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <audio controls className="h-8 w-32 hidden md:block" src={track.url} />
                <Button onClick={() => handleDelete(track.id, track.filename)} className="h-8 w-8 hover:bg-red-600/20 hover:text-red-500">
                  <div>
                    <TrashIcon className="w-4 h-4" />
                  </div>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
