import { getRosterData } from "@/lib/actions/roster";
import RosterClient from "./RosterClient";

export const metadata = {
  title: "Cougan Roster & Lore Archive",
  description: "Living archive of Cougan faction members.",
};

export default async function RosterPage() {
  const { activeMembers, alumniMembers, fallenMembers } = await getRosterData();

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 font-sans selection:bg-red-500/30">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 border-l-4 border-red-600 pl-6 py-2">
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-r from-white via-neutral-300 to-neutral-600 uppercase tracking-tighter mb-4">
            Cougan Archive
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl font-mono tracking-wide max-w-2xl">
            DATABASE: <span className="text-red-500">CLASSIFIED</span> // ACCESS GRANTED <br/>
            The living record of our brothers and sisters. Blood in, blood out.
          </p>
        </header>
        
        <RosterClient 
          activeMembers={activeMembers} 
          alumniMembers={alumniMembers} 
          fallenMembers={fallenMembers} 
        />
      </div>
    </main>
  );
}
