'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Music, Loader2 } from 'lucide-react';

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
    } catch (error: any) {
      alert(error.message);
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
        <span className="text-sm text-zinc-400">{tracks.length} / 15 Slot Terpakai</span>
      </div>

      {/* Upload Area */}
      <div className="flex gap-4 items-center bg-zinc-800/50 p-4 rounded-lg border border-dashed border-zinc-700">
        <Input
          type="file"
          accept="audio/*"
          onChange={handleUpload}
          disabled={uploading || tracks.length >= 15}
          className="bg-transparent border-0 file:bg-zinc-700 file:text-white file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md hover:file:bg-zinc-600"
        />
        {uploading && <Loader2 className="w-5 h-5 animate-spin text-green-400" />}
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
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
