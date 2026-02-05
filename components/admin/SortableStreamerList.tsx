'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { deleteStreamer, updateStreamerPositions } from '@/lib/actions/streamers';
import { GripVertical } from 'lucide-react';
import { Streamer } from '@/types';

interface SortableStreamerListProps {
  initialStreamers: Streamer[];
}

function SortableItem({ streamer }: { streamer: Streamer }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: streamer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    position: isDragging ? 'relative' : 'static',
    opacity: isDragging ? 0.8 : 1,
  } as React.CSSProperties;

  return (
    <tr ref={setNodeRef} style={style} className={`hover:bg-zinc-800/50 ${isDragging ? 'bg-zinc-800 shadow-xl' : ''}`}>
      <td className="p-4 w-10">
        <button {...attributes} {...listeners} className="cursor-grab hover:text-white text-zinc-500">
          <GripVertical size={20} />
        </button>
      </td>
      <td className="p-4 font-medium">{streamer.name}</td>
      <td className="p-4 text-zinc-400">{streamer.role}</td>
      <td className="p-4">
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${streamer.status === 'live' ? 'bg-red-600/20 text-red-500' : 'bg-zinc-700/50 text-zinc-500'}`}>{streamer.status}</span>
      </td>
      <td className="p-4 text-right space-x-2">
        <Link href={`/admin/edit/${streamer.id}`}>
          <Button variant="outline" size="sm" className="border-zinc-700 text-black bg-gold hover:bg-yellow-500 ">
            Edit
          </Button>
        </Link>
        <Button
          className="bg-red-600 hover:bg-red-700 text-white"
          size="sm"
          onClick={async () => {
            if (confirm('Are you sure you want to delete this streamer?')) {
              await deleteStreamer(streamer.id);
            }
          }}>
          Delete
        </Button>
      </td>
    </tr>
  );
}

export function SortableStreamerList({ initialStreamers }: SortableStreamerListProps) {
  const [streamers, setStreamers] = useState(initialStreamers);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ SOLUSI HYDRATION: Tambahkan state mounted
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setStreamers(initialStreamers);
  }, [initialStreamers]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = streamers.findIndex((item) => item.id === active.id);
      const newIndex = streamers.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(streamers, oldIndex, newIndex);
      setStreamers(newItems);

      const updates = newItems.map((item, index) => ({
        id: item.id,
        position: index,
      }));

      setIsSaving(true);
      try {
        await updateStreamerPositions(updates);
      } catch (error) {
        console.error('Failed to save order:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // ✅ JANGAN render DndContext sebelum mounted
  if (!mounted) {
    return <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden p-8 text-center text-zinc-500">Loading list...</div>;
  }

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
      {isSaving && <div className="p-2 text-xs text-center bg-blue-500/20 text-blue-200">Saving order...</div>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className="w-full text-left">
          <thead className="bg-zinc-800 text-zinc-400 uppercase text-xs">
            <tr>
              <th className="p-4 w-10"></th>
              <th className="p-4">Name</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            <SortableContext items={streamers.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {streamers.map((streamer) => (
                <SortableItem key={streamer.id} streamer={streamer} />
              ))}
              {streamers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    No streamers found.
                  </td>
                </tr>
              )}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}
