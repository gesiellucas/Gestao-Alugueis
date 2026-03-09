import { app, ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

let db: Database.Database;
let supabase: ReturnType<typeof createClient> | null = null;
let syncInterval: NodeJS.Timeout | null = null;
let isSyncing = false;

// We need to pass the same db instance from db.ts
export function initSyncEngine(database: Database.Database) {
    db = database;

    // Try to initialize supabase client from local config
    initSupabaseClient();

    // Start polling every 5 minutes
    startPolling(5 * 60 * 1000);

    // Expose manual sync trigger to IPC
    ipcMain.handle('sync:force', async () => {
        return await runSync();
    });
}

function initSupabaseClient() {
    try {
        const urlRow = db.prepare("SELECT value FROM config WHERE key = 'NEXT_PUBLIC_SUPABASE_URL'").get() as { value: string } | undefined;
        const anonKeyRow = db.prepare("SELECT value FROM config WHERE key = 'NEXT_PUBLIC_SUPABASE_ANON_KEY'").get() as { value: string } | undefined;

        if (urlRow?.value && anonKeyRow?.value) {
            supabase = createClient(urlRow.value, anonKeyRow.value);
            setupRealtimeSubscriptions();
        } else {
        }
    } catch (error) {
    }
}

function startPolling(intervalMs: number) {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(() => {
        if (!isSyncing) runSync().catch(() => {});
    }, intervalMs);
}

// ─── Core Sync Logic ──────────────────────────────────────────────────────────

async function runSync() {
    if (!supabase) {
        initSupabaseClient(); // Try again if it wasn't available before
        if (!supabase) return { success: false, reason: 'No Supabase credentials' };
    }

    if (isSyncing) return { success: false, reason: 'Already syncing' };
    isSyncing = true;

    try {
        // 1. PUSH local changes to remote
        await pushChanges();

        // 2. PULL remote changes to local
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
    const tables = ['vehicle_models', 'customers', 'vehicles', 'rental_contracts', 'maintenance_records'];

    for (const table of tables) {
        // Get all dirty records for this table
        const dirtyRecords = db.prepare(`SELECT * FROM ${table} WHERE dirty = 1`).all() as Record<string, any>[];

        if (dirtyRecords.length === 0) continue;


        // For simplicity, we upsert them one by one or in small batches. 
        // Supabase upsert accepts an array.
        // Prepare data to remove local-only columns like 'dirty'
        const recordsToPush = dirtyRecords.map(record => {
            const { dirty, ...rest } = record;

            // Map legacy local user_id '1' to a valid UUID for Supabase
            // Only for tables that still have user_id (not vehicles/vehicle_models)
            if (rest.user_id !== undefined && table !== 'vehicles' && table !== 'vehicle_models') {
                if (rest.user_id === '1') {
                    rest.user_id = '00000000-0000-0000-0000-000000000000';
                }
            }

            // Vehicles and vehicle_models no longer have user_id locally
            if (table === 'vehicles' || table === 'vehicle_models') {
                delete rest.user_id;
            }

            // Vehicles table in SQLite might still contain the legacy columns 'brand' and 'model'
            // We must strip them out before pushing to Supabase
            if (table === 'vehicles') {
                delete rest.brand;
                delete rest.model;
            }

            return rest;
        });

        // PUSH to Supabase
        const { error } = await (supabase as any).from(table).upsert(recordsToPush);

        if (error) {
            // Skip marking as clean if it failed
            continue;
        }

        // Mark as clean locally
        const ids = dirtyRecords.map(r => r.id);
        const placeholders = ids.map(() => '?').join(',');
        db.prepare(`UPDATE ${table} SET dirty = 0 WHERE id IN (${placeholders})`).run(...ids);
    }
}

// ─── PULL ─────────────────────────────────────────────────────────────────────

async function pullChanges() {
    const tables = ['vehicle_models', 'customers', 'vehicles', 'rental_contracts', 'maintenance_records'];

    for (const table of tables) {
        const lastSyncAt = getSyncMetadata(table) || new Date(0).toISOString();

        // Fetch records modified in Supabase after our last sync
        const { data, error } = await (supabase as any)
            .from(table)
            .select('*')
            .gt('updated_at', lastSyncAt)
            .order('updated_at', { ascending: true }); // Ensure chronological order

        if (error) {
            continue;
        }

        if (!data || data.length === 0) continue;


        // UPSERT into local SQLite
        upsertLocally(table, data);

        // Update last sync time for this table based on the most recently updated record we just pulled
        const latestUpdatedRecord = data[data.length - 1] as any;
        setSyncMetadata(table, latestUpdatedRecord.updated_at);
    }
}

// Helper to route to the correct local upsert statement
function upsertLocally(table: string, records: any[]) {
    // We need to bypass the 'dirty = 1' logic when pulling from remote.
    // We can either expose the existing `upsertBatch` functions from db.ts, 
    // or construct a generic upsert here.
    // The easiest is to construct a generic statement since we know the schema.

    if (records.length === 0) return;

    // Get table schema from SQLite to know what columns are actually expected
    const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    const validColumns = tableInfo.map(info => info.name).filter(col => col !== 'dirty'); // We handle 'dirty' explicitly

    for (const record of records) {
        // Sanitize records to ensure compatibility with local NOT NULL constraints
        // Only apply user_id fallback for tables that still use user_id
        if (table !== 'vehicles' && table !== 'vehicle_models') {
            if (record.user_id === undefined || record.user_id === null) {
                record.user_id = '1'; // Default admin user ID fallback
            }
            // Reverter o mapeamento feito no pushChanges:
            if (record.user_id === '00000000-0000-0000-0000-000000000000') {
                record.user_id = '1';
            }
        } else {
            // Remove user_id from vehicles/vehicle_models if present in remote data
            delete record.user_id;
        }
        // Set missing deleted_at to null
        if (record.deleted_at === undefined) {
            record.deleted_at = null;
        }
    }

    const placeholders = validColumns.map(() => '?').join(', ');
    const assignments = validColumns.map(c => `${c} = excluded.${c}`).join(', ');

    const sql = `
    INSERT INTO ${table} (${validColumns.join(', ')}, dirty)
    VALUES (${placeholders}, 0)
    ON CONFLICT(id) DO UPDATE SET
      ${assignments},
      dirty = 0
    -- Only override if remote is newer or same (Last Write Wins)
    WHERE excluded.updated_at >= ${table}.updated_at;
  `;

    const stmt = db.prepare(sql);

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
        .on(
            'postgres_changes',
            { event: '*', schema: 'public' },
            (payload) => {

                // Handle incoming realtime change seamlessly
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    upsertLocally(payload.table, [payload.new]);
                    setSyncMetadata(payload.table, payload.new.updated_at);
                } else if (payload.eventType === 'DELETE') {
                    // We use soft-deletes, so actual DELETEs shouldn't happen often, 
                    // but just in case, we can handle it.
                    try {
                        db.prepare(`DELETE FROM ${payload.table} WHERE id = ?`).run(payload.old.id);
                    } catch (e) {
                    }
                }
            }
        )
        .subscribe((status) => {
        });
}

// ─── Metadata Helpers ─────────────────────────────────────────────────────────

function getSyncMetadata(tableName: string): string | null {
    const row = db.prepare('SELECT last_sync_at FROM sync_metadata WHERE table_name = ?').get(tableName) as { last_sync_at: string } | undefined;
    return row?.last_sync_at ?? null;
}

function setSyncMetadata(tableName: string, timestamp: string | undefined | null): void {
    if (!timestamp) return;
    db.prepare('INSERT OR REPLACE INTO sync_metadata (table_name, last_sync_at) VALUES (?, ?)').run(tableName, timestamp);
}
