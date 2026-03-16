'use client';

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
    refetchInterval: 10_000,
  });
}

/** Mutation que dispara sync manual via botão na UI. Invalida queries ao sucesso. */
export function useFullSync() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await ipcInvoke<{ success: boolean; error?: string }>('sync:force');
      return result;
    },
    onSuccess: (result) => {
      if (result && result.success) {
        client.invalidateQueries({ queryKey: ['customers'] });
        client.invalidateQueries({ queryKey: ['vehicles'] });
        client.invalidateQueries({ queryKey: ['rentals'] });
        client.invalidateQueries({ queryKey: ['maintenance'] });
        client.invalidateQueries({ queryKey: ['sync', 'status'] });
      }
    },
  });
}
