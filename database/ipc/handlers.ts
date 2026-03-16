import { app, ipcMain } from 'electron';
import path from 'path';
import { randomUUID } from 'crypto';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { initDb, getDb, getRawDb } from '../client/sqlite';
import { runSeed } from './seed';
import {
  appUsers,
  config,
  contracts,
  customers,
  documents,
  maintenanceRecords,
  rentals,
  roles,
  syncMetadata,
  vehicleModels,
  vehicles,
  vehicleStatuses,
  workshops,
} from '../schema/sqlite';
// ─── Initialization ───────────────────────────────────────────────────────────

let isInitialized = false;

export async function initDatabase(): Promise<void> {
  const dbPath = path.join(app.getPath('userData'), 'gc-loca-moto.sqlite');
  const migrationsFolder = app.isPackaged
    ? path.join(app.getAppPath(), 'database/migrations/sqlite')
    : path.resolve('database/migrations/sqlite');

  console.log('[DB] Initialization started...');
  console.log('[DB] Target Path:', dbPath);
  console.log('[DB] Migrations Folder:', migrationsFolder);

  try {
    const db = await initDb(dbPath, migrationsFolder);
    await runSeed(db);
    isInitialized = true;
    console.log('[DB] Success! Database initialized and migrated.');
  } catch (error) {
    console.error('[DB] CRITICAL FAILURE during initialization:', error);
    if (error instanceof Error) {
      console.error('[DB] Error Message:', error.message);
      console.error('[DB] Error Stack:', error.stack);
    }
    throw error;
  }
}

// Helper to remove undefined values and convert booleans to integers before binding to SQLite
function cleanObject<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => {
        if (typeof v === 'boolean') return [k, v ? 1 : 0];
        if (v instanceof Date) return [k, v.toISOString()];
        if (Array.isArray(v)) return [k, JSON.stringify(v)];
        if (v !== null && typeof v === 'object') return [k, JSON.stringify(v)];
        return [k, v];
      })
  ) as T;
}

const DEVICE_ID = 'desktop-app';

// Helper types for DTOs
type SyncMetadataKeys = 'created_at' | 'updated_at' | 'updated_by' | 'device_id' | 'version' | 'is_deleted' | 'sync_status';
type InsertDto<T extends keyof typeof import('../schema/sqlite')> = Omit<typeof import('../schema/sqlite')[T]['$inferInsert'], 'id' | SyncMetadataKeys>;
type UpdateDto<T extends keyof typeof import('../schema/sqlite')> = Omit<typeof import('../schema/sqlite')[T]['$inferInsert'], 'id' | SyncMetadataKeys>;

// ─── Config helpers ───────────────────────────────────────────────────────────

async function getConfig(key: string): Promise<string | null> {
  const row = await getDb().select({ value: config.value }).from(config).where(eq(config.key, key)).get();
  return row?.value ?? null;
}

async function setConfig(key: string, value: string): Promise<void> {
  await getDb().insert(config).values({ key, value }).onConflictDoUpdate({ target: config.key, set: { value } });
}

// ─── Sync metadata helpers ────────────────────────────────────────────────────

async function getSyncMetadata(tableName: string): Promise<string | null> {
  const row = await getDb().select({ last_sync_at: syncMetadata.last_sync_at }).from(syncMetadata).where(eq(syncMetadata.table_name, tableName)).get();
  return row?.last_sync_at ?? null;
}

async function setSyncMetadata(tableName: string, timestamp: string): Promise<void> {
  await getDb().insert(syncMetadata).values({ table_name: tableName, last_sync_at: timestamp }).onConflictDoUpdate({ target: syncMetadata.table_name, set: { last_sync_at: timestamp } });
}

// ─── Upsert batch helpers (usados pelo sync — recebem dados snake_case do Supabase) ─

// Nota: estas funções usam SQL raw intencionalmente pois recebem dados dinâmicos
// do Supabase (snake_case) e precisam de INSERT OR REPLACE para eficiência.

