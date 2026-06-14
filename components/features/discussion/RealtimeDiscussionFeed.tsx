"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Discussion = {
  id: string;
  name: string;
  username: string | null;
  message: string;
  isAdmin: boolean;
  createdAt: Date;
  parentId: string | null;
  replies?: Discussion[];
};

export default function RealtimeDiscussionFeed({
  initialDiscussions,
}: {
  initialDiscussions: Discussion[];
}) {
  const [discussions, setDiscussions] = useState<Discussion[]>(initialDiscussions);

  useEffect(() => {
    // We assume the schema name is 'public' and table is 'discussions'
    const channel = supabase
      .channel("realtime-discussions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "discussions" },
        (payload) => {
          const newDoc = payload.new as any;
          // Parse the date properly since it comes as string from Supabase Postgres
          const newDiscussion: Discussion = {
            ...newDoc,
            createdAt: new Date(newDoc.created_at),
            parentId: newDoc.parent_id,
          };

          setDiscussions((current) => {
            if (!newDiscussion.parentId) {
              // It's a new main thread, add to top
              return [newDiscussion, ...current];
            } else {
              // It's a reply, find the parent and push to replies
              return current.map((thread) => {
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
           setDiscussions((current) => {
             // If it's a main thread, remove it
             const filtered = current.filter((thread) => thread.id !== oldDoc.id);
             // If it's a reply, remove it from the replies
             return filtered.map((thread) => ({
               ...thread,
               replies: thread.replies?.filter(reply => reply.id !== oldDoc.id) || []
             }));
           });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      {discussions.map((thread) => (
        <div key={thread.id} className="border border-zinc-800 bg-zinc-950/50 p-4 rounded-lg flex flex-col gap-2 font-mono text-sm text-zinc-300">
          <div className="flex justify-between items-start border-b border-zinc-800 pb-2 mb-2">
            <div>
              <span className="text-emerald-400 font-bold">{thread.name}</span>
              {thread.username && <span className="text-zinc-500 ml-2">@{thread.username}</span>}
            </div>
            <span className="text-zinc-600 text-xs">
              {new Date(thread.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="whitespace-pre-wrap">{thread.message.replaceAll(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cougan/`, "/cdn/")}</p>

          {thread.replies && thread.replies.length > 0 && (
            <div className="mt-4 pl-4 border-l-2 border-zinc-800 space-y-4">
              {thread.replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`p-3 rounded-md flex flex-col gap-1 ${
                    reply.isAdmin
                      ? "bg-red-950/40 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                      : "bg-zinc-900/50 border border-zinc-800"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {reply.isAdmin && (
                        <span className="bg-red-500 text-black px-1.5 py-0.5 text-[10px] font-black tracking-wider rounded-sm animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                          COUGAN SYSTEM
                        </span>
                      )}
                      <span className={reply.isAdmin ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                        {reply.name}
                      </span>
                      {reply.username && !reply.isAdmin && (
                        <span className="text-zinc-500">@{reply.username}</span>
                      )}
                    </div>
                    <span className="text-zinc-600 text-xs">
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className={`whitespace-pre-wrap ${reply.isAdmin ? "text-red-200" : "text-zinc-300"}`}>
                    {reply.message.replaceAll(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cougan/`, "/cdn/")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {discussions.length === 0 && (
        <div className="text-center py-10 text-zinc-500 font-mono">
          No active discussions. Initialize sequence...
        </div>
      )}
    </div>
  );
}
