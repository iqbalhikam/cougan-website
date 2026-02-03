'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { createBacksound, deleteBacksound, toggleBacksoundStatus } from '@/lib/actions/backsound';
import { Trash2, Upload, Music, Loader2, Play, Pause, Power, PowerOff } from 'lucide-react';

interface Backsound {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  createdAt: Date;
}

interface BacksoundManagerProps {
  initialBacksounds: Backsound[];
}

export function BacksoundManager({ initialBacksounds }: BacksoundManagerProps) {
  const [backsounds, setBacksounds] = useState<Backsound[]>(initialBacksounds);
  const [uploading, setUploading] = useState(false);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    try {
      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `backsound/${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage.from('cougan').upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('cougan').getPublicUrl(filePath);

      // 3. Save to Database
      const result = await createBacksound({
        name: file.name,
        url: publicUrl,
      });

      if (result.success && result.data) {
        setBacksounds([result.data as Backsound, ...backsounds]);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, url: string) => {
    if (!confirm('Are you sure you want to delete this backsound?')) return;

    try {
      // Extract file path from URL for storage deletion
      // assumed URL format: .../storage/v1/object/public/cougan/backsound/filename.mp3
      const pathPart = url.split('/cougan/')[1];
      if (pathPart) {
        await supabase.storage.from('cougan').remove([pathPart]);
      }

      const result = await deleteBacksound(id);
      if (result.success) {
        setBacksounds(backsounds.filter((b) => b.id !== id));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting backsound:', error);
      alert('Failed to delete backsound');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const result = await toggleBacksoundStatus(id, !currentStatus);
    if (result.success) {
      setBacksounds(backsounds.map((b) => (b.id === id ? { ...b, isActive: !currentStatus } : b)));
    } else {
      alert('Failed to update status');
    }
  };

  const togglePlay = (url: string) => {
    if (currentPlaying === url) {
      setCurrentPlaying(null);
      const audio = document.getElementById('preview-audio') as HTMLAudioElement;
      if (audio) audio.pause();
    } else {
      setCurrentPlaying(url);
      const audio = document.getElementById('preview-audio') as HTMLAudioElement;
      if (audio) {
        audio.src = url;
        audio.play();
      }
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Music className="w-5 h-5 text-red-500" />
          Backsound Manager
        </h2>
        <div className="relative">
          <input type="file" accept="audio/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploading} />
          <button className={`flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload New'}
          </button>
        </div>
      </div>

      <audio id="preview-audio" className="hidden" onEnded={() => setCurrentPlaying(null)} />

      <div className="space-y-3">
        {backsounds.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">No backsounds uploaded yet.</div>
        ) : (
          backsounds.map((track) => (
            <div key={track.id} className="group flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <button onClick={() => togglePlay(track.url)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 group-hover:bg-red-500/10 text-zinc-400 group-hover:text-red-500 transition-colors shrink-0">
                  {currentPlaying === track.url ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 pl-0.5" />}
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-zinc-200">{track.name}</p>
                  <p className="text-xs text-zinc-500">{new Date(track.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(track.id, track.isActive)}
                  className={`p-2 rounded-lg transition-colors ${track.isActive ? 'text-green-500 hover:bg-green-500/10' : 'text-zinc-500 hover:bg-zinc-800'}`}
                  title={track.isActive ? 'Active' : 'Inactive'}>
                  {track.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(track.id, track.url)} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
