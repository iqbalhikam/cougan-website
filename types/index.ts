// types/index.ts

export interface Streamer {
  id: string;
  name: string;
  role: string;
  channelId: string;
  youtubeId: string | null;
  avatar: string;
  status: string;
  position: number;
  createdAt: Date;

  // --- TAMBAHKAN FIELD BARU INI (Wajib ada tanda tanya ?) ---
  customUrl?: string | null;
  latestVideoId?: string | null; // <--- Ini yang bikin error
  lastChecked?: Date | null;
  lastVideoCheck?: Date | null;
}
