'use client';

import MaintenanceScreen from '@/components/maintenance/MaintenanceScreen';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import './globals.css'; // Import Global CSS for Tailwind
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function GlobalError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to our logging service
    logger.error({ err: error }, 'Critical Global Error caught');
  }, [error]);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <MaintenanceScreen />
      </body>
    </html>
  );
}
