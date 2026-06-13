import { getDiscussions, postPublicDiscussion } from "@/lib/actions/discussion";
import RealtimeDiscussionFeed from "@/components/features/discussion/RealtimeDiscussionFeed";

export const metadata = {
  title: "Public Board | Cougan",
  description: "Public discussion board",
};

export default async function DiscussionPage() {
  const initialDiscussions = await getDiscussions();

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8 font-mono selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="border-b border-zinc-800 pb-4 mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-emerald-500 uppercase flex items-center gap-2">
            <span className="animate-pulse">_</span>
            Public Transmission Board
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            SECURE CHANNEL // UNENCRYPTED ACCESS GRANTED
          </p>
        </header>

        {/* Post Form */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg mb-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-linier-to-r from-emerald-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <h2 className="text-lg font-bold text-zinc-300 mb-4">Initialize New Thread</h2>
          
          <form action={async (formData) => { await postPublicDiscussion(formData); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Ident (Required)</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Handle (Optional)</label>
                <input 
                  type="text" 
                  name="username" 
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  placeholder="@johndoe"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 uppercase tracking-wider">Transmission Payload</label>
              <textarea 
                name="message" 
                required 
                rows={4}
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                placeholder="Enter your message here..."
              />
            </div>
            
            <button 
              type="submit"
              className="w-full md:w-auto px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider text-sm rounded transition-colors"
            >
              Transmit Data
            </button>
          </form>
        </div>

        {/* Realtime Feed */}
        <RealtimeDiscussionFeed initialDiscussions={initialDiscussions} />
        
      </div>
    </main>
  );
}
