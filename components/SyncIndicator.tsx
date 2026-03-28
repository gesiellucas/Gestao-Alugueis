'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CloudOff, CheckCircle2 } from 'lucide-react';

export const SyncIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);

  // Check network status
  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-red-500/10 text-red-500 rounded-lg">
        <CloudOff size={16} />
        <span>Modo Offline</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
      <CheckCircle2 size={16} />
      <span>Conectado à Nuvem</span>
    </div>
  );
};

