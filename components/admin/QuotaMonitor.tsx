'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuotaMetrics {
  quotaUsed: number;
  limit: number;
  remaining: number;
  isCircuitOpen: boolean;
}

export function QuotaMonitor() {
  const [metrics, setMetrics] = useState<QuotaMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // 1. Fungsi Helper Murni (Fetch Data)
  // Kita pisahkan ini supaya bisa dipanggil oleh useEffect maupun tombol
  const getQuotaData = async () => {
    try {
      const res = await fetch('/api/quota', { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      console.error('Failed to fetch quota metrics', error);
    }
    return null;
  };

  // 2. Logic Polling Otomatis (useEffect)
  // Kita definisikan fungsi async DI DALAM useEffect agar dependency-nya kosong []
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const data = await getQuotaData();
      if (isMounted && data) {
        setMetrics(data);
      }
    };

    init(); // Panggil saat mount
    const interval = setInterval(init, 10000); // Polling tiap 10 detik

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []); // Dependency array kosong = Aman dari Linter ✅

  // 3. Logic Refresh Manual (Tombol)
  const handleManualRefresh = async () => {
    const data = await getQuotaData();
    if (data) {
      setMetrics(data);
    }
  };

  if (!metrics) return null;

  // Logic Tampilan (Sama seperti sebelumnya)
  const limit = metrics.limit || 10000;
  const used = metrics.quotaUsed || 0;
  const remaining = limit - used;
  const usagePercent = Math.min((used / limit) * 100, 100);

  let statusColor = 'bg-emerald-500';
  if (usagePercent > 50) statusColor = 'bg-yellow-500';
  if (usagePercent > 80) statusColor = 'bg-orange-500';
  if (usagePercent > 95) statusColor = 'bg-red-600';

  if (metrics.isCircuitOpen) statusColor = 'bg-red-600 animate-pulse';

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end font-sans">
      <button
        onClick={() => {
          setIsVisible(!isVisible);
          handleManualRefresh(); // Refresh manual saat diklik
        }}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full shadow-lg border border-white/10 transition-all hover:scale-105',
          metrics.isCircuitOpen ? 'bg-red-900 text-white animate-pulse' : 'bg-zinc-900 text-zinc-400 hover:text-white',
        )}>
        <Activity size={20} />
      </button>

      {isVisible && (
        <div className="mt-2 w-72 bg-zinc-900 border border-white/10 rounded-lg shadow-xl p-4 text-xs backdrop-blur-sm bg-opacity-95">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-white text-sm">YouTube API Quota</h3>
            <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', metrics.isCircuitOpen ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500')}>{metrics.isCircuitOpen ? 'LIMIT REACHED' : 'ACTIVE'}</span>
          </div>

          <div className="flex justify-between text-zinc-400 mb-1">
            <span>Usage</span>
            <span>{usagePercent.toFixed(1)}%</span>
          </div>

          <div className="w-full bg-zinc-800 rounded-full h-2.5 mb-4 overflow-hidden border border-white/5">
            <div className={cn('h-full transition-all duration-500', statusColor)} style={{ width: `${usagePercent}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-white/10">
            <div>
              <div className="text-zinc-500 mb-0.5">Used</div>
              <div className="text-white font-mono font-medium">{used}</div>
            </div>
            <div>
              <div className="text-zinc-500 mb-0.5">Limit</div>
              <div className="text-white font-mono font-medium">{limit.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-zinc-500 mb-0.5">Left</div>
              <div className={cn('font-mono font-medium', remaining < 1000 ? 'text-red-400' : 'text-emerald-400')}>{remaining.toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 text-center text-[10px] text-zinc-600">Resets daily at 00:00 PT (Pacific Time)</div>
        </div>
      )}
    </div>
  );
}
