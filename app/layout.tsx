import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { QuotaMonitor } from '@/components/QuotaMonitor';
import './globals.css';
import LoadingScreen from '@/components/LoadingScreen';

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
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LoadingScreen />
        {children}
        <QuotaMonitor />
      </body>
    </html>
  );
}
