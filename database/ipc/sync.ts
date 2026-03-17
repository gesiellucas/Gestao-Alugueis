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
    await initSupabaseClient();
    if (!supabase) return { success: false, reason: 'No Supabase credentials after reinit' };
    return await runSync();
  });
}

async function initSupabaseClient() {
  try {
    const db = getRawDb();

    // Check both key naming conventions (legacy NEXT_PUBLIC_* and new supabase_*)
    let urlResult = await db.execute("SELECT value FROM config WHERE key = 'NEXT_PUBLIC_SUPABASE_URL'");
    if (urlResult.rows.length === 0) {
      urlResult = await db.execute("SELECT value FROM config WHERE key = 'supabase_url'");
    }
    const urlRow = urlResult.rows[0] as unknown as { value: string } | undefined;

    let anonResult = await db.execute("SELECT value FROM config WHERE key = 'NEXT_PUBLIC_SUPABASE_ANON_KEY'");
    if (anonResult.rows.length === 0) {
      anonResult = await db.execute("SELECT value FROM config WHERE key = 'supabase_anon_key'");
    }
    const anonKeyRow = anonResult.rows[0] as unknown as { value: string } | undefined;

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
    await initSupabaseClient();
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

  // Se nunca sincronizou globalmente, marca tudo como pending para garantir que o Supabase tenha os dados iniciais
  const globalLastSyncResult = await db.execute("SELECT value FROM config WHERE key = 'last_sync_at'");
  const globalLastSync = globalLastSyncResult.rows[0] as unknown as { value: string } | undefined;

  if (!globalLastSync?.value) {
    console.log(`[Sync] First time sync detected. Marking all records as pending...`);
    for (const table of SYNC_TABLES) {
      try {
        await db.execute(`UPDATE ${table} SET sync_status = 'pending' WHERE sync_status = 'synced'`);
      } catch {
        // Silently fail if table doesn't exist yet
      }
    }
    // Set a placeholder to avoid repeating this every time sync fails
    await db.execute({ sql: "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)", args: ['last_sync_at', 'PENDING'] });
  }

  for (const table of SYNC_TABLES) {
    const result = await db.execute(`SELECT * FROM ${table} WHERE sync_status = 'pending'`);
    const dirtyRecords = result.rows as unknown as Record<string, unknown>[];

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
    await db.execute({
      sql: `UPDATE ${table} SET sync_status = 'synced' WHERE id IN (${placeholders})`,
      args: ids,
    });
  }
}

// ─── PULL ─────────────────────────────────────────────────────────────────────

async function pullChanges() {
  for (const table of SYNC_TABLES) {
    const lastSyncAt = await getSyncMetadata(table) || new Date(0).toISOString();
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
      continue;
    }

    console.log(`[Sync] Pulled ${data.length} records for table "${table}".`);

    await upsertLocally(table, data);

    const latestRecord = data[data.length - 1] as any;
    await setSyncMetadata(table, latestRecord.updated_at);
  }
}

async function upsertLocally(table: string, records: any[]) {
  const db = getRawDb();
  if (records.length === 0) return;

  const tableInfoResult = await db.execute(`PRAGMA table_info(${table})`);
  const validColumns = (tableInfoResult.rows as unknown as { name: string }[]).map(info => info.name);

  const assignments = validColumns.map(c => `${c} = excluded.${c}`).join(', ');
  const placeholders = validColumns.map(() => '?').join(', ');

  const sql = `
    INSERT INTO ${table} (${validColumns.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT(id) DO UPDATE SET
      ${assignments}
    WHERE excluded.updated_at >= ${table}.updated_at
  `;

  const batch = records.map(item => {
    if (item.sync_status === undefined) item.sync_status = 'synced';
    const args = validColumns.map(c => {
      const val = item[c];
      if (val === undefined) return null;
      if (typeof val === 'boolean') return val ? 1 : 0;
      if (val !== null && typeof val === 'object') return JSON.stringify(val);
      return val;
    });
    return { sql, args };
  });

  await db.batch(batch, 'write');
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

function setupRealtimeSubscriptions() {
  if (!supabase) return;

  supabase
    .channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, async (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        await upsertLocally(payload.table, [payload.new]);
        await setSyncMetadata(payload.table, (payload.new as any).updated_at);
      } else if (payload.eventType === 'DELETE') {
        try {
          await getRawDb().execute({
            sql: `DELETE FROM ${payload.table} WHERE id = ?`,
            args: [(payload.old as any).id],
          });
        } catch { }
      }
    })
    .subscribe();
}

// ─── Metadata Helpers ─────────────────────────────────────────────────────────

async function getSyncMetadata(tableName: string): Promise<string | null> {
  const result = await getRawDb().execute({
    sql: 'SELECT last_sync_at FROM sync_metadata WHERE table_name = ?',
    args: [tableName],
  });
  const row = result.rows[0] as unknown as { last_sync_at: string } | undefined;
  return row?.last_sync_at ?? null;
}

async function setSyncMetadata(tableName: string, timestamp: string | undefined | null): Promise<void> {
  if (!timestamp) return;
  await getRawDb().execute({
    sql: 'INSERT OR REPLACE INTO sync_metadata (table_name, last_sync_at) VALUES (?, ?)',
    args: [tableName, timestamp],
  });
}
