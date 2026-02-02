export type Streamer = {
  id: string;
  name: string;
  role: string;
  channelId: string; // The YouTube Channel ID (persistent)
  youtubeId: string | null; // The video ID for the live stream or latest video
  avatar: string;
  status: string;
  position: number;
};
