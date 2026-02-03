import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { QuotaMonitor } from '@/components/admin/QuotaMonitor';
import './globals.css';
import LoadingScreen from '@/components/layout/LoadingScreen';
import { AudioPlayer } from '@/components/features/player/AudioPlayer';
import { getBacksounds } from '@/lib/actions/backsound';

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
  const backsounds = await getBacksounds();
  const playlist = backsounds.filter((track) => track.isActive).map((track) => track.url);

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
