'use client';

import MaintenanceScreen from '@/components/maintenance/MaintenanceScreen';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to our logging service
    logger.error({ err: error }, 'Critical Global Error caught');
  }, [error]);

  return (
    <html>
      <body>
        <MaintenanceScreen />
      </body>
    </html>
  );
}
