"use client";

type CharacterCardProps = {
  streamer: any;
  onClick: () => void;
};

export default function CharacterCard({ streamer, onClick }: CharacterCardProps) {
  const isSwag = streamer.division === "SWAG";
  const isOut = streamer.factionStatus === "OUT";
  const isCk = streamer.factionStatus === "CK";

  let containerClasses = "relative bg-neutral-900 border overflow-hidden cursor-pointer transition-all hover:scale-105 group ";
  let borderClasses = "border-neutral-700 hover:border-neutral-500";
  let filterClasses = "";

  if (isOut) {
    filterClasses = "grayscale opacity-75 hover:grayscale-0 hover:opacity-100";
    borderClasses = "border-neutral-800 hover:border-neutral-500";
  } else if (isCk) {
    containerClasses += "memorial-aesthetic ";
    borderClasses = "border-amber-700/50 hover:border-amber-500";
    filterClasses = "sepia-[.3] contrast-125 brightness-90";
  }

  if (isSwag && !isOut && !isCk) {
    borderClasses = "border-red-600 hover:border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.5)]";
  }

  return (
    <div 
      onClick={onClick}
      className={`${containerClasses} ${borderClasses} ${filterClasses} rounded-xl overflow-hidden`}
    >
      {/* SWAG Warning Stripes */}
      {isSwag && (
        <div className="absolute top-0 left-0 w-full h-1 bg-linier-to-r from-red-600 via-yellow-500 to-red-600 animate-pulse z-10" />
      )}
      
      {/* Avatar Container */}
      <div className="relative aspect-4/5 w-full">
        {streamer.avatar ? (
          <img 
            src={streamer.avatar} 
            alt={streamer.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
            <span className="text-neutral-500">No Image</span>
          </div>
        )}
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          {isSwag && (
            <div className="bg-red-600 text-white text-xs font-black px-2 py-1 rounded shadow-lg flex items-center gap-1 uppercase tracking-wider border border-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Mesin Tempur
            </div>
          )}
          {isCk && (
            <div className="bg-amber-900/80 text-amber-100 text-xs font-bold px-2 py-1 rounded border border-amber-700/50 uppercase tracking-widest backdrop-blur-sm">
              Fallen Legend
            </div>
          )}
          {isOut && (
            <div className="bg-neutral-800/80 text-neutral-300 text-xs font-bold px-2 py-1 rounded border border-neutral-600 uppercase tracking-widest backdrop-blur-sm">
              Alumni
            </div>
          )}
          {streamer.division && streamer.division !== "SWAG" && (
            <div className="bg-neutral-800/80 text-white text-xs font-bold px-2 py-1 rounded border border-neutral-600 uppercase tracking-wider backdrop-blur-sm">
              {streamer.division}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 w-full p-4">
          <h3 className="text-2xl font-black text-white uppercase tracking-wide drop-shadow-lg group-hover:text-red-500 transition-colors">
            {streamer.name}
          </h3>
          {streamer.lore && (
            <p className="text-gray-300 text-sm mt-1 line-clamp-2 leading-snug">
              {streamer.lore}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
