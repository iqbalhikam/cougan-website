"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, LogOut, Reply, Pin, SmilePlus, Copy, Check, Sticker, ChevronLeft, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getThreads, getThreadReplies, createThread, replyToThread, toggleReaction } from "@/lib/actions/discussion";
import { getCustomStickers } from "@/lib/actions/stickers";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type LocalUser = {
  name: string;
  username: string;
};

type Discussion = {
  id: string;
  title: string | null;
  name: string;
  username: string | null;
  message: string;
  isAdmin: boolean;
  isPinned: boolean;
  createdAt: Date;
  parentId: string | null;
  replies?: Discussion[];
  _count?: { replies: number };
  reactions?: Record<string, string[]>;
};

type CustomSticker = {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: Date;
};

const EMOTES = {
  ":cougan:": "/images/logo/LOGO-COUGAN-transparan.webp",
  ":swag:": "/images/logo/swag.webp",
};

const preprocessMarkdown = (text: string) => {
  let processed = text;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseBaseUrl = `${supabaseUrl}/storage/v1/object/public/cougan/`;
  if (processed && processed.includes(supabaseBaseUrl)) {
    processed = processed.replaceAll(supabaseBaseUrl, "/cdn/");
  }
  Object.entries(EMOTES).forEach(([code, src]) => {
    processed = processed.split(code).join(`![emote_${code.replace(/:/g, '')}](${src})`);
  });
  return processed;
};

