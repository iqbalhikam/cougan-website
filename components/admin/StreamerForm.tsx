'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createStreamer, updateStreamer } from '@/lib/actions/streamers';

import { Streamer } from '@/prisma/generated/prisma/client';

interface StreamerFormProps {
  initialData?: Streamer;
  isEdit?: boolean;
}

export function StreamerForm({ initialData, isEdit = false }: StreamerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    role: initialData?.role || '',
    channelId: initialData?.channelId || '',
    youtubeId: initialData?.youtubeId || '',
    avatar: initialData?.avatar || '',
    status: initialData?.status || 'offline',
    position: initialData?.position || 0,
  });

  const [file, setFile] = useState<File | null>(null);

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const handleUpload = async () => {
    if (!file) return formData.avatar;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    // Upload to 'cougan' bucket, folder 'avatar'
    const { error } = await supabase.storage.from('cougan').upload(`avatar/${fileName}`, file);

    if (error) {
      throw new Error('Upload failed: ' + error.message);
    }

    return fileName; // We store just the filename as agreed, or the path `avatar/filename`
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Upload Image if exists
      const avatarPath = await handleUpload();

      // 2. Normalize Channel ID (Extract Handle or ID from URL)
      let cleanChannelId = formData.channelId.trim();

      // Handle full URLs
      if (cleanChannelId.includes('youtube.com/') || cleanChannelId.includes('youtu.be/')) {
        try {
          const urlObj = new URL(cleanChannelId.startsWith('http') ? cleanChannelId : `https://${cleanChannelId}`);
          const pathname = urlObj.pathname;

          if (pathname.startsWith('/channel/')) {
            // Extract UC... ID
            cleanChannelId = pathname.replace('/channel/', '').split('/')[0];
          } else if (pathname.startsWith('/@')) {
            // Extract @handle
            cleanChannelId = pathname.split('/')[1]; // @handle part
            if (!cleanChannelId.startsWith('@')) cleanChannelId = '@' + cleanChannelId; // Ensure @ prefix
          } else if (pathname.startsWith('/c/') || pathname.startsWith('/user/')) {
            // These are legacy custom URLs, we might not easily map them to ID/Handle without API.
            // Best effort: take the segment.
            cleanChannelId = pathname.split('/').filter(Boolean)[1] || cleanChannelId;
          } else {
            // Root handle like youtube.com/@handle (if pathname is just /@handle)
            if (pathname.startsWith('/@')) {
              cleanChannelId = pathname.substring(1).split('/')[0];
              if (!cleanChannelId.startsWith('@')) cleanChannelId = '@' + cleanChannelId;
            }
          }
        } catch {
          // Invalid URL, keep as is
          console.log('Could not parse URL, using raw input');
        }
      }

      // Ensure handle has @ if user just typed "cougan" (optional heuristics, skipped to avoid enforcing wrong assumptions)
      // But if user typed a handle without @ and it's NOT a UC ID, we might want to assume.
      // For now, let's stick to explicitly extracting from URL or trusting the user input if it's raw.

      // 3. Prepare Payload
      const payload = {
        ...formData,
        channelId: cleanChannelId,
        avatar: avatarPath,
      };

      // 4. Call Server Action
      let result;
      if (isEdit && initialData?.id) {
        result = await updateStreamer(initialData.id, payload);
      } else {
        result = await createStreamer(payload);
      }

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push('/admin');
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-zinc-900 p-8 rounded-xl border border-zinc-700 shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Name</label>
          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-zinc-800 border-zinc-700 focus:border-gold placeholder:text-zinc-600" placeholder="e.g. Cougan" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Role</label>
          <Input value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="bg-zinc-800 border-zinc-700 focus:border-gold placeholder:text-zinc-600" placeholder="e.g. Leader" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">YouTube URL or ID</label>
          <Input
            value={formData.channelId}
            onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
            className="bg-zinc-800 border-zinc-700 focus:border-gold placeholder:text-zinc-600"
            placeholder="https://youtube.com/@handle or UC..."
            required
          />
          <p className="text-[10px] text-zinc-500">Paste full Channel URL or @handle</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Initial Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-zinc-900">
            <option value="offline">Offline</option>
            <option value="live">Live</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Display Order</label>
          <Input type="number" value={formData.position} onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-700" placeholder="0" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-400">Avatar Image</label>
        <div className="flex gap-4 items-center">
          {formData.avatar && !file && <div className="text-xs text-zinc-500">Current: {formData.avatar}</div>}
          <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="bg-zinc-800 border-zinc-700 cursor-pointer" />
        </div>
        <p className="text-xs text-zinc-500">Uploads to cougan/avatar bucket.</p>
      </div>

      {error && <div className="p-3 bg-red-900/50 text-red-200 text-sm rounded border border-red-900">{error}</div>}

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
        <Button type="button" variant="ghost" onClick={() => router.push('/admin')}>
          Cancel
        </Button>
        <Button type="submit" className="bg-gold text-black hover:bg-yellow-500" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update Member' : 'Add Member'}
        </Button>
      </div>
    </form>
  );
}
