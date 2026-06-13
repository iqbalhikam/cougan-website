"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, LogOut, Reply, Pin } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getDiscussions, postPublicDiscussion } from "@/lib/actions/discussion";
import { cn } from "@/lib/utils";

type LocalUser = {
  name: string;
  username: string;
};

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

export function DiscussionDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeReplyParent, setActiveReplyParent] = useState<{ id: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [showEmotes, setShowEmotes] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("cougan_chat_user");
    if (savedUser) {
      try {
        setLocalUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse local user");
      }
    }
  }, []);

  // Fetch initial discussions and subscribe to real-time updates when opened
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel>;

    const loadDataAndSubscribe = async () => {
      setIsLoading(true);
      const initialData = await getDiscussions();
      if (isMounted) {
        setDiscussions(initialData as Discussion[]);
        setIsLoading(false);
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }

      channel = supabase
        .channel("public-realtime-discussions")
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
                // New main thread
                return [newDiscussion, ...prev];
              } else {
                // Reply
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

            // Scroll to bottom if it's a new message
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
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
              });
            });
          }
        )
        .subscribe();
    };

    loadDataAndSubscribe();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isOpen]);

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const username = (formData.get("username") as string) || "";

    const userObj = { name, username };
    localStorage.setItem("cougan_chat_user", JSON.stringify(userObj));
    setLocalUser(userObj);
  };

  const handleLogout = () => {
    localStorage.removeItem("cougan_chat_user");
    setLocalUser(null);
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!localUser) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Inject the local user details
    formData.append("name", localUser.name);
    formData.append("username", localUser.username);

    if (activeReplyParent) {
      formData.append("parentId", activeReplyParent.id);
    }

    setIsSending(true);
    await postPublicDiscussion(formData);
    form.reset();
    setActiveReplyParent(null);
    setIsSending(false);
  };

  const handleReplyClick = (threadId: string, threadName: string) => {
    if (!localUser) {
      nameInputRef.current?.focus();
    } else {
      setActiveReplyParent({ id: threadId, name: threadName });
    }
  };

  const insertEmote = (emoteCode: string) => {
    if (chatInputRef.current) {
      chatInputRef.current.value += ` ${emoteCode} `;
      chatInputRef.current.focus();
    }
    setShowEmotes(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedMessages(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderMessageText = (id: string, text: string, isAdmin: boolean) => {
    const isExpanded = expandedMessages[id];
    const MAX_LENGTH = 150;
    const shouldTruncate = text.length > MAX_LENGTH;
    const displayText = shouldTruncate && !isExpanded ? text.slice(0, MAX_LENGTH) + "..." : text;

    return (
      <div className="mt-1">
        <p className={cn("whitespace-pre-wrap leading-relaxed", isAdmin ? "text-red-100" : "text-zinc-300")}>
          {renderTextWithEmotes(displayText)}
        </p>
        {shouldTruncate && (
          <button 
            onClick={() => toggleExpand(id)} 
            className="text-gold hover:text-yellow-400 text-[10px] mt-1 font-bold uppercase tracking-wider transition-colors"
          >
            {isExpanded ? "Sembunyikan" : "Baca selengkapnya"}
          </button>
        )}
      </div>
    );
  };

  const pinnedDiscussions = discussions.filter(d => d.isPinned);
  const normalDiscussions = [...discussions.filter(d => !d.isPinned)].reverse();

  const renderThread = (thread: Discussion) => (
    <div key={thread.id} className="space-y-2">
      <div className={cn("bg-zinc-900 border rounded p-3 text-sm group relative", thread.isPinned ? "border-gold bg-gold/5" : "border-zinc-800")}>
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-white font-bold flex items-center gap-2">
            {thread.isPinned && <Pin size={12} className="text-gold" />}
            {thread.name} {thread.username && <span className="text-zinc-500 font-normal text-xs">@{thread.username}</span>}
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleReplyClick(thread.id, thread.name)}
              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-gold text-[10px] uppercase tracking-wider transition-opacity flex items-center gap-1"
            >
              <Reply size={10} /> Balas
            </button>
            <span className="text-zinc-600 text-[10px]">{new Date(thread.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>
        {renderMessageText(thread.id, thread.message, thread.isAdmin)}
      </div>

      {/* Replies */}
      {thread.replies && thread.replies.length > 0 && (
        <div className="ml-4 pl-4 border-l border-zinc-800 space-y-2">
          {thread.replies.map((reply) => (
            <div 
              key={reply.id} 
              className={cn(
                "p-3 rounded text-sm border",
                reply.isAdmin 
                  ? "bg-red-950/40 border-red-900/50 relative overflow-hidden" 
                  : "bg-zinc-900 border-zinc-800"
              )}
            >
              {reply.isAdmin && (
                <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
              )}
              <div className="flex justify-between items-baseline mb-1">
                <span className={cn("font-bold", reply.isAdmin ? "text-red-500 flex items-center gap-2" : "text-white")}>
                  {reply.name}
                  {reply.isAdmin && <span className="bg-red-600 text-white font-bold text-[8px] uppercase tracking-wider px-1 py-0.5 rounded">COUGAN SYSTEM</span>}
                </span>
                <span className="text-zinc-600 text-[10px]">{new Date(reply.createdAt).toLocaleTimeString()}</span>
              </div>
              {renderMessageText(reply.id, reply.message, reply.isAdmin)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Global Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gold hover:bg-yellow-500 text-black p-4 rounded-full shadow-[0_0_15px_rgba(255,215,0,0.5)] transition-all transform hover:scale-110 flex items-center justify-center group"
      >
        <MessageSquare size={24} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[450px] bg-background border-l border-zinc-800 shadow-[0_0_40px_rgba(0,0,0,0.8)] z-60 flex flex-col transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-gold" size={20} />
            <h2 className="text-white font-bold tracking-widest uppercase text-sm">Cougan Comms</h2>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          
          {/* Aesthetic Background Watermarks */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center mix-blend-screen">
            <div className="relative w-full h-full opacity-[0.06]">
              <img 
                src="/images/logo/LOGO-COUGAN-transparan.webp" 
                alt="Cougan Logo" 
                className="absolute top-10 -right-10 w-72 h-auto rotate-12 blur-[1px]"
              />
              <img 
                src="/images/logo/swag.webp" 
                alt="Swag Logo" 
                className="absolute bottom-32 -left-12 w-64 h-auto -rotate-12 blur-[1px]"
              />
            </div>
          </div>

          {/* ALWAYS VISIBLE: Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-zinc-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mr-2" />
                Connecting...
              </div>
            ) : discussions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-2">
                <MessageSquare size={32} className="opacity-50" />
                <p>Channel is empty. Start transmitting.</p>
              </div>
            ) : (
              <>
                {/* Pinned Messages stay at the top */}
                {pinnedDiscussions.length > 0 && (
                  <div className="space-y-4 pb-4 border-b border-gold/20 mb-4">
                    {pinnedDiscussions.map(renderThread)}
                  </div>
                )}
                {/* Normal Messages flow upwards (reversed) */}
                {normalDiscussions.map(renderThread)}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* CONDITIONALLY RENDERED: Bottom Input Area */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-2 relative z-10">
            {!localUser ? (
              // GUEST MODE: Identify Form
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gold" />
                <h3 className="text-sm font-bold text-white mb-3">Verifikasi Identitas</h3>
                <form onSubmit={handleRegister} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      ref={nameInputRef}
                      name="name"
                      required
                      placeholder="ALIAS / NAMA *"
                      className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                    />
                    <input
                      name="username"
                      placeholder="USERNAME (OPSIONAL)"
                      className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                    />
                  </div>
                  <button type="submit" className="bg-gold hover:bg-yellow-500 text-black font-bold uppercase tracking-widest text-[10px] p-2 rounded h-[72px] transition-colors flex-1 flex flex-col items-center justify-center gap-1 min-w-[80px]">
                    <LogOut size={16} className="rotate-180" />
                    HUBUNGKAN KONEKSI
                  </button>
                </form>
              </div>
            ) : (
              // IDENTIFIED MODE: Chat Input
              <>
                <div className="flex justify-between items-center text-xs px-2 mb-1">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Terhubung sebagai <span className="text-white font-bold">{localUser.name}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-zinc-500 hover:text-red-500 transition-colors underline decoration-zinc-700 underline-offset-2"
                  >
                    [Ganti Identitas]
                  </button>
                </div>

                {activeReplyParent && (
                  <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-2 rounded text-xs text-zinc-400">
                    <span>Membalas <span className="text-white font-bold">@{activeReplyParent.name}</span></span>
                    <button onClick={() => setActiveReplyParent(null)} className="hover:text-red-500 transition-colors p-1">
                      <X size={14} />
                    </button>
                  </div>
                )}
                
                <form onSubmit={handleSendMessage} className="relative">
                  <textarea
                    ref={chatInputRef}
                    name="message"
                    required
                    disabled={isSending}
                    placeholder="Ketik pesan ke jaringan..."
                    className="w-full bg-black border border-zinc-800 rounded-lg p-3 pr-20 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 resize-none min-h-[50px] max-h-[150px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (e.currentTarget.value.trim()) {
                          const form = e.currentTarget.closest('form');
                          if (form) form.requestSubmit();
                        }
                      }
                    }}
                  />
                  {showEmotes && (
                    <div className="absolute right-2 bottom-12 bg-zinc-900 border border-zinc-700 rounded-lg p-2 flex gap-2 shadow-xl z-20">
                      {Object.entries(EMOTES).map(([code, src]) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => insertEmote(code)}
                          className="p-1 hover:bg-zinc-800 rounded transition-colors"
                          title={code}
                        >
                          <img src={src} alt={code} className="w-8 h-8 object-contain" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <button 
                      type="button"
                      onClick={() => setShowEmotes(!showEmotes)}
                      className="p-2 text-zinc-400 hover:text-gold transition-colors"
                      title="Emotes"
                    >
                      <img src="/images/logo/swag.webp" className="w-4 h-4 opacity-70 hover:opacity-100 object-contain grayscale hover:grayscale-0 transition-all" alt="Emotes" />
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSending}
                      className="p-2 text-zinc-400 hover:text-gold disabled:opacity-50 transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
                <div className="text-center mt-1">
                  <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Cougan Encrypted Network</span>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
