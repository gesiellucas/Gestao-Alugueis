import { ipcMain } from 'electron';
import { createClient } from '@supabase/supabase-js';
import { getRawDb } from '../client/sqlite';

let supabase: ReturnType<typeof createClient> | null = null;
let syncInterval: NodeJS.Timeout | null = null;
let isSyncing = false;

// Tabelas sincronizadas (app_users NÃO sincroniza — contém senha local)
const SYNC_TABLES = [
  'workshops',
  'vehicle_statuses',
  'vehicle_models',
  'customers',
  'vehicles',
  'rentals',
  'contracts',
  'maintenance_records',
  'documents',
] as const;

// Tabelas sem user_id no Supabase (compartilhadas entre usuários)
const SHARED_TABLES = new Set([
  'vehicles', 'vehicle_models', 'workshops', 'contracts', 'documents', 'vehicle_statuses',
]);

export function initSyncEngine() {
  initSupabaseClient();
  startPolling(5 * 60 * 1000);

  ipcMain.handle('sync:force', async () => {
    return await runSync();
  });
}

function initSupabaseClient() {
  try {
    const db = getRawDb();
    const urlRow = db.prepare("SELECT value FROM config WHERE key = 'NEXT_PUBLIC_SUPABASE_URL'").get() as { value: string } | undefined;
    const anonKeyRow = db.prepare("SELECT value FROM config WHERE key = 'NEXT_PUBLIC_SUPABASE_ANON_KEY'").get() as { value: string } | undefined;

    if (urlRow?.value && anonKeyRow?.value) {
      supabase = createClient(urlRow.value, anonKeyRow.value);
      setupRealtimeSubscriptions();
    }
  } catch {
    // Credenciais ainda não configuradas
  }
}

function startPolling(intervalMs: number) {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => {
    if (!isSyncing) runSync().catch(() => {});
  }, intervalMs);
}

// ─── Core Sync ────────────────────────────────────────────────────────────────

async function runSync() {
  if (!supabase) {
    initSupabaseClient();
    if (!supabase) return { success: false, reason: 'No Supabase credentials' };
  }

  if (isSyncing) return { success: false, reason: 'Already syncing' };
  isSyncing = true;

  try {
    await pushChanges();
    await pullChanges();
    return { success: true };
  } catch (error) {
    return { success: false, error };
  } finally {
    isSyncing = false;
  }
}

// ─── PUSH ─────────────────────────────────────────────────────────────────────

async function pushChanges() {
  const db = getRawDb();

  for (const table of SYNC_TABLES) {
    const dirtyRecords = db.prepare(`SELECT * FROM ${table} WHERE dirty = 1`).all() as Record<string, unknown>[];
    if (dirtyRecords.length === 0) continue;

    const recordsToPush = dirtyRecords.map(record => {
      const { dirty, ...rest } = record as any;

      if (SHARED_TABLES.has(table)) {
        delete rest.user_id;
      } else if (rest.user_id === 1 || rest.user_id === '1') {
        rest.user_id = 1;
      }

      return rest;
    });

    const { error } = await (supabase as any).from(table).upsert(recordsToPush);
    if (error) continue;

    const ids = dirtyRecords.map(r => (r as any).id);
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`UPDATE ${table} SET dirty = 0 WHERE id IN (${placeholders})`).run(...ids);
  }
}

// ─── PULL ─────────────────────────────────────────────────────────────────────

async function pullChanges() {
  for (const table of SYNC_TABLES) {
    const lastSyncAt = getSyncMetadata(table) || new Date(0).toISOString();

    const { data, error } = await (supabase as any)
      .from(table)
      .select('*')
      .gt('updated_at', lastSyncAt)
      .order('updated_at', { ascending: true });

    if (error || !data || data.length === 0) continue;

    upsertLocally(table, data);

    const latestRecord = data[data.length - 1] as any;
    setSyncMetadata(table, latestRecord.updated_at);
  }
}

function upsertLocally(table: string, records: any[]) {
  const db = getRawDb();
  if (records.length === 0) return;

  const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  const validColumns = tableInfo.map(info => info.name).filter(col => col !== 'dirty');

  for (const record of records) {
    if (!SHARED_TABLES.has(table)) {
      if (!record.user_id || record.user_id === 0) {
        record.user_id = 1;
      }
    } else {
      delete record.user_id;
    }

    if (record.deleted_at === undefined) record.deleted_at = null;
  }

  const placeholders = validColumns.map(() => '?').join(', ');
  const assignments = validColumns.map(c => `${c} = excluded.${c}`).join(', ');

  const stmt = db.prepare(`
    INSERT INTO ${table} (${validColumns.join(', ')}, dirty)
    VALUES (${placeholders}, 0)
    ON CONFLICT(id) DO UPDATE SET
      ${assignments},
      dirty = 0
    WHERE excluded.updated_at >= ${table}.updated_at
  `);

  const insertMany = db.transaction((items: any[]) => {
    for (const item of items) {
      const values = validColumns.map(c => {
        const val = item[c];
        if (val === undefined) return null;
        if (typeof val === 'boolean') return val ? 1 : 0;
        if (val !== null && typeof val === 'object') return JSON.stringify(val);
        return val;
      });
      stmt.run(...values);
    }
  });

  insertMany(records);
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

function setupRealtimeSubscriptions() {
  if (!supabase) return;

  supabase
    .channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        upsertLocally(payload.table, [payload.new]);
        setSyncMetadata(payload.table, (payload.new as any).updated_at);
      } else if (payload.eventType === 'DELETE') {
        try {
          getRawDb().prepare(`DELETE FROM ${payload.table} WHERE id = ?`).run((payload.old as any).id);
        } catch {}
      }
    })
    .subscribe();
}

// ─── Metadata Helpers ─────────────────────────────────────────────────────────

function getSyncMetadata(tableName: string): string | null {
  const row = getRawDb().prepare('SELECT last_sync_at FROM sync_metadata WHERE table_name = ?').get(tableName) as { last_sync_at: string } | undefined;
  return row?.last_sync_at ?? null;
}

function setSyncMetadata(tableName: string, timestamp: string | undefined | null): void {
  if (!timestamp) return;
  getRawDb().prepare('INSERT OR REPLACE INTO sync_metadata (table_name, last_sync_at) VALUES (?, ?)').run(tableName, timestamp);
}
