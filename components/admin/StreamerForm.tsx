'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createStreamer, updateStreamer } from '@/lib/actions/streamers';
import { getRoles, createRole } from '@/lib/actions/roles'; // Import actions

import { Streamer, Role } from '@/prisma/generated/prisma/client'; // Import Role type

interface StreamerFormProps {
  initialData?: Streamer & { role: Role }; // Ensure initialData includes role relation
  isEdit?: boolean;
}

export function StreamerForm({ initialData, isEdit = false }: StreamerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]); // State for roles
  const [newRoleName, setNewRoleName] = useState('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    roleId: initialData?.roleId || '', // Use roleId
    channelId: initialData?.channelId || '',
    youtubeId: initialData?.youtubeId || '',
    avatar: initialData?.avatar || '',
    status: initialData?.status || 'offline',
    position: initialData?.position || 0,
  });

  const [file, setFile] = useState<File | null>(null);

  // Fetch roles on mount
  useEffect(() => {
    async function fetchRoles() {
      const fetchedRoles = await getRoles();
      setRoles(fetchedRoles);
      // If no role selected yet and roles exist, select the first one (or keep empty)
      if (!formData.roleId && fetchedRoles.length > 0 && !isEdit) {
        setFormData((prev) => ({ ...prev, roleId: fetchedRoles[0].id }));
      }
    }
    fetchRoles();
  }, [formData.roleId, isEdit]);

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const handleUpload = async () => {
    if (!file) return formData.avatar;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error } = await supabase.storage.from('cougan').upload(`avatar/${fileName}`, file);

    if (error) {
      throw new Error('Upload failed: ' + error.message);
    }

    return fileName;
  };

  const handleCreateNewRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      const result = await createRole(newRoleName);
      if (result.success && result.data) {
        setRoles((prev) => [...prev, result.data!]);
        setFormData((prev) => ({ ...prev, roleId: result.data!.id }));
        setIsCreatingRole(false);
        setNewRoleName('');
      } else {
        alert('Failed to create role');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating role');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const avatarPath = await handleUpload();
      let cleanChannelId = formData.channelId.trim();

      if (cleanChannelId.includes('youtube.com/') || cleanChannelId.includes('youtu.be/')) {
        try {
          const urlObj = new URL(cleanChannelId.startsWith('http') ? cleanChannelId : `https://${cleanChannelId}`);
          const pathname = urlObj.pathname;

          if (pathname.startsWith('/channel/')) {
            cleanChannelId = pathname.replace('/channel/', '').split('/')[0];
          } else if (pathname.startsWith('/@')) {
            cleanChannelId = pathname.split('/')[1];
            if (!cleanChannelId.startsWith('@')) cleanChannelId = '@' + cleanChannelId;
          } else if (pathname.startsWith('/c/') || pathname.startsWith('/user/')) {
            cleanChannelId = pathname.split('/').filter(Boolean)[1] || cleanChannelId;
          } else {
            if (pathname.startsWith('/@')) {
              cleanChannelId = pathname.substring(1).split('/')[0];
              if (!cleanChannelId.startsWith('@')) cleanChannelId = '@' + cleanChannelId;
            }
          }
        } catch {
          console.log('Could not parse URL, using raw input');
        }
      }

      const payload = {
        ...formData,
        channelId: cleanChannelId,
        avatar: avatarPath,
      };

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
          <div className="flex gap-2">
            {!isCreatingRole ? (
              <>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-zinc-900"
                  required>
                  <option value="" disabled>
                    Select Role
                  </option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="outline" onClick={() => setIsCreatingRole(true)} className="px-3 border-zinc-700 hover:bg-zinc-800 text-gold">
                  +
                </Button>
              </>
            ) : (
              <div className="flex gap-2 w-full">
                <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="New Role Name" className="bg-zinc-800 border-zinc-700" />
                <Button type="button" onClick={handleCreateNewRole} className="bg-gold text-black hover:bg-yellow-500">
                  Save
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsCreatingRole(false)}>
                  X
                </Button>
              </div>
            )}
          </div>
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
