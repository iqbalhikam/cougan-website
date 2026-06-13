"use client";

import { useState } from "react";
import CharacterCard from "./CharacterCard";
import DetailModal from "./DetailModal";

type RosterClientProps = {
  activeMembers: any[];
  alumniMembers: any[];
  fallenMembers: any[];
};

export default function RosterClient({ activeMembers, alumniMembers, fallenMembers }: RosterClientProps) {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "OUT" | "CK">("ACTIVE");
  const [selectedCharacter, setSelectedCharacter] = useState<any | null>(null);

  const tabs = [
    { id: "ACTIVE", label: "Active Roster", count: activeMembers.length },
    { id: "OUT", label: "Alumni", count: alumniMembers.length },
    { id: "CK", label: "Fallen Legends", count: fallenMembers.length },
  ];

  const getDisplayedMembers = () => {
    switch (activeTab) {
      case "ACTIVE": return activeMembers;
      case "OUT": return alumniMembers;
      case "CK": return fallenMembers;
      default: return [];
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-neutral-800 pb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-bold uppercase tracking-widest text-sm rounded-t-lg transition-colors border-b-2 ${
              activeTab === tab.id 
                ? "bg-red-600/10 text-red-500 border-red-600" 
                : "text-neutral-400 border-transparent hover:text-white hover:bg-neutral-900"
            }`}
          >
            {tab.label} <span className="ml-2 bg-neutral-800 px-2 py-0.5 rounded text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {getDisplayedMembers().map(member => (
          <CharacterCard 
            key={member.id} 
            streamer={member} 
            onClick={() => setSelectedCharacter(member)} 
          />
        ))}
      </div>

      {/* Empty State */}
      {getDisplayedMembers().length === 0 && (
        <div className="text-center py-20 text-neutral-500 font-mono">
          No records found in this archive sector.
        </div>
      )}

      {/* Detail Modal */}
      {selectedCharacter && (
        <DetailModal 
          streamer={selectedCharacter} 
          onClose={() => setSelectedCharacter(null)} 
        />
      )}
    </div>
  );
}
