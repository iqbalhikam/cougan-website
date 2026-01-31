import { Navbar } from '@/components/Navbar';
import { MultiViewPlayer } from '@/components/MultiViewPlayer';

export default function MultiViewPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto p-4 pt-36">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Multi-View Command Center</h1>
          <p className="text-zinc-400">Monitor multiple family perspectives simultaneously.</p>
        </div>
        <MultiViewPlayer />
      </div>
    </main>
  );
}
