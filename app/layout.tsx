import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import LoadingScreen from '@/components/layout/LoadingScreen';
import { AudioPlayer } from '@/components/features/player/AudioPlayer';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read backsound from database
  // Read backsound from local directory
  const tracks = await prisma.backsound.findMany({
    orderBy: { createdAt: 'desc' },
    select: { url: true },
  });

  // Convert object array ke string array ['url1', 'url2']
  const playlistUrls = tracks.map((t) => t.url);

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LoadingScreen />
        <AudioPlayer playlist={playlistUrls} />
        {children}
        
      </body>
    </html>
  );
}
