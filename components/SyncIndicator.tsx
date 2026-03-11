'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';

interface SyncStatus {
  lastSync: string | null;
  pendingCount: number;
}

export const SyncIndicator: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>({ lastSync: null, pendingCount: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
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

  const fetchStatus = useCallback(async () => {
    try {
      if (typeof window.electronAPI !== 'undefined') {
        const result = await window.electronAPI.invoke<SyncStatus>('sync:status');
        setStatus(result);
      }
    } catch (e) {
    }
  }, []);

  // Poll status every 10 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      if (typeof window.electronAPI !== 'undefined') {
        await window.electronAPI.invoke('sync:force');
        await fetchStatus();
      }
    } catch (error) {
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-red-500/10 text-red-500 rounded-lg">
        <CloudOff size={16} />
        <span>Offline</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-[#1a4fd6]/10 text-[#1a4fd6] rounded-lg">
        <RefreshCw size={16} className="animate-spin" />
        <span>Sincronizando...</span>
      </div>
    );
  }

  if (status.pendingCount > 0) {
    return (
      <button 
        onClick={handleManualSync}
        className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-[#f97316]/10 text-[#f97316] rounded-lg hover:bg-[#f97316]/20 transition-colors"
        title="Clique para forçar sincronização"
      >
        <Cloud size={16} />
        <span>{status.pendingCount} pendente(s)</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
      <CheckCircle2 size={16} />
      <span>Sincronizado</span>
    </div>
  );
};
