import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { QuotaMonitor } from '@/components/admin/QuotaMonitor';
import './globals.css';
import LoadingScreen from '@/components/layout/LoadingScreen';
import { AudioPlayer } from '@/components/features/player/AudioPlayer';
import fs from 'fs';
import path from 'path';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Cougan Fams | The Family',
  description: 'Official streaming hub for the Cougan Family.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read backsound directory
  const backsoundDir = path.join(process.cwd(), 'public', 'backsound');
  let playlist: string[] = [];

  try {
    const files = fs.readdirSync(backsoundDir);
    playlist = files.filter((file) => /\.(mp3|wav|ogg)$/i.test(file)).map((file) => `/backsound/${file}`);
  } catch (error) {
    console.error('Error reading backsound directory:', error);
  }

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LoadingScreen />
        <AudioPlayer playlist={playlist} />
        {children}
        <QuotaMonitor />
      </body>
    </html>
  );
}
