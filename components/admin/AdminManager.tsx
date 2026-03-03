'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, UserPlus, Shield } from 'lucide-react';
import { addAdmin, removeAdmin } from '@/lib/actions/admin-management';
import { useRouter } from 'next/navigation';

interface Admin {
  id: string;
  email: string;
  createdAt: Date;
}

interface AdminManagerProps {
  initialAdmins: Admin[];
}

export function AdminManager({ initialAdmins }: AdminManagerProps) {
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    setLoading(true);
    try {
      await addAdmin(newEmail, newPassword);
      setNewEmail('');
      setNewPassword('');
      router.refresh(); // Refresh server component to get latest list
      // Optimistically update or wait for refresh?
      // For simplicity, we'll let router.refresh handle it, but we can also manually update local state if we returned the new admin from server action.
      // Since server component passes initialAdmins, we might drift if we don't reload.
      // Ideally getAdmins should be called client side or we rely on router.refresh()
    } catch (error) {
      console.error('Failed to add admin:', error);
      alert('Failed to add admin');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;

    try {
      await removeAdmin(id);
      setAdmins(admins.filter((a) => a.id !== id));
      router.refresh();
    } catch (error) {
      console.error('Failed to remove admin:', error);
      alert('Failed to remove admin');
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-gold" />
          Admin Management
        </h2>
        <p className="text-zinc-400 text-sm mt-1">Manage regular admins who can manage content. If you provide a password, a new user account will be created.</p>
      </div>

      <form onSubmit={handleAddAdmin} className="flex flex-col md:flex-row gap-4 mb-8 items-end">
        <div className="w-full">
          <Input type="email" placeholder="New admin email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" required />
        </div>
        <div className="w-full">
          <Input type="password" placeholder="Password (for new account)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
        </div>
        <Button type="submit" disabled={loading} className="bg-gold text-black hover:bg-yellow-500 whitespace-nowrap w-full md:w-auto">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Admin
        </Button>
      </form>

      <div className="space-y-4">
        {admins.map((admin) => (
          <div key={admin.id} className="flex justify-between items-center bg-zinc-950 p-4 rounded-lg border border-zinc-800">
            <div>
              <p className="text-white font-medium">{admin.email}</p>
              <p className="text-xs text-zinc-500">Added: {new Date(admin.createdAt).toLocaleDateString('id-ID')}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleRemoveAdmin(admin.id)} className="text-zinc-400 hover:text-red-500 hover:bg-zinc-900">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {admins.length === 0 && <p className="text-zinc-500 text-center py-4">No regular admins added yet.</p>}
      </div>
    </div>
  );
}
