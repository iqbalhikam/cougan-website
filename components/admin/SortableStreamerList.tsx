'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { deleteStreamer, updateStreamerPositions } from '@/lib/actions/streamers';
import { GripVertical, Edit2, Trash2 } from 'lucide-react';
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
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-zinc-900 border border-zinc-800 rounded-lg mb-3 md:mb-0 md:rounded-none md:border-b md:border-t-0 md:border-x-0 last:border-b-0 hover:bg-zinc-800/50 transition-colors ${
        isDragging ? 'bg-zinc-800 shadow-xl border-zinc-700' : ''
      }`}>
      {/* Container untuk Layout Grid Desktop & Flex Mobile */}
      <div className="flex flex-col md:grid md:grid-cols-[50px_1fr_1fr_100px_100px] items-center p-4 gap-4">
        {/* Drag Handle - Mobile: Top Right, Desktop: First Col */}
        <div className="flex justify-between w-full md:w-auto md:contents">
          {/* Mobile Label for Name (Hidden on Desktop because of Grid) */}
          <div className="md:hidden font-bold text-lg text-white">{streamer.name}</div>

          <button {...attributes} {...listeners} className="cursor-grab hover:text-white text-zinc-500 p-1 md:p-0">
            <GripVertical size={20} />
          </button>
        </div>

        {/* Name - Desktop Only (Mobile name is above) */}
        <div className="hidden md:block font-medium text-white max-w-full truncate">{streamer.name}</div>

        {/* Role */}
        <div className="w-full md:w-auto flex justify-between md:block text-sm">
          <span className="md:hidden text-zinc-500 uppercase text-xs font-bold">Role</span>
          <span className="text-zinc-300">{streamer.role?.name || 'Unknown'}</span>
        </div>

        {/* Status */}
        <div className="w-full md:w-auto flex justify-between md:block">
          <span className="md:hidden text-zinc-500 uppercase text-xs font-bold">Status</span>
          <span className={`px-2 py-1 rounded text-[10px] md:text-xs font-bold uppercase inline-block ${streamer.status === 'live' ? 'bg-red-600/20 text-red-500' : 'bg-zinc-700/50 text-zinc-500'}`}>{streamer.status}</span>
        </div>

        {/* Actions */}
        <div className="flex w-full md:w-auto gap-2 justify-end mt-2 md:mt-0">
          <Link href={`/admin/edit/${streamer.id}`}>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-zinc-700 text-gold hover:bg-zinc-800">
              <Edit2 size={14} />
            </Button>
          </Link>
          <Button
            className="h-8 w-8 p-0 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-900/50"
            size="sm"
            onClick={async () => {
              if (confirm('Are you sure you want to delete this streamer?')) {
                await deleteStreamer(streamer.id);
              }
            }}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SortableStreamerList({ initialStreamers }: SortableStreamerListProps) {
  const [streamers, setStreamers] = useState(initialStreamers);
  const [isSaving, setIsSaving] = useState(false);
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

  if (!mounted) {
    return <div className="p-8 text-center text-zinc-500 bg-zinc-900 rounded-lg border border-zinc-800">Loading list...</div>;
  }

  return (
    <div className="space-y-4">
      {isSaving && <div className="p-2 text-xs text-center bg-blue-500/20 text-blue-200 rounded border border-blue-500/30">Saving order...</div>}

      {/* List Container */}
      <div className="bg-transparent md:bg-zinc-900 md:border md:border-zinc-800 md:rounded-lg overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:grid md:grid-cols-[50px_1fr_1fr_100px_100px] gap-4 p-4 bg-zinc-800/50 text-zinc-400 font-bold uppercase text-xs border-b border-zinc-800">
          <div></div>
          <div>Name</div>
          <div>Role</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>

        {/* Sortable Area */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex flex-col">
            <SortableContext items={streamers.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {streamers.map((streamer) => (
                <SortableItem key={streamer.id} streamer={streamer} />
              ))}
              {streamers.length === 0 && <div className="p-12 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg md:border-0">No streamers found.</div>}
            </SortableContext>
          </div>
        </DndContext>
      </div>
    </div>
  );
}
