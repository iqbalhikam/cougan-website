"use client";

import { useEffect } from "react";

type DetailModalProps = {
  streamer: any;
  onClose: () => void;
};

export default function DetailModal({ streamer, onClose }: DetailModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const isSwag = streamer.division === "SWAG";
  const isCk = streamer.factionStatus === "CK";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose}
      />
      
      <div className={`relative w-full max-w-4xl bg-neutral-950 border-2 rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row ${
        isCk ? "border-amber-700/50" : isSwag ? "border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.3)]" : "border-neutral-800"
      }`}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-black/50 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Left Column: Image */}
        <div className="w-full md:w-1/3 relative h-64 md:h-auto border-r border-neutral-800">
          {streamer.avatar ? (
            <img 
              src={streamer.avatar} 
              alt={streamer.name}
              className={`object-cover w-full h-full ${isCk ? 'sepia-[.3] contrast-125' : ''}`}
            />
          ) : (
            <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-600">
              No Image Data
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-neutral-950 to-transparent md:bg-linear-to-r" />
        </div>

        {/* Right Column: Details */}
        <div className="w-full md:w-2/3 p-6 md:p-10 flex flex-col max-h-[80vh] overflow-y-auto">
          
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider">{streamer.name}</h2>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {isSwag && (
                <span className="px-3 py-1 bg-red-600/20 border border-red-500 text-red-500 text-xs font-bold uppercase tracking-widest rounded">
                  SWAG // Mesin Tempur
                </span>
              )}
              {isCk && (
                <span className="px-3 py-1 bg-amber-900/30 border border-amber-700 text-amber-500 text-xs font-bold uppercase tracking-widest rounded">
                  Status: Fallen (CK)
                </span>
              )}
              {streamer.factionStatus === "OUT" && (
                <span className="px-3 py-1 bg-neutral-800 border border-neutral-600 text-neutral-400 text-xs font-bold uppercase tracking-widest rounded">
                  Status: Alumni (OUT)
                </span>
              )}
              {!isSwag && streamer.division && (
                <span className="px-3 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-widest rounded">
                  Division: {streamer.division}
                </span>
              )}
            </div>
          </div>

          {/* Lore Section */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-3 border-b border-neutral-800 pb-2">Archive File: Lore</h3>
            <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
              {streamer.lore ? (
                <p className="whitespace-pre-wrap font-serif">{streamer.lore}</p>
              ) : (
                <p className="italic text-neutral-600">No lore data found in the archive for this entity.</p>
              )}
            </div>
          </div>

          {/* Stats Section */}
          {streamer.combatStats && Object.keys(streamer.combatStats).length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-3 border-b border-neutral-800 pb-2">Combat Analytics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(streamer.combatStats as Record<string, any>).map(([key, value]) => (
                  <div key={key} className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg">
                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{key}</div>
                    <div className={`text-2xl font-black ${isCk ? 'text-amber-500' : isSwag ? 'text-red-500' : 'text-white'}`}>
                      {String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
