'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ipcInvoke, isElectron } from '../lib/ipc';

interface SyncStatus {
  lastSync: string | null;
  pendingCount: number;
}

/** Returns the current sync status (last sync time + number of unsynced local changes). */
export function useSyncStatus() {
  return useQuery<SyncStatus>({
    queryKey: ['sync', 'status'],
    queryFn: () => ipcInvoke<SyncStatus>('sync:status'),
    enabled: isElectron(),
    refetchInterval: 10_000,  // Poll every 10 seconds to update UI
  });
}

/** Mutation that triggers a full sync via the Electron Background Sync Engine. Invalidates all data queries on success. */
export function useFullSync() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await ipcInvoke<{ success: boolean; error?: string }>('sync:force');
      return result;
    },
    onSuccess: (result) => {
      if (result && result.success) {
        // Refresh all local data on the screen
        client.invalidateQueries({ queryKey: ['customers'] });
        client.invalidateQueries({ queryKey: ['vehicles'] });
        client.invalidateQueries({ queryKey: ['rentals'] });
        client.invalidateQueries({ queryKey: ['maintenance'] });
        client.invalidateQueries({ queryKey: ['sync', 'status'] });
      }
    },
  });
}

/**
 * Auto-sync hook — triggers an initial sync on mount and then periodically.
 * Listens to network online events or interval sweeps to coordinate with the Background Engine.
 */
export function useAutoSync(userId: string | null, intervalMinutes = 5) {
  const syncMutation = useFullSync();
  const { data: status } = useSyncStatus();
  const client = useQueryClient();
  const lastSyncRef = useRef<string | null>(null);

  // Monitor background syncs from the Electron Realtime listener.
  // If the Main process pulls new data, the lastSync timestamp will change
  // and we should invalidate the UI queries to immediately show the new data.
  useEffect(() => {
    if (status?.lastSync && lastSyncRef.current !== status.lastSync) {
      if (lastSyncRef.current !== null) {
        // A background sync update just arrived! Refresh UI.
        client.invalidateQueries({ queryKey: ['customers'] });
        client.invalidateQueries({ queryKey: ['vehicles'] });
        client.invalidateQueries({ queryKey: ['rentals'] });
        client.invalidateQueries({ queryKey: ['maintenance'] });
      }
      lastSyncRef.current = status.lastSync;
    }
  }, [status?.lastSync, client]);

  useEffect(() => {
    if (!isElectron() || !userId) return;

    // Initial sync on app load
    syncMutation.mutate();

    // Trigger sync when coming back online
    const handleOnline = () => syncMutation.mutate();
    window.addEventListener('online', handleOnline);

    const interval = setInterval(() => {
      syncMutation.mutate();
    }, intervalMinutes * 60 * 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return syncMutation;
}
