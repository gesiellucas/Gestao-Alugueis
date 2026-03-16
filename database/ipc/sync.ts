import { ipcMain } from 'electron';
import { createClient } from '@supabase/supabase-js';
import { getRawDb } from '../client/sqlite';

let supabase: ReturnType<typeof createClient> | null = null;
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

  // Sync manual via IPC — não há polling automático
  ipcMain.handle('sync:force', async () => {
    return await runSync();
  });

  // Reinicializa o cliente Supabase (chamado após configurar credenciais no setup)
  ipcMain.handle('sync:reinit', async () => {
    supabase = null;
    initSupabaseClient();
    if (!supabase) return { success: false, reason: 'No Supabase credentials after reinit' };
    return await runSync();
  });
}

function initSupabaseClient() {
  try {
    const db = getRawDb();
    // Check both key naming conventions (legacy NEXT_PUBLIC_* and new supabase_*)
    const urlRow = (
      db.prepare("SELECT value FROM config WHERE key = 'NEXT_PUBLIC_SUPABASE_URL'").get() ??
      db.prepare("SELECT value FROM config WHERE key = 'supabase_url'").get()
    ) as { value: string } | undefined;
    const anonKeyRow = (
      db.prepare("SELECT value FROM config WHERE key = 'NEXT_PUBLIC_SUPABASE_ANON_KEY'").get() ??
      db.prepare("SELECT value FROM config WHERE key = 'supabase_anon_key'").get()
    ) as { value: string } | undefined;

    if (urlRow?.value && anonKeyRow?.value) {
      supabase = createClient(urlRow.value, anonKeyRow.value);
      setupRealtimeSubscriptions();
    }
  } catch {
    // Credenciais ainda não configuradas
  }
}

// ─── Core Sync ────────────────────────────────────────────────────────────────

async function runSync() {
  if (!supabase) {
    initSupabaseClient();
    if (!supabase) return { success: false, reason: 'No Supabase credentials' };
  }

  if (isSyncing) return { success: false, reason: 'Already syncing' };
  isSyncing = true;

  console.log(`[Sync] Starting sync...`);
  try {
    await pushChanges();
    await pullChanges();
    console.log(`[Sync] Sync completed successfully.`);
    return { success: true };
  } catch (error) {
    console.error(`[Sync] Sync failed:`, error);
    return { success: false, error };
  } finally {
    isSyncing = false;
  }
}

// ─── PUSH ─────────────────────────────────────────────────────────────────────

async function pushChanges() {
  const db = getRawDb();

  // Se nunca sincronizou globalmente, vamos marcar tudo como pending para garantir que o Supabase tenha os dados iniciais
  const globalLastSync = db.prepare("SELECT value FROM config WHERE key = 'last_sync_at'").get() as { value: string } | undefined;
  if (!globalLastSync?.value) {
    console.log(`[Sync] First time sync detected. Marking all records as pending...`);
    for (const table of SYNC_TABLES) {
      try {
        db.prepare(`UPDATE ${table} SET sync_status = 'pending' WHERE sync_status = 'synced'`).run();
      } catch (e) {
        // Silently fail if table doesn't exist yet
      }
    }
    // Set a placeholder to avoid repeating this every time sync fails
    db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run('last_sync_at', 'PENDING');
  }

  for (const table of SYNC_TABLES) {
    const dirtyRecords = db.prepare(`SELECT * FROM ${table} WHERE sync_status = 'pending'`).all() as Record<string, unknown>[];

    console.log(`[Sync] Table "${table}": found ${dirtyRecords.length} pending records.`);

    if (dirtyRecords.length === 0) {
      continue;
    }

    const recordsToPush = dirtyRecords.map(record => {
      const rest = { ...record } as any;

      if (SHARED_TABLES.has(table)) {
        delete rest.user_id;
      }

      return rest;
    });

    console.log(`[Sync] Pushing ${recordsToPush.length} records to table "${table}"...`);
    const { error } = await (supabase as any).from(table).upsert(recordsToPush);
    if (error) {
      console.error(`[Sync] Error pushing to table "${table}":`, error);
      continue;
    }

    const ids = dirtyRecords.map(r => (r as any).id);
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`UPDATE ${table} SET sync_status = 'synced' WHERE id IN (${placeholders})`).run(...ids);
  }
}

// ─── PULL ─────────────────────────────────────────────────────────────────────

async function pullChanges() {
  for (const table of SYNC_TABLES) {
    const lastSyncAt = getSyncMetadata(table) || new Date(0).toISOString();
    console.log(`[Sync] Pulling changes for table "${table}" since ${lastSyncAt}...`);

    const { data, error } = await (supabase as any)
      .from(table)
      .select('*')
      .gt('updated_at', lastSyncAt)
      .order('updated_at', { ascending: true });

    if (error) {
      console.error(`[Sync] Error pulling from table "${table}":`, error);
      continue;
    }

    if (!data || data.length === 0) {
      // console.log(`[Sync] No new records for table "${table}".`);
      continue;
    }

    console.log(`[Sync] Pulled ${data.length} records for table "${table}".`);

    upsertLocally(table, data);

    const latestRecord = data[data.length - 1] as any;
    setSyncMetadata(table, latestRecord.updated_at);
  }
}

function upsertLocally(table: string, records: any[]) {
  const db = getRawDb();
  if (records.length === 0) return;

  const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  const validColumns = tableInfo.map(info => info.name);

  const assignments = validColumns.map(c => `${c} = excluded.${c}`).join(', ');

  const placeholders = validColumns.map(() => '?').join(', ');
  const stmt = db.prepare(`
    INSERT INTO ${table} (${validColumns.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT(id) DO UPDATE SET
      ${assignments}
    WHERE excluded.updated_at >= ${table}.updated_at
  `);

  const insertMany = db.transaction((items: any[]) => {
    for (const item of items) {
      // Ensure specific fields exist and have correct values
      if (item.sync_status === undefined) item.sync_status = 'synced';

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
        } catch { }
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
