'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuotaMetrics {
  used: number;
  limit: number;
  remaining: number;
  isExhausted: boolean;
}

export function QuotaMonitor() {
  const [metrics, setMetrics] = useState<QuotaMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const res = await fetch('/api/quota');
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch quota metrics', error);
      }
    };

    fetchQuota();
    const interval = setInterval(fetchQuota, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return null;

  const usagePercent = Math.min((metrics.used / metrics.limit) * 100, 100);

  // Color logic
  let statusColor = 'bg-blue-500';
  if (usagePercent > 75) statusColor = 'bg-yellow-500';
  if (usagePercent > 90) statusColor = 'bg-red-500';
  if (metrics.isExhausted) statusColor = 'bg-red-600 animate-pulse';

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={cn('flex items-center justify-center w-10 h-10 rounded-full shadow-lg border border-white/10 transition-all hover:scale-105', metrics.isExhausted ? 'bg-red-900 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white')}>
        <Activity size={20} className={metrics.isExhausted ? 'animate-pulse' : ''} />
      </button>

      {isVisible && (
        <div className="mt-2 w-64 bg-zinc-900 border border-white/10 rounded-lg shadow-xl p-4 text-xs">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-white">YouTube API Quota</h3>
            <span className={metrics.isExhausted ? 'text-red-500 font-bold' : 'text-green-500'}>{metrics.isExhausted ? 'EXHAUSTED' : 'ACTIVE'}</span>
          </div>

          <div className="w-full bg-zinc-800 rounded-full h-2 mb-2 overflow-hidden">
            <div className={cn('h-full transition-all duration-500', statusColor)} style={{ width: `${usagePercent}%` }} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-zinc-400">
            <div>
              Used: <span className="text-white">{metrics.used}</span>
            </div>
            <div>
              Limit: <span className="text-white">{metrics.limit}</span>
            </div>
            <div>
              Remaining: <span className="text-white">{metrics.remaining}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