async function upsertBatchRaw(table: string, columns: string[], rows: Record<string, unknown>[]): Promise<void> {
  if (rows.length === 0) return;
  const client = getRawDb();
  const colList = columns.join(', ');
  const placeholders = columns.map(c => `:${c}`).join(', ');

  const sql = `INSERT OR REPLACE INTO ${table} (${colList}) VALUES (${placeholders})`;

  const batch = rows.map(item => ({
    sql,
    args: item as any,
  }));

  await client.batch(batch, 'write');
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

export function registerIpcHandlers(): void {
  // ── Config ──
  ipcMain.handle('db:config:get', async (_e, args: { key: string }) => {
    const row = await getDb().select({ value: config.value }).from(config).where(eq(config.key, args.key)).get();
    return row?.value ?? null;
  });
  ipcMain.handle('db:config:set', async (_e, args: { key: string; value: string }) => {
    await getDb().insert(config).values({ key: args.key, value: args.value }).onConflictDoUpdate({ target: config.key, set: { value: args.value } });
  });
  ipcMain.handle('db:config:getAll', async () => await getDb().select().from(config).all());

  // ── Sync metadata ──
  ipcMain.handle('sync:getMetadata', async (_e, args: { table: string }) => {
    const row = await getDb().select({ last_sync_at: syncMetadata.last_sync_at }).from(syncMetadata).where(eq(syncMetadata.table_name, args.table)).get();
    return row?.last_sync_at ?? null;
  });
  ipcMain.handle('sync:setMetadata', async (_e, args: { table: string; timestamp: string }) => {
    await getDb().insert(syncMetadata).values({ table_name: args.table, last_sync_at: args.timestamp }).onConflictDoUpdate({ target: syncMetadata.table_name, set: { last_sync_at: args.timestamp } });
  });

  ipcMain.handle('sync:status', async () => {
    const countPending = async (t: any) => {
      const r = await getDb().select({ n: sql<number>`count(*)` }).from(t).where(eq(t.sync_status, 'pending')).get();
      return r?.n ?? 0;
    };
    const last_sync_at = await getDb().select({ value: config.value }).from(config).where(eq(config.key, 'last_sync_at')).get();
    return {
      lastSync: last_sync_at?.value ?? null,
      pendingCount:
        (await countPending(customers)) +
        (await countPending(vehicleModels)) +
        (await countPending(vehicles)) +
        (await countPending(rentals)) +
        (await countPending(contracts)) +
        (await countPending(maintenanceRecords)) +
        (await countPending(workshops)) +
        (await countPending(documents)) +
        (await countPending(vehicleStatuses)),
    };
  });

  const syncCols = ['id', 'created_at', 'updated_at', 'updated_by', 'device_id', 'version', 'is_deleted', 'sync_status'];

  ipcMain.handle('db:customers:upsertBatch', async (_e, args: { rows: Record<string, unknown>[] }) => {
    await upsertBatchRaw('customers', ['user_id', 'name', 'phone', 'cpf', 'active_contract', 'balance_due', 'last_payment_date', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:vehicleModels:upsertBatch', async (_e, args: { rows: Record<string, unknown>[] }) => {
    await upsertBatchRaw('vehicle_models', ['name', 'brand', 'image_url', 'status', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:vehicles:upsertBatch', async (_e, args: { rows: Record<string, unknown>[] }) => {
    await upsertBatchRaw('vehicles', ['plate', 'model_id', 'year', 'status_id', 'mileage', 'current_renter_id', 'default_monthly_rate', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:rentals:upsertBatch', async (_e, args: { rows: Record<string, unknown>[] }) => {
    await upsertBatchRaw('rentals', ['user_id', 'vehicle_id', 'customer_id', 'start_date', 'end_date', 'monthly_rate', 'status', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:maintenance:upsertBatch', async (_e, args: { rows: Record<string, unknown>[] }) => {
    await upsertBatchRaw('maintenance_records', ['user_id', 'vehicle_id', 'workshop_id', 'vehicle_plate', 'entry_date', 'completion_date', 'mechanic_name', 'description', 'type', 'cost', 'status', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:workshops:upsertBatch', async (_e, args: { rows: Record<string, unknown>[] }) => {
    await upsertBatchRaw('workshops', ['name', 'address', 'status', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:contracts:upsertBatch', async (_e, args: { rows: Record<string, unknown>[] }) => {
    await upsertBatchRaw('contracts', ['rental_id', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:documents:upsertBatch', async (_e, args: { rows: Record<string, unknown>[] }) => {
    await upsertBatchRaw('documents', ['parent_id', 'origin_type', 'file_url', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:vehicleStatuses:upsertBatch', async (_e, args: { rows: Record<string, unknown>[] }) => {
    await upsertBatchRaw('vehicle_statuses', ['name', 'color', 'is_default', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });

  // ── Customers CRUD ──
  ipcMain.handle('db:customers:getAll', async (_e, args: { user_id: string }) => {
    console.log('getAll customers');
    return await getDb().select().from(customers)
      .where(eq(customers.is_deleted, 0))
      .orderBy(customers.name)
      .all();
  });

  ipcMain.handle('db:customers:getById', async (_e, args: { id: string; user_id: string }) => {
    return (await getDb().select().from(customers)
      .where(and(eq(customers.id, args.id), eq(customers.is_deleted, 0)))
      .get()) ?? null;
  });

  ipcMain.handle('db:customers:create', async (_e, args: InsertDto<'customers'> & { user_id: string }) => {
    const now = new Date().toISOString();
    return await getDb().insert(customers).values(cleanObject({
      ...args,
      id: randomUUID(),
      device_id: DEVICE_ID,
      version: 1,
      is_deleted: 0,
      sync_status: 'pending',
      created_at: now,
      updated_at: now,
    })).returning().get();
  });

  ipcMain.handle('db:customers:update', async (_e, args: UpdateDto<'customers'> & { id: string; user_id: string }) => {
    const { id, user_id, ...updates } = args;
    const now = new Date().toISOString();
    return await getDb().update(customers)
      .set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' }))
      .where(and(eq(customers.id, id), eq(customers.user_id, user_id)))
      .returning().get();
  });

  ipcMain.handle('db:customers:delete', async (_e, args: { id: string; user_id: string }) => {
    const now = new Date().toISOString();
    await getDb().update(customers)
      .set({ is_deleted: 1, sync_status: 'pending', updated_at: now })
      .where(and(eq(customers.id, args.id), eq(customers.user_id, args.user_id)))
      .run();
  });

  // ── Vehicle Models CRUD ──
  ipcMain.handle('db:vehicleModels:getAll', async () => {
    return await getDb().select().from(vehicleModels).where(eq(vehicleModels.is_deleted, 0)).orderBy(vehicleModels.name).all();
  });

  ipcMain.handle('db:vehicleModels:getById', async (_e, args: { id: string }) => {
    return (await getDb().select().from(vehicleModels).where(and(eq(vehicleModels.id, args.id), eq(vehicleModels.is_deleted, 0))).get()) ?? null;
  });

  ipcMain.handle('db:vehicleModels:create', async (_e, args: InsertDto<'vehicleModels'>) => {
    const now = new Date().toISOString();
    return await getDb().insert(vehicleModels).values(cleanObject({
      ...args,
      id: randomUUID(),
      device_id: DEVICE_ID,
      version: 1,
      is_deleted: 0,
      sync_status: 'pending',
      created_at: now,
      updated_at: now,
    })).returning().get();
  });

  ipcMain.handle('db:vehicleModels:update', async (_e, args: UpdateDto<'vehicleModels'> & { id: string }) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    return await getDb().update(vehicleModels)
      .set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' }))
      .where(eq(vehicleModels.id, id))
      .returning().get();
  });

  ipcMain.handle('db:vehicleModels:delete', async (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    await getDb().update(vehicleModels).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(vehicleModels.id, args.id)).run();
  });

  // ── Vehicles CRUD ──
  const vehicleWithRelations = async (vehicleRow: typeof vehicles.$inferSelect) => {
    const model = vehicleRow.model_id
      ? (await getDb().select().from(vehicleModels).where(and(eq(vehicleModels.id, vehicleRow.model_id), eq(vehicleModels.is_deleted, 0))).get()) ?? null
      : null;
    const vehicleStatus = vehicleRow.status_id
      ? (await getDb().select().from(vehicleStatuses).where(and(eq(vehicleStatuses.id, vehicleRow.status_id), eq(vehicleStatuses.is_deleted, 0))).get()) ?? null
      : null;
    return { ...vehicleRow, model, vehicleStatus };
  };

  ipcMain.handle('db:vehicles:getAll', async () => {
    const rows = await getDb().select().from(vehicles).where(eq(vehicles.is_deleted, 0)).orderBy(desc(vehicles.created_at)).all();
    const allModels = await getDb().select().from(vehicleModels).where(eq(vehicleModels.is_deleted, 0)).all();
    const allStatuses = await getDb().select().from(vehicleStatuses).where(eq(vehicleStatuses.is_deleted, 0)).all();
    const modelMap = new Map(allModels.map(m => [m.id, m]));
    const statusMap = new Map(allStatuses.map(s => [s.id, s]));
    return rows.map(v => ({ ...v, model: modelMap.get(v.model_id!) ?? null, vehicleStatus: statusMap.get(v.status_id) ?? null }));
  });

  ipcMain.handle('db:vehicles:getById', async (_e, args: { id: string }) => {
    const v = await getDb().select().from(vehicles).where(and(eq(vehicles.id, args.id), eq(vehicles.is_deleted, 0))).get();
    if (!v) return null;
    return await vehicleWithRelations(v);
  });

  ipcMain.handle('db:vehicles:create', async (_e, args: InsertDto<'vehicles'>) => {
    const now = new Date().toISOString();
    const result = await getDb().insert(vehicles).values(cleanObject({
      ...args,
      id: randomUUID(),
      device_id: DEVICE_ID,
      version: 1,
      is_deleted: 0,
      sync_status: 'pending',
      created_at: now,
      updated_at: now,
    })).returning().get();
    return await vehicleWithRelations(result);
  });

  ipcMain.handle('db:vehicles:update', async (_e, args: UpdateDto<'vehicles'> & { id: string }) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    const result = await getDb().update(vehicles)
      .set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' }))
      .where(eq(vehicles.id, id))
      .returning().get();
    return await vehicleWithRelations(result!);
  });

  ipcMain.handle('db:vehicles:delete', async (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    await getDb().update(vehicles).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(vehicles.id, args.id)).run();
  });

  // ── Rentals CRUD ──
  ipcMain.handle('db:rentals:getAll', async (_e, args: { user_id: string }) => {
    return await getDb().select().from(rentals)
      .where(and(eq(rentals.user_id, args.user_id), eq(rentals.is_deleted, 0)))
      .orderBy(desc(rentals.start_date))
      .all();
  });

  ipcMain.handle('db:rentals:getById', async (_e, args: { id: string; user_id: string }) => {
    return (await getDb().select().from(rentals)
      .where(and(eq(rentals.id, args.id), eq(rentals.user_id, args.user_id), eq(rentals.is_deleted, 0)))
      .get()) ?? null;
  });

  ipcMain.handle('db:rentals:create', async (_e, args: InsertDto<'rentals'> & { user_id: string }) => {
    const now = new Date().toISOString();
    return await getDb().insert(rentals).values(cleanObject({
      ...args,
      id: randomUUID(),
      device_id: DEVICE_ID,
      version: 1,
      is_deleted: 0,
      sync_status: 'pending',
      created_at: now,
      updated_at: now,
    })).returning().get();
  });

  ipcMain.handle('db:rentals:update', async (_e, args: UpdateDto<'rentals'> & { id: string; user_id: string }) => {
    const { id, user_id, ...updates } = args;
    const now = new Date().toISOString();
    return await getDb().update(rentals)
      .set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' }))
      .where(and(eq(rentals.id, id), eq(rentals.user_id, user_id)))
      .returning().get();
  });

  ipcMain.handle('db:rentals:delete', async (_e, args: { id: string; user_id: string }) => {
    const now = new Date().toISOString();
    await getDb().update(rentals).set({ is_deleted: 1, sync_status: 'pending', updated_at: now })
      .where(and(eq(rentals.id, args.id), eq(rentals.user_id, args.user_id)))
      .run();
  });

  // ── Maintenance Records CRUD ──
  ipcMain.handle('db:maintenance:getAll', async (_e, args: { user_id: string }) => {
    return await getDb().select().from(maintenanceRecords)
      .where(and(eq(maintenanceRecords.user_id, args.user_id), eq(maintenanceRecords.is_deleted, 0)))
      .orderBy(desc(maintenanceRecords.entry_date))
      .all();
  });

  ipcMain.handle('db:maintenance:getById', async (_e, args: { id: string; user_id: string }) => {
    return (await getDb().select().from(maintenanceRecords)
      .where(and(eq(maintenanceRecords.id, args.id), eq(maintenanceRecords.user_id, args.user_id), eq(maintenanceRecords.is_deleted, 0)))
      .get()) ?? null;
  });

  ipcMain.handle('db:maintenance:create', async (_e, args: InsertDto<'maintenanceRecords'> & { user_id: string }) => {
    const now = new Date().toISOString();
    return await getDb().insert(maintenanceRecords).values(cleanObject({
      ...args,
      id: randomUUID(),
      device_id: DEVICE_ID,
      version: 1,
      is_deleted: 0,
      sync_status: 'pending',
      created_at: now,
      updated_at: now,
    })).returning().get();
  });

  ipcMain.handle('db:maintenance:update', async (_e, args: UpdateDto<'maintenanceRecords'> & { id: string; user_id: string }) => {
    const { id, user_id, ...updates } = args;
    const now = new Date().toISOString();
    return await getDb().update(maintenanceRecords)
      .set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' }))
      .where(and(eq(maintenanceRecords.id, id), eq(maintenanceRecords.user_id, user_id)))
      .returning().get();
  });

  ipcMain.handle('db:maintenance:delete', async (_e, args: { id: string; user_id: string }) => {
    const now = new Date().toISOString();
    await getDb().update(maintenanceRecords).set({ is_deleted: 1, sync_status: 'pending', updated_at: now })
      .where(and(eq(maintenanceRecords.id, args.id), eq(maintenanceRecords.user_id, args.user_id)))
      .run();
  });

  // ── Workshops CRUD ──
  ipcMain.handle('db:workshops:getAll', async () => {
    return await getDb().select().from(workshops).where(eq(workshops.is_deleted, 0)).orderBy(workshops.name).all();
  });

  ipcMain.handle('db:workshops:getById', async (_e, args: { id: string }) => {
    return (await getDb().select().from(workshops).where(and(eq(workshops.id, args.id), eq(workshops.is_deleted, 0))).get()) ?? null;
  });

  ipcMain.handle('db:workshops:create', async (_e, args: InsertDto<'workshops'>) => {
    const now = new Date().toISOString();
    return await getDb().insert(workshops).values(cleanObject({
      ...args,
      id: randomUUID(),
      device_id: DEVICE_ID,
      version: 1,
      is_deleted: 0,
      sync_status: 'pending',
      created_at: now,
      updated_at: now,
    })).returning().get();
  });

  ipcMain.handle('db:workshops:update', async (_e, args: UpdateDto<'workshops'> & { id: string }) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    return await getDb().update(workshops)
      .set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' }))
      .where(eq(workshops.id, id))
      .returning().get();
  });

  ipcMain.handle('db:workshops:delete', async (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    await getDb().update(workshops).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(workshops.id, args.id)).run();
  });

  // ── Vehicle Statuses CRUD ──
  ipcMain.handle('db:vehicleStatuses:getAll', async () => {
    return await getDb().select().from(vehicleStatuses).where(eq(vehicleStatuses.is_deleted, 0)).all();
  });

  ipcMain.handle('db:vehicleStatuses:getById', async (_e, args: { id: string }) => {
    return (await getDb().select().from(vehicleStatuses).where(and(eq(vehicleStatuses.id, args.id), eq(vehicleStatuses.is_deleted, 0))).get()) ?? null;
  });

  ipcMain.handle('db:vehicleStatuses:create', async (_e, args: InsertDto<'vehicleStatuses'>) => {
    const now = new Date().toISOString();
    return await getDb().insert(vehicleStatuses).values(cleanObject({
      ...args,
      id: randomUUID(),
      device_id: DEVICE_ID,
      version: 1,
      is_deleted: 0,
      sync_status: 'pending',
      created_at: now,
      updated_at: now,
    })).returning().get();
  });

  ipcMain.handle('db:vehicleStatuses:update', async (_e, args: UpdateDto<'vehicleStatuses'> & { id: string }) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    return await getDb().update(vehicleStatuses)
      .set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' }))
      .where(eq(vehicleStatuses.id, id))
      .returning().get();
  });

  ipcMain.handle('db:vehicleStatuses:delete', async (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    await getDb().update(vehicleStatuses).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(vehicleStatuses.id, args.id)).run();
  });

  // ── Contracts CRUD ──
  ipcMain.handle('db:contracts:getAll', async () => {
    return await getDb().select().from(contracts).where(eq(contracts.is_deleted, 0)).orderBy(desc(contracts.created_at)).all();
  });

  ipcMain.handle('db:contracts:getById', async (_e, args: { id: string }) => {
    return (await getDb().select().from(contracts).where(and(eq(contracts.id, args.id), eq(contracts.is_deleted, 0))).get()) ?? null;
  });

  ipcMain.handle('db:contracts:getByRental', async (_e, args: { rental_id: string }) => {
    return (await getDb().select().from(contracts).where(and(eq(contracts.rental_id, args.rental_id), eq(contracts.is_deleted, 0))).get()) ?? null;
  });

  ipcMain.handle('db:contracts:create', async (_e, args: InsertDto<'contracts'>) => {
    const now = new Date().toISOString();
    return await getDb().insert(contracts).values({
      ...args,
      id: randomUUID(),
      device_id: DEVICE_ID,
      version: 1,
      is_deleted: 0,
      sync_status: 'pending',
      created_at: now,
      updated_at: now,
    }).returning().get();
  });

  ipcMain.handle('db:contracts:delete', async (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    await getDb().update(contracts).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(contracts.id, args.id)).run();
  });

  // ── Documents CRUD ──
  ipcMain.handle('db:documents:getAll', async () => {
    return await getDb().select().from(documents).where(eq(documents.is_deleted, 0)).orderBy(desc(documents.created_at)).all();
  });

  ipcMain.handle('db:documents:getByParent', async (_e, args: { parent_id: string; origin_type: string }) => {
    return await getDb().select().from(documents)
      .where(and(eq(documents.parent_id, args.parent_id), eq(documents.origin_type, args.origin_type), eq(documents.is_deleted, 0)))
      .orderBy(desc(documents.created_at))
      .all();
  });

  ipcMain.handle('db:documents:create', async (_e, args: InsertDto<'documents'>) => {
    const now = new Date().toISOString();
    return await getDb().insert(documents).values(cleanObject({
      ...args,
      id: randomUUID(),
      device_id: DEVICE_ID,
      version: 1,
      is_deleted: 0,
      sync_status: 'pending',
      created_at: now,
      updated_at: now,
    })).returning().get();
  });

  ipcMain.handle('db:documents:delete', async (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    await getDb().update(documents).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(documents.id, args.id)).run();
  });

  // ── Roles CRUD ──
  ipcMain.handle('db:roles:getAll', async () => {
    const rows = await getDb().select().from(roles).where(eq(roles.is_deleted, 0)).orderBy(roles.name).all();
    return rows.map(r => ({ ...r, permissions: JSON.parse(r.permissions) }));
  });

  ipcMain.handle('db:roles:getById', async (_e, args: { id: string }) => {
    const r = await getDb().select().from(roles).where(and(eq(roles.id, args.id), eq(roles.is_deleted, 0))).get();
    if (!r) return null;
    return { ...r, permissions: JSON.parse(r.permissions) };
  });

  ipcMain.handle('db:roles:create', async (_e, args: InsertDto<'roles'> & { permissions: string[] }) => {
    const now = new Date().toISOString();
    const { permissions, ...rest } = args;
    const result = await getDb().insert(roles).values(cleanObject({
      ...rest,
      id: randomUUID(),
      device_id: DEVICE_ID,
      version: 1,
      is_deleted: 0,
      sync_status: 'pending',
      permissions: JSON.stringify(permissions),
      created_at: now,
      updated_at: now,
    })).returning().get();
    return { ...result, permissions: JSON.parse(result!.permissions) };
  });

  ipcMain.handle('db:roles:update', async (_e, args: UpdateDto<'roles'> & { id: string; permissions: string[] }) => {
    const now = new Date().toISOString();
    const { id, permissions, ...updates } = args;
    const result = await getDb().update(roles).set(cleanObject({
      ...updates,
      permissions: JSON.stringify(permissions),
      updated_at: now,
      sync_status: 'pending',
    })).where(eq(roles.id, id)).returning().get();
    return { ...result, permissions: JSON.parse(result!.permissions) };
  });

  ipcMain.handle('db:roles:delete', async (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    await getDb().update(roles).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(roles.id, args.id)).run();
  });

  // ── Users CRUD ──
  ipcMain.handle('db:users:getAll', async () => {
    const users = await getDb().select().from(appUsers).where(eq(appUsers.is_deleted, 0)).orderBy(appUsers.name).all();
    const allRoles = await getDb().select().from(roles).where(eq(roles.is_deleted, 0)).all();
    const roleMap = new Map(allRoles.map(r => [r.id, r]));
    return users.map(u => {
      const role = roleMap.get(u.role_id);
      return {
        ...u,
        role: role ? {
          ...role,
          permissions: typeof role.permissions === 'string'
            ? JSON.parse(role.permissions)
            : role.permissions
        } : undefined
      };
    });
  });

  ipcMain.handle('db:users:getById', async (_e, args: { id: string }) => {
    const u = await getDb().select().from(appUsers).where(and(eq(appUsers.id, args.id), eq(appUsers.is_deleted, 0))).get();
    if (!u) return null;
    const role = await getDb().select().from(roles).where(and(eq(roles.id, u.role_id), eq(roles.is_deleted, 0))).get();
    return { ...u, role: role ? { ...role, permissions: typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions } : undefined };
  });

  ipcMain.handle('db:users:create', async (_e, args: InsertDto<'appUsers'>) => {
    const now = new Date().toISOString();
    return await getDb().insert(appUsers).values(cleanObject({
      ...args,
      id: randomUUID(),
      device_id: DEVICE_ID,
      version: 1,
      is_deleted: 0,
      sync_status: 'pending',
      created_at: now,
      updated_at: now,
    })).returning().get();
  });

  ipcMain.handle('db:users:update', async (_e, args: UpdateDto<'appUsers'> & { id: string }) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    return await getDb().update(appUsers).set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' })).where(eq(appUsers.id, id)).returning().get();
  });

  ipcMain.handle('db:users:delete', async (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    await getDb().update(appUsers).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(appUsers.id, args.id)).run();
  });

  ipcMain.handle('db:users:login', async (_e, args: { email: string; password?: string }) => {
    let user = args.password
      ? await getDb().select().from(appUsers).where(and(eq(appUsers.email, args.email), eq(appUsers.password, args.password), eq(appUsers.is_deleted, 0))).get()
      : await getDb().select().from(appUsers).where(and(eq(appUsers.email, args.email), eq(appUsers.is_deleted, 0))).get();

    if (!user) return null;

    const role = await getDb().select().from(roles).where(and(eq(roles.id, user.role_id), eq(roles.is_deleted, 0))).get();

    // Don't leak password in session
    const { password: _, ...userSafe } = user;

    return {
      ...userSafe,
      role: role ? {
        ...role,
        permissions: typeof role.permissions === 'string'
          ? JSON.parse(role.permissions)
          : role.permissions
      } : undefined,
    };
  });

  // ── App info ──
  ipcMain.handle('app:isElectron', () => true);
  ipcMain.handle('app:getVersion', () => app.getVersion());
}
