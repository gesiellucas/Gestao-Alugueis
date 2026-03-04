'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { ipcInvoke, isElectron } from '../lib/ipc';
import type { Database } from '../types/database';

// ─── Supabase client (lazy, from SQLite config) ───────────────────────────────

async function getSupabaseFromConfig() {
  const url   = await ipcInvoke<string | null>('db:config:get', { key: 'supabase_url' });
  const key   = await ipcInvoke<string | null>('db:config:get', { key: 'supabase_publishable_key' });
  const anon  = await ipcInvoke<string | null>('db:config:get', { key: 'supabase_anon_key' });

  if (!url || !key) throw new Error('Credenciais Supabase não configuradas. Acesse as configurações.');

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: true, persistSession: true },
    global: { headers: { Authorization: `Bearer ${anon ?? key}` } },
  });
}

// ─── Silent sync for a single table ──────────────────────────────────────────

type SyncableTable = 'customers' | 'vehicles' | 'rental_contracts' | 'maintenance_records';

const TABLE_TO_IPC: Record<SyncableTable, ElectronChannel> = {
  customers:           'db:customers:upsertBatch',
  vehicles:            'db:vehicles:upsertBatch',
  rental_contracts:    'db:rentals:upsertBatch',
  maintenance_records: 'db:maintenance:upsertBatch',
};

async function syncTable(
  supabase: ReturnType<typeof createClient<Database>>,
  table: SyncableTable,
  userId: string
): Promise<void> {
  const lastSync = await ipcInvoke<string | null>('sync:getMetadata', { table });

  const query = supabase
    .from(table)
    .select('*')
    .order('updated_at', { ascending: true });

  // Only fetch records newer than our last sync to minimise data transfer
  if (lastSync) {
    query.gt('updated_at', lastSync);
  }

  const { data, error } = await query;
  if (error) throw error;

  if (data && data.length > 0) {
    // Tag every row with user_id so the SQLite tables can isolate per-user data
    const tagged = data.map((row) => ({ ...row, user_id: userId }));
    await ipcInvoke(TABLE_TO_IPC[table], { rows: tagged });
  }

  await ipcInvoke('sync:setMetadata', {
    table,
    timestamp: new Date().toISOString(),
  });
}

// ─── Full sync (all tables) ───────────────────────────────────────────────────

export async function performFullSync(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseFromConfig();
    const tables: SyncableTable[] = ['customers', 'vehicles', 'rental_contracts', 'maintenance_records'];

    // Run table syncs sequentially to avoid rate-limit issues
    for (const table of tables) {
      await syncTable(supabase, table, userId);
    }

    // Stamp the global last sync time
    await ipcInvoke('db:config:set', {
      key: 'last_sync_at',
      value: new Date().toISOString(),
    });

    return { success: true };
  } catch (err) {
    console.error('[Sync] Error during full sync:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── React Query hooks ────────────────────────────────────────────────────────

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
    refetchInterval: 30_000,  // Poll every 30 seconds
  });
}

/** Mutation that triggers a full sync. Invalidates all data queries on success. */
export function useFullSync(userId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => performFullSync(userId),
    onSuccess: (result) => {
      if (result.success) {
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
 * Use this in the root layout or a top-level component.
 */
export function useAutoSync(userId: string | null, intervalMinutes = 5) {
  const syncMutation = useFullSync(userId ?? '');

  useEffect(() => {
    if (!isElectron() || !userId) return;

    // Initial sync on app load
    syncMutation.mutate();

    const interval = setInterval(() => {
      syncMutation.mutate();
    }, intervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return syncMutation;
}