export function DiscussionDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  
  // Two-View State
  const [view, setView] = useState<'list' | 'thread'>('list');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  
  // Data State
  const [threads, setThreads] = useState<Discussion[]>([]);
  const [activeThread, setActiveThread] = useState<Discussion | null>(null);
  const [customStickers, setCustomStickers] = useState<CustomSticker[]>([]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [showEmotes, setShowEmotes] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

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

  // Fetch initial data & Realtime subscriptions
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel>;

    const loadDataAndSubscribe = async () => {
      setIsLoading(true);
      const stickersData = await getCustomStickers();
      if (isMounted) setCustomStickers(stickersData);

      if (view === 'list') {
        const threadsData = await getThreads();
        if (isMounted) {
          setThreads(threadsData as Discussion[]);
          setIsLoading(false);
        }

        channel = supabase
          .channel("public-realtime-threads")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "discussions", filter: "parent_id=is.null" },
            (payload) => {
              const newDoc = payload.new as any;
              const newThread: Discussion = {
                ...newDoc,
                title: newDoc.title,
                createdAt: new Date(newDoc.created_at),
                parentId: newDoc.parent_id,
                isPinned: newDoc.isPinned || false,
                reactions: typeof newDoc.reactions === 'string' ? JSON.parse(newDoc.reactions) : (newDoc.reactions || {}),
                _count: { replies: 0 }
              };
              setThreads((prev) => [newThread, ...prev]);
            }
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "discussions" },
            (payload) => {
              const updatedDoc = payload.new as any;
              const parsedReactions = typeof updatedDoc.reactions === 'string' ? JSON.parse(updatedDoc.reactions) : (updatedDoc.reactions || {});
              setThreads((prev) => prev.map((t) => t.id === updatedDoc.id ? { ...t, isPinned: updatedDoc.isPinned, reactions: parsedReactions } : t));
            }
          )
          .subscribe();

      } else if (view === 'thread' && activeThreadId) {
        const threadData = await getThreadReplies(activeThreadId);
        if (isMounted) {
          setActiveThread(threadData as Discussion);
          setIsLoading(false);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }

        channel = supabase
          .channel(`public-realtime-replies-${activeThreadId}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "discussions", filter: `parent_id=eq.${activeThreadId}` },
            (payload) => {
              const newDoc = payload.new as any;
              const newReply: Discussion = {
                ...newDoc,
                createdAt: new Date(newDoc.created_at),
                parentId: newDoc.parent_id,
                isPinned: newDoc.isPinned || false,
                reactions: typeof newDoc.reactions === 'string' ? JSON.parse(newDoc.reactions) : (newDoc.reactions || {}),
              };
              setActiveThread((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  replies: [...(prev.replies || []), newReply]
                };
              });
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
              const parsedReactions = typeof updatedDoc.reactions === 'string' ? JSON.parse(updatedDoc.reactions) : (updatedDoc.reactions || {});
              
              setActiveThread((prev) => {
                if (!prev) return prev;
                if (prev.id === updatedDoc.id) {
                  return { ...prev, isPinned: updatedDoc.isPinned, reactions: parsedReactions };
                }
                return {
                  ...prev,
                  replies: (prev.replies || []).map((r) => 
                    r.id === updatedDoc.id ? { ...r, isPinned: updatedDoc.isPinned, reactions: parsedReactions } : r
                  )
                };
              });
            }
          )
          .subscribe();
      }
    };

    loadDataAndSubscribe();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [isOpen, view, activeThreadId]);

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

  const handleCreateThread = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!localUser) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;

    setIsSending(true);
    await createThread(title, message, localUser.name, localUser.username);
    form.reset();
    setShowCreateThread(false);
    setIsSending(false);
  };

  const handleReplyMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!localUser || !activeThreadId) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const message = formData.get("message") as string;

    setIsSending(true);
    await replyToThread(activeThreadId, message, localUser.name, localUser.username);
    form.reset();
    setIsSending(false);
  };

  const insertEmote = (emoteCode: string) => {
    if (chatInputRef.current) {
      chatInputRef.current.value += ` ${emoteCode} `;
      chatInputRef.current.focus();
    }
    setShowEmotes(false);
  };

  const insertCustomSticker = (name: string, url: string) => {
    if (chatInputRef.current) {
      chatInputRef.current.value += ` ![Sticker: ${name}](${url}) `;
      chatInputRef.current.focus();
    }
    setShowEmotes(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedMessages(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!localUser) return;
    setActiveReactionId(null);
    await toggleReaction(messageId, emoji, localUser.username || localUser.name);
  };

  const renderMessageContent = (id: string, text: string, isAdmin: boolean) => {
    const isExpanded = expandedMessages[id];
    const MAX_LENGTH = 300;
    const shouldTruncate = text.length > MAX_LENGTH;
    const displayText = shouldTruncate && !isExpanded ? text.slice(0, MAX_LENGTH) + "..." : text;
    const processedText = preprocessMarkdown(displayText);

    return (
      <div className="mt-1">
        <div className={cn(
          "prose prose-invert prose-sm max-w-none",
          "prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-pre:text-xs",
          "prose-img:inline-block prose-img:m-0 prose-img:align-middle prose-img:w-6 prose-img:h-6 prose-img:object-contain",
          "prose-a:text-gold hover:prose-a:text-yellow-400 prose-a:no-underline",
          isAdmin ? "text-red-100" : "text-zinc-300"
        )}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {processedText}
          </ReactMarkdown>
        </div>
        {shouldTruncate && (
          <button 
            onClick={() => toggleExpand(id)} 
            className="text-gold hover:text-yellow-400 text-[10px] mt-2 font-bold uppercase tracking-wider transition-colors"
          >
            {isExpanded ? "Sembunyikan" : "Baca selengkapnya"}
          </button>
        )}
      </div>
    );
  };

  const renderMessageActions = (thread: Discussion) => (
    <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-700 rounded-md shadow-lg flex items-center p-0.5 gap-0.5 z-20">
      <div className="relative">
        <button onClick={(e) => { e.stopPropagation(); setActiveReactionId(activeReactionId === thread.id ? null : thread.id); }} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors" title="React">
          <SmilePlus size={14} />
        </button>
        {activeReactionId === thread.id && (
          <div className="absolute top-full right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg p-1.5 flex flex-wrap gap-1 shadow-xl z-50 w-48 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700" onClick={(e) => e.stopPropagation()}>
            {customStickers.map(sticker => (
              <button key={sticker.id} onClick={(e) => { e.stopPropagation(); handleReaction(thread.id, sticker.imageUrl); }} className="relative w-8 h-8 flex items-center justify-center hover:bg-zinc-800 hover:scale-110 rounded transition-all" title={sticker.name}>
                <img src={sticker.imageUrl} alt={sticker.name} className="w-full h-full object-contain p-0.5" />
              </button>
            ))}
          </div>
        )}
      </div>
      
      <button onClick={(e) => { e.stopPropagation(); handleCopy(thread.id, thread.message); }} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors" title="Copy">
        {copiedMessageId === thread.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
      </button>
    </div>
  );

  const renderReactions = (thread: Discussion) => {
    if (!thread.reactions || Object.keys(thread.reactions).length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(thread.reactions).map(([emoji, users]) => {
          if (users.length === 0) return null;
          const hasReacted = localUser && users.includes(localUser.username || localUser.name);
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseBaseUrl = `${supabaseUrl}/storage/v1/object/public/cougan/`;
          const displayEmoji = emoji.includes(supabaseBaseUrl) ? emoji.replace(supabaseBaseUrl, "/cdn/") : emoji;
          return (
              <button
              key={emoji}
              onClick={(e) => { e.stopPropagation(); handleReaction(thread.id, emoji); }}
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border transition-colors",
                hasReacted 
                  ? "bg-gold/20 border-gold/50 text-gold" 
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
              title={users.join(', ')}
            >
              {displayEmoji.startsWith('http') || displayEmoji.startsWith('/') ? (
                <img src={displayEmoji} alt="sticker" className="w-4 h-4 object-contain" />
              ) : (
                <span>{displayEmoji}</span>
              )}
              <span className="font-medium">{users.length}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const pinnedThreads = threads.filter(d => d.isPinned);
  const normalThreads = threads.filter(d => !d.isPinned);

  const renderIdentifyForm = () => (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg relative overflow-hidden mb-4 shadow-xl">
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
          HUBUNGKAN
        </button>
      </form>
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
            {view === 'thread' && (
              <button 
                onClick={() => { setView('list'); setActiveThreadId(null); setActiveThread(null); }}
                className="text-zinc-400 hover:text-white transition-colors mr-2 p-1 bg-zinc-900 rounded border border-zinc-800 hover:border-zinc-700"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <MessageSquare className="text-gold" size={20} />
            <h2 className="text-white font-bold tracking-widest uppercase text-sm">
              {view === 'list' ? 'Cougan Forums' : 'Thread'}
            </h2>
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

          {/* VIEW 1: LIST VIEW */}
          {view === 'list' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10" onClick={() => setActiveReactionId(null)}>
              
              {!localUser && showCreateThread && renderIdentifyForm()}
              
              {/* Create Thread Toggle */}
              {localUser && (
                <div className="mb-4">
                  {!showCreateThread ? (
                    <button 
                      onClick={() => setShowCreateThread(true)}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-gold/50 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-all font-bold text-sm tracking-wider uppercase"
                    >
                      <Plus size={16} className="text-gold" /> Create New Thread
                    </button>
                  ) : (
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg relative shadow-xl">
                      <button onClick={() => setShowCreateThread(false)} className="absolute top-2 right-2 text-zinc-500 hover:text-white">
                        <X size={16} />
                      </button>
                      <h3 className="text-sm font-bold mb-3 text-gold">Start New Thread</h3>
                      <form onSubmit={handleCreateThread} className="space-y-3">
                        <input
                          name="title"
                          required
                          placeholder="Thread Title..."
                          className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
                        />
                        <textarea
                          name="message"
                          required
                          placeholder="What's on your mind? (Markdown supported)"
                          className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 min-h-[80px] resize-y"
                        />
                        <div className="flex justify-end">
                          <button type="submit" disabled={isSending} className="bg-gold hover:bg-yellow-500 text-black px-4 py-2 rounded text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-2">
                            {isSending ? "Transmitting..." : <><Send size={14} /> Post Thread</>}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* Threads List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-10 text-zinc-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mr-2" />
                  Loading threads...
                </div>
              ) : threads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-600 space-y-2">
                  <MessageSquare size={32} className="opacity-50" />
                  <p>No threads found. Be the first!</p>
                  {!localUser && (
                    <button onClick={() => setShowCreateThread(true)} className="text-gold text-xs uppercase tracking-wider underline underline-offset-4 mt-2">
                      Identify & Create
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {[...pinnedThreads, ...normalThreads].map(thread => (
                    <div 
                      key={thread.id} 
                      onClick={() => {
                        setActiveThreadId(thread.id);
                        setView('thread');
                      }}
                      className={cn(
                        "bg-zinc-900/80 border rounded p-4 text-sm group relative hover:bg-zinc-800 cursor-pointer transition-colors shadow-sm",
                        thread.isPinned ? "border-gold bg-gold/5 hover:bg-gold/10" : "border-zinc-800"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-white font-bold text-base pr-8 line-clamp-1 flex items-center gap-2">
                          {thread.isPinned && <Pin size={14} className="text-gold shrink-0" />}
                          {thread.title || "Untitled Thread"}
                        </h3>
                      </div>
                      
                      <div className="text-zinc-400 text-xs mb-3 line-clamp-2">
                        {thread.message.replace(/!\[.*?\]\(.*?\)/g, '[Image/Emote]')}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-300">{thread.name}</span>
                          <span>•</span>
                          <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded text-zinc-400 border border-zinc-800 group-hover:border-zinc-700">
                          <MessageSquare size={12} />
                          <span className="font-bold">{thread._count?.replies || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: THREAD DETAIL */}
          {view === 'thread' && (
            <div className="flex-1 flex flex-col relative z-10 h-full overflow-hidden" onClick={() => setActiveReactionId(null)}>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10 text-zinc-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mr-2" />
                    Connecting...
                  </div>
                ) : activeThread ? (
                  <>
                    {/* Original Thread Post */}
                    <div className={cn(
                      "bg-zinc-900 border rounded-lg p-4 text-sm group relative shadow-md",
                      activeThread.isPinned ? "border-gold" : "border-zinc-700"
                    )}>
                      {renderMessageActions(activeThread)}
                      <h2 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                        {activeThread.isPinned && <Pin size={16} className="text-gold" />}
                        {activeThread.title || "Untitled Thread"}
                      </h2>
                      <div className="flex items-center gap-2 text-xs mb-4 pb-4 border-b border-zinc-800">
                        <span className="text-white font-bold">{activeThread.name}</span>
                        {activeThread.username && <span className="text-zinc-500">@{activeThread.username}</span>}
                        <span className="text-zinc-600">• {new Date(activeThread.createdAt).toLocaleString()}</span>
                      </div>
                      
                      {renderMessageContent(activeThread.id, activeThread.message, activeThread.isAdmin)}
                      {renderReactions(activeThread)}
                    </div>

                    {/* Replies */}
                    {activeThread.replies && activeThread.replies.length > 0 ? (
                      <div className="space-y-3 pl-2 border-l border-zinc-800/50">
                        {activeThread.replies.map(reply => (
                          <div 
                            key={reply.id} 
                            className={cn(
                              "bg-zinc-900/60 border rounded p-3 text-sm group relative hover:bg-zinc-900/80 transition-colors ml-2",
                              reply.isAdmin ? "border-red-900/50 bg-red-950/20" : "border-zinc-800/80"
                            )}
                          >
                            {reply.isAdmin && <div className="absolute top-0 left-0 w-1 h-full bg-red-600 rounded-l" />}
                            {renderMessageActions(reply)}
                            
                            <div className="flex justify-between items-baseline mb-2">
                              <span className={cn("font-bold text-xs flex items-center gap-2", reply.isAdmin ? "text-red-500" : "text-white")}>
                                {reply.name}
                                {reply.isAdmin && <span className="bg-red-600 text-white font-bold text-[8px] uppercase tracking-wider px-1 py-0.5 rounded">SYSTEM</span>}
                              </span>
                              <span className="text-zinc-600 text-[10px]">{new Date(reply.createdAt).toLocaleTimeString()}</span>
                            </div>
                            
                            {renderMessageContent(reply.id, reply.message, reply.isAdmin)}
                            {renderReactions(reply)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-zinc-500 text-sm italic">
                        No replies yet. Be the first to reply!
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10 text-red-500">Thread not found or deleted.</div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Area (Fixed at bottom of thread view) */}
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-2 relative z-20">
                {!localUser ? (
                  renderIdentifyForm()
                ) : (
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

                    <form onSubmit={handleReplyMessage} className="relative">
                      <textarea
                        ref={chatInputRef}
                        name="message"
                        required
                        disabled={isSending}
                        placeholder="Ketik balasan (Mendukung Markdown)..."
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
                        <div className="absolute right-2 bottom-12 w-64 bg-zinc-900 border border-zinc-800 shadow-xl rounded-lg p-3 z-50 max-h-60 overflow-y-auto">
                          <h4 className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Stickers & Emotes</h4>
                          <div className="grid grid-cols-4 gap-2">
                            {Object.entries(EMOTES).map(([code, src]) => (
                              <button
                                key={code}
                                type="button"
                                onClick={() => insertEmote(code)}
                                className="p-1 hover:bg-zinc-800 rounded transition-colors aspect-square flex items-center justify-center"
                                title={code}
                              >
                                <img src={src} alt={code} className="w-8 h-8 object-contain" />
                              </button>
                            ))}
                            {customStickers.map((sticker) => (
                              <button
                                key={sticker.id}
                                type="button"
                                onClick={() => insertCustomSticker(sticker.name, sticker.imageUrl)}
                                className="p-1 hover:bg-zinc-800 rounded transition-colors aspect-square flex items-center justify-center"
                                title={sticker.name}
                              >
                                <img src={sticker.imageUrl} alt={sticker.name} className="w-full h-full object-contain" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="absolute right-2 bottom-2 flex items-center gap-1">
                        <button 
                          type="button"
                          onClick={() => setShowEmotes(!showEmotes)}
                          className="p-2 text-zinc-400 hover:text-gold transition-colors"
                          title="Stickers"
                        >
                          <Sticker size={18} />
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
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
