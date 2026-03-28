'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SyncStatus {
  lastSync: string | null;
  pendingCount: number;
}

/** Returns the current sync status (always synced in current cloud-first mode). */
export function useSyncStatus() {
  return useQuery<SyncStatus>({
    queryKey: ['sync', 'status'],
    queryFn: async () => ({
      lastSync: new Date().toISOString(),
      pendingCount: 0,
    }),
    refetchInterval: 10_000,
  });
}

/** Manual sync trigger (now just invalidates queries as data is always in cloud). */
export function useFullSync() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async () => ({ 
      success: true 
    }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['customers'] });
      client.invalidateQueries({ queryKey: ['vehicles'] });
      client.invalidateQueries({ queryKey: ['rentals'] });
      client.invalidateQueries({ queryKey: ['maintenance'] });
      client.invalidateQueries({ queryKey: ['sync', 'status'] });
    },
  });
}

