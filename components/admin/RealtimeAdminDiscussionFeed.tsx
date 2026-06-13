"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { postAdminMessage, deleteDiscussion, togglePinDiscussion } from "@/lib/actions/discussion";
import { Pin, Send } from "lucide-react";

type Discussion = {
  id: string;
  name: string;
  username: string | null;
  message: string;
  isAdmin: boolean;
  isPinned: boolean;
  createdAt: Date;
  parentId: string | null;
  replies?: Discussion[];
};

const EMOTES = {
  ":cougan:": "/images/logo/LOGO-COUGAN-transparan.webp",
  ":swag:": "/images/logo/swag.webp",
};

const renderTextWithEmotes = (text: string) => {
  const parts = text.split(/(:cougan:|:swag:)/g);
  return parts.map((part, index) => {
    if (EMOTES[part as keyof typeof EMOTES]) {
      return (
        <img 
          key={index} 
          src={EMOTES[part as keyof typeof EMOTES]} 
          alt={part} 
          className="inline-block w-6 h-6 object-contain align-middle mx-1" 
        />
      );
    }
    return part;
  });
};

export default function RealtimeAdminDiscussionFeed({
  initialDiscussions,
}: {
  initialDiscussions: Discussion[];
}) {
  const [discussions, setDiscussions] = useState<Discussion[]>(initialDiscussions);
  const [isSending, setIsSending] = useState(false);
  const topFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel("admin-realtime-discussions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "discussions" },
        (payload) => {
          const newDoc = payload.new as any;
          const newDiscussion: Discussion = {
            ...newDoc,
            createdAt: new Date(newDoc.created_at),
            parentId: newDoc.parent_id,
            isPinned: newDoc.isPinned || false,
          };

          setDiscussions((prev) => {
            if (!newDiscussion.parentId) {
              // It's a new main thread, prepend it
              return [newDiscussion, ...prev];
            } else {
              // It's a reply
              return prev.map((thread) => {
                if (thread.id === newDiscussion.parentId) {
                  return {
                    ...thread,
                    replies: [...(thread.replies || []), newDiscussion],
                  };
                }
                return thread;
              });
            }
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "discussions" },
        (payload) => {
           const oldDoc = payload.old as any;
           setDiscussions((prev) => {
             const filtered = prev.filter((thread) => thread.id !== oldDoc.id);
             return filtered.map((thread) => ({
               ...thread,
               replies: thread.replies?.filter(reply => reply.id !== oldDoc.id) || []
             }));
           });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "discussions" },
        (payload) => {
          const updatedDoc = payload.new as any;
          setDiscussions((prev) => {
            return prev.map((thread) => {
              if (thread.id === updatedDoc.id) {
                return { ...thread, isPinned: updatedDoc.isPinned };
              }
              return thread;
            }).sort((a, b) => {
              // Sort to ensure pinned stay at top
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return 0; // retain existing order otherwise
            });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTopFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsSending(true);
    await postAdminMessage(formData);
    topFormRef.current?.reset();
    setIsSending(false);
  };

  return (
    <div className="space-y-8">
      {/* Top-Level Admin Announcement Form */}
      <div className="bg-red-950/20 border-2 border-red-900/50 rounded-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
        <h2 className="text-red-500 font-bold uppercase tracking-widest mb-4 text-sm flex items-center gap-2">
          Global Announcement <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded">SYSTEM OVERRIDE</span>
        </h2>
        <form ref={topFormRef} onSubmit={handleTopFormSubmit} className="space-y-3">
          <textarea
            name="message"
            required
            disabled={isSending}
            placeholder="Broadcast a top-level message to all connected clients..."
            className="w-full bg-black border border-red-900/50 rounded p-3 text-sm text-red-100 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 resize-y min-h-[80px]"
          />
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={isSending}
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded text-sm font-bold transition-colors uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
            >
              <Send size={16} />
              {isSending ? "Transmitting..." : "Kirim Pengumuman Sistem"}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        {discussions.map((thread) => (
          <div key={thread.id} className={`bg-zinc-900 border rounded-lg p-6 space-y-4 ${thread.isPinned ? "border-gold" : "border-zinc-800"}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-emerald-400 font-bold flex items-center gap-2">
                  {thread.isPinned && <Pin size={16} className="text-gold" />}
                  {thread.name} {thread.username && <span className="text-zinc-500 font-normal">@{thread.username}</span>}
                </h3>
                <p className="text-zinc-400 text-sm mt-1 whitespace-pre-wrap leading-relaxed">{renderTextWithEmotes(thread.message)}</p>
                <p className="text-zinc-600 text-xs mt-2">{new Date(thread.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <form action={async (formData) => { await togglePinDiscussion(formData); }}>
                  <input type="hidden" name="id" value={thread.id} />
                  <button type="submit" className="text-zinc-500 hover:text-gold p-2 rounded text-sm transition-colors flex items-center gap-1">
                    <Pin size={14} /> {thread.isPinned ? "Unpin" : "Pin"}
                  </button>
                </form>
                <form action={async (formData) => { await deleteDiscussion(formData); }}>
                  <input type="hidden" name="id" value={thread.id} />
                  <button type="submit" className="text-red-500 hover:bg-red-500/10 p-2 rounded text-sm transition-colors">
                    Delete Thread
                  </button>
                </form>
              </div>
            </div>

            {/* Existing Replies */}
            {thread.replies && thread.replies.length > 0 && (
              <div className="pl-4 border-l-2 border-zinc-800 space-y-3 mt-4">
                {thread.replies.map((reply) => (
                  <div key={reply.id} className="bg-zinc-950 p-3 rounded border border-zinc-800 flex justify-between items-start">
                    <div>
                        <span className={reply.isAdmin ? "text-gold font-bold text-sm" : "text-emerald-400 font-bold text-sm"}>
                          {reply.name} {reply.isAdmin && <span className="bg-gold text-black text-[10px] px-1 rounded ml-2">ADMIN</span>}
                        </span>
                        <p className="text-zinc-400 text-sm mt-1 whitespace-pre-wrap leading-relaxed">{renderTextWithEmotes(reply.message)}</p>
                    </div>
                    <form action={async (formData) => { await deleteDiscussion(formData); }}>
                        <input type="hidden" name="id" value={reply.id} />
                        <button type="submit" className="text-red-500/50 hover:text-red-500 text-xs transition-colors">
                          Delete
                        </button>
                      </form>
                  </div>
                ))}
              </div>
            )}

            {/* Admin Reply Form */}
            <div className="pt-4 border-t border-zinc-800 mt-4">
              <form action={async (formData) => { await postAdminMessage(formData); }} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <input type="hidden" name="parentId" value={thread.id} />
                <textarea
                  name="message"
                  required
                  placeholder="Reply as COUGAN SYSTEM..."
                  className="w-full sm:flex-1 bg-black border border-zinc-800 rounded p-2 text-sm text-zinc-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 resize-y min-h-[40px]"
                />
                <button type="submit" className="w-full sm:w-auto bg-gold hover:bg-yellow-500 text-black px-4 py-2 rounded text-sm font-bold transition-colors whitespace-nowrap">
                  Reply as Admin
                </button>
              </form>
            </div>
          </div>
        ))}

        {discussions.length === 0 && (
          <p className="text-zinc-500 text-center py-8">No discussions found.</p>
        )}
      </div>
    </div>
  );
}
