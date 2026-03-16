import { app, ipcMain } from 'electron';
import path from 'path';
import { randomUUID } from 'crypto';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { initDb, getDb, getRawDb } from '../client/sqlite';
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

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'gc-loca-moto.sqlite');
  // Em desenvolvimento: migrations estão em database/migrations/sqlite (raiz do projeto)
  // Em produção (electron-builder): dentro do app.asar
  const migrationsFolder = app.isPackaged
    ? path.join(app.getAppPath(), 'database/migrations/sqlite')
    : path.resolve('database/migrations/sqlite');

  console.log('Resolved Migrations folder:', migrationsFolder);
  console.log('Exists?', require('fs').existsSync(migrationsFolder));
  if (require('fs').existsSync(migrationsFolder)) {
    console.log('Meta Exists?', require('fs').existsSync(path.join(migrationsFolder, 'meta', '_journal.json')));
  }

  try {
    initDb(dbPath, migrationsFolder);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.error('Tried migrations at:', migrationsFolder);
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

function getConfig(key: string): string | null {
  const row = getDb().select({ value: config.value }).from(config).where(eq(config.key, key)).get();
  return row?.value ?? null;
}

function setConfig(key: string, value: string): void {
    const db = getDb();
    getDb().insert(config).values({ key, value }).onConflictDoUpdate({ target: config.key, set: { value } }).run();
}

// ─── Sync metadata helpers ────────────────────────────────────────────────────

function getSyncMetadata(tableName: string): string | null {
  const row = getDb().select({ last_sync_at: syncMetadata.last_sync_at }).from(syncMetadata).where(eq(syncMetadata.table_name, tableName)).get();
  return row?.last_sync_at ?? null;
}

function setSyncMetadata(tableName: string, timestamp: string): void {
  getDb().insert(syncMetadata).values({ table_name: tableName, last_sync_at: timestamp }).onConflictDoUpdate({ target: syncMetadata.table_name, set: { last_sync_at: timestamp } }).run();
}

// ─── Upsert batch helpers (usados pelo sync — recebem dados snake_case do Supabase) ─

// Nota: estas funções usam SQL raw intencionalmente pois recebem dados dinâmicos
// do Supabase (snake_case) e precisam de INSERT OR REPLACE para eficiência.

function upsertBatchRaw(table: string, columns: string[], rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return;
  const sqlite = getRawDb();
  const colList = columns.join(', ');
  const placeholders = columns.map(c => `@${c}`).join(', ');
  const stmt = sqlite.prepare(`INSERT OR REPLACE INTO ${table} (${colList}) VALUES (${placeholders})`);
  const insertMany = sqlite.transaction((items: Record<string, unknown>[]) => {
    for (const item of items) stmt.run(item);
  });
  insertMany(rows);
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

export function registerIpcHandlers(): void {
  // Nota: Usamos getDb() dentro dos handlers para garantir que o banco esteja inicializado
  // e evitar erro fatal na montagem se o initDatabase falhar.

  // ── Config ──
  ipcMain.handle('db:config:get', (_e, args: { key: string }) => getConfig(args.key));
  ipcMain.handle('db:config:set', (_e, args: { key: string; value: string }) => setConfig(args.key, args.value));
  ipcMain.handle('db:config:getAll', () => getDb().select().from(config).all());

  // ── Sync metadata ──
  ipcMain.handle('sync:getMetadata', (_e, args: { table: string }) => getSyncMetadata(args.table));
  ipcMain.handle('sync:setMetadata', (_e, args: { table: string; timestamp: string }) => setSyncMetadata(args.table, args.timestamp));

  ipcMain.handle('sync:status', () => {
    const countPending = (t: any) => {
      const r = getDb().select({ n: sql<number>`count(*)` }).from(t).where(eq(t.sync_status, 'pending')).get();
      return r?.n ?? 0;
    };
    return {
      lastSync: getConfig('last_sync_at'),
      pendingCount:
        countPending(customers) +
        countPending(vehicleModels) +
        countPending(vehicles) +
        countPending(rentals) +
        countPending(contracts) +
        countPending(maintenanceRecords) +
        countPending(workshops) +
        countPending(documents) +
        countPending(vehicleStatuses),
    };
  });

  const syncCols = ['id', 'created_at', 'updated_at', 'updated_by', 'device_id', 'version', 'is_deleted', 'sync_status'];

  ipcMain.handle('db:customers:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('customers', ['user_id', 'name', 'phone', 'cpf', 'active_contract', 'balance_due', 'last_payment_date', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:vehicleModels:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('vehicle_models', ['name', 'brand', 'image_url', 'status', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:vehicles:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('vehicles', ['plate', 'model_id', 'year', 'status_id', 'mileage', 'current_renter_id', 'default_monthly_rate', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:rentals:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('rentals', ['user_id', 'vehicle_id', 'customer_id', 'start_date', 'end_date', 'monthly_rate', 'status', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:maintenance:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('maintenance_records', ['user_id', 'vehicle_id', 'workshop_id', 'vehicle_plate', 'entry_date', 'completion_date', 'mechanic_name', 'description', 'type', 'cost', 'status', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:workshops:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('workshops', ['name', 'address', 'status', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:contracts:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('contracts', ['rental_id', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:documents:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('documents', ['parent_id', 'origin_type', 'file_url', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });
  ipcMain.handle('db:vehicleStatuses:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('vehicle_statuses', ['name', 'color', 'is_default', ...syncCols], args.rows.map(r => ({ ...r, sync_status: 'synced' })));
  });

  // ── Customers CRUD ──
  ipcMain.handle('db:customers:getAll', (_e, args: { user_id: string }) => {
    return getDb().select().from(customers)
      .where(and(eq(customers.user_id, args.user_id), eq(customers.is_deleted, 0)))
      .orderBy(customers.name)
      .all();
  });

  ipcMain.handle('db:customers:getById', (_e, args: { id: string; user_id: string }) => {
    return getDb().select().from(customers)
      .where(and(eq(customers.id, args.id), eq(customers.user_id, args.user_id), eq(customers.is_deleted, 0)))
      .get() ?? null;
  });

  ipcMain.handle('db:customers:create', (_e, args: InsertDto<'customers'> & { user_id: string }) => {
    const now = new Date().toISOString();
    return getDb().insert(customers).values(cleanObject({
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

  ipcMain.handle('db:customers:update', (_e, args: UpdateDto<'customers'> & { id: string; user_id: string }) => {
    const { id, user_id, ...updates } = args;
    const now = new Date().toISOString();
    return getDb().update(customers)
      .set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' }))
      .where(and(eq(customers.id, id), eq(customers.user_id, user_id)))
      .returning().get();
  });

  ipcMain.handle('db:customers:delete', (_e, args: { id: string; user_id: string }) => {
    const now = new Date().toISOString();
    getDb().update(customers)
      .set({ is_deleted: 1, sync_status: 'pending', updated_at: now })
      .where(and(eq(customers.id, args.id), eq(customers.user_id, args.user_id)))
      .run();
  });

  // ── Vehicle Models CRUD ──
  ipcMain.handle('db:vehicleModels:getAll', () => {
    return getDb().select().from(vehicleModels).where(eq(vehicleModels.is_deleted, 0)).orderBy(vehicleModels.name).all();
  });

  ipcMain.handle('db:vehicleModels:getById', (_e, args: { id: string }) => {
    return getDb().select().from(vehicleModels).where(and(eq(vehicleModels.id, args.id), eq(vehicleModels.is_deleted, 0))).get() ?? null;
  });

  ipcMain.handle('db:vehicleModels:create', (_e, args: InsertDto<'vehicleModels'>) => {
    const now = new Date().toISOString();
    return getDb().insert(vehicleModels).values(cleanObject({
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

  ipcMain.handle('db:vehicleModels:update', (_e, args: UpdateDto<'vehicleModels'> & { id: string }) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    return getDb().update(vehicleModels)
      .set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' }))
      .where(eq(vehicleModels.id, id))
      .returning().get();
  });

  ipcMain.handle('db:vehicleModels:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    getDb().update(vehicleModels).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(vehicleModels.id, args.id)).run();
  });

  // ── Vehicles CRUD ──
  const vehicleWithRelations = (vehicleRow: typeof vehicles.$inferSelect) => {
    const model = vehicleRow.model_id
      ? getDb().select().from(vehicleModels).where(and(eq(vehicleModels.id, vehicleRow.model_id), eq(vehicleModels.is_deleted, 0))).get() ?? null
      : null;
    const vehicleStatus = vehicleRow.status_id
      ? getDb().select().from(vehicleStatuses).where(and(eq(vehicleStatuses.id, vehicleRow.status_id), eq(vehicleStatuses.is_deleted, 0))).get() ?? null
      : null;
    return { ...vehicleRow, model, vehicleStatus };
  };

  ipcMain.handle('db:vehicles:getAll', () => {
    const rows = getDb().select().from(vehicles).where(eq(vehicles.is_deleted, 0)).orderBy(desc(vehicles.created_at)).all();
    const allModels = getDb().select().from(vehicleModels).where(eq(vehicleModels.is_deleted, 0)).all();
    const allStatuses = getDb().select().from(vehicleStatuses).where(eq(vehicleStatuses.is_deleted, 0)).all();
    const modelMap = new Map(allModels.map(m => [m.id, m]));
    const statusMap = new Map(allStatuses.map(s => [s.id, s]));
    return rows.map(v => ({ ...v, model: modelMap.get(v.model_id!) ?? null, vehicleStatus: statusMap.get(v.status_id) ?? null }));
  });

  ipcMain.handle('db:vehicles:getById', (_e, args: { id: string }) => {
    const v = getDb().select().from(vehicles).where(and(eq(vehicles.id, args.id), eq(vehicles.is_deleted, 0))).get();
    if (!v) return null;
    return vehicleWithRelations(v);
  });

  ipcMain.handle('db:vehicles:create', (_e, args: InsertDto<'vehicles'>) => {
    const now = new Date().toISOString();
    const result = getDb().insert(vehicles).values(cleanObject({
      ...args,
      id: randomUUID(),
      device_id: DEVICE_ID,
      version: 1,
      is_deleted: 0,
      sync_status: 'pending',
      created_at: now,
      updated_at: now,
    })).returning().get();
    return vehicleWithRelations(result);
  });

  ipcMain.handle('db:vehicles:update', (_e, args: UpdateDto<'vehicles'> & { id: string }) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    const result = getDb().update(vehicles)
      .set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' }))
      .where(eq(vehicles.id, id))
      .returning().get();
    return vehicleWithRelations(result);
  });

  ipcMain.handle('db:vehicles:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    getDb().update(vehicles).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(vehicles.id, args.id)).run();
  });

  // ── Rentals CRUD ──
  ipcMain.handle('db:rentals:getAll', (_e, args: { user_id: string }) => {
    return getDb().select().from(rentals)
      .where(and(eq(rentals.user_id, args.user_id), eq(rentals.is_deleted, 0)))
      .orderBy(desc(rentals.start_date))
      .all();
  });

  ipcMain.handle('db:rentals:getById', (_e, args: { id: string; user_id: string }) => {
    return getDb().select().from(rentals)
      .where(and(eq(rentals.id, args.id), eq(rentals.user_id, args.user_id), eq(rentals.is_deleted, 0)))
      .get() ?? null;
  });

  ipcMain.handle('db:rentals:create', (_e, args: InsertDto<'rentals'> & { user_id: string }) => {
    const now = new Date().toISOString();
    return getDb().insert(rentals).values(cleanObject({
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

  ipcMain.handle('db:rentals:update', (_e, args: UpdateDto<'rentals'> & { id: string; user_id: string }) => {
    const { id, user_id, ...updates } = args;
    const now = new Date().toISOString();
    return getDb().update(rentals)
      .set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' }))
      .where(and(eq(rentals.id, id), eq(rentals.user_id, user_id)))
      .returning().get();
  });

  ipcMain.handle('db:rentals:delete', (_e, args: { id: string; user_id: string }) => {
    const now = new Date().toISOString();
    getDb().update(rentals).set({ is_deleted: 1, sync_status: 'pending', updated_at: now })
      .where(and(eq(rentals.id, args.id), eq(rentals.user_id, args.user_id)))
      .run();
  });

  // ── Maintenance Records CRUD ──
  ipcMain.handle('db:maintenance:getAll', (_e, args: { user_id: string }) => {
    return getDb().select().from(maintenanceRecords)
      .where(and(eq(maintenanceRecords.user_id, args.user_id), eq(maintenanceRecords.is_deleted, 0)))
      .orderBy(desc(maintenanceRecords.entry_date))
      .all();
  });

  ipcMain.handle('db:maintenance:getById', (_e, args: { id: string; user_id: string }) => {
    return getDb().select().from(maintenanceRecords)
      .where(and(eq(maintenanceRecords.id, args.id), eq(maintenanceRecords.user_id, args.user_id), eq(maintenanceRecords.is_deleted, 0)))
      .get() ?? null;
  });

  ipcMain.handle('db:maintenance:create', (_e, args: InsertDto<'maintenanceRecords'> & { user_id: string }) => {
    const now = new Date().toISOString();
    return getDb().insert(maintenanceRecords).values(cleanObject({
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

  ipcMain.handle('db:maintenance:update', (_e, args: UpdateDto<'maintenanceRecords'> & { id: string; user_id: string }) => {
    const { id, user_id, ...updates } = args;
    const now = new Date().toISOString();
    return getDb().update(maintenanceRecords)
      .set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' }))
      .where(and(eq(maintenanceRecords.id, id), eq(maintenanceRecords.user_id, user_id)))
      .returning().get();
  });

  ipcMain.handle('db:maintenance:delete', (_e, args: { id: string; user_id: string }) => {
    const now = new Date().toISOString();
    getDb().update(maintenanceRecords).set({ is_deleted: 1, sync_status: 'pending', updated_at: now })
      .where(and(eq(maintenanceRecords.id, args.id), eq(maintenanceRecords.user_id, args.user_id)))
      .run();
  });

  // ── Workshops CRUD ──
  ipcMain.handle('db:workshops:getAll', () => {
    return getDb().select().from(workshops).where(eq(workshops.is_deleted, 0)).orderBy(workshops.name).all();
  });

  ipcMain.handle('db:workshops:getById', (_e, args: { id: string }) => {
    return getDb().select().from(workshops).where(and(eq(workshops.id, args.id), eq(workshops.is_deleted, 0))).get() ?? null;
  });

  ipcMain.handle('db:workshops:create', (_e, args: InsertDto<'workshops'>) => {
    const now = new Date().toISOString();
    return getDb().insert(workshops).values(cleanObject({
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

  ipcMain.handle('db:workshops:update', (_e, args: UpdateDto<'workshops'> & { id: string }) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    return getDb().update(workshops)
      .set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' }))
      .where(eq(workshops.id, id))
      .returning().get();
  });

  ipcMain.handle('db:workshops:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    getDb().update(workshops).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(workshops.id, args.id)).run();
  });

  // ── Vehicle Statuses CRUD ──
  ipcMain.handle('db:vehicleStatuses:getAll', () => {
    return getDb().select().from(vehicleStatuses).where(eq(vehicleStatuses.is_deleted, 0)).all();
  });

  ipcMain.handle('db:vehicleStatuses:getById', (_e, args: { id: string }) => {
    return getDb().select().from(vehicleStatuses).where(and(eq(vehicleStatuses.id, args.id), eq(vehicleStatuses.is_deleted, 0))).get() ?? null;
  });

  ipcMain.handle('db:vehicleStatuses:create', (_e, args: InsertDto<'vehicleStatuses'>) => {
    const now = new Date().toISOString();
    return getDb().insert(vehicleStatuses).values(cleanObject({
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

  ipcMain.handle('db:vehicleStatuses:update', (_e, args: UpdateDto<'vehicleStatuses'> & { id: string }) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    return getDb().update(vehicleStatuses)
      .set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' }))
      .where(eq(vehicleStatuses.id, id))
      .returning().get();
  });

  ipcMain.handle('db:vehicleStatuses:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    getDb().update(vehicleStatuses).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(vehicleStatuses.id, args.id)).run();
  });

  // ── Contracts CRUD ──
  ipcMain.handle('db:contracts:getAll', () => {
    return getDb().select().from(contracts).where(eq(contracts.is_deleted, 0)).orderBy(desc(contracts.created_at)).all();
  });

  ipcMain.handle('db:contracts:getById', (_e, args: { id: string }) => {
    return getDb().select().from(contracts).where(and(eq(contracts.id, args.id), eq(contracts.is_deleted, 0))).get() ?? null;
  });

  ipcMain.handle('db:contracts:getByRental', (_e, args: { rental_id: string }) => {
    return getDb().select().from(contracts).where(and(eq(contracts.rental_id, args.rental_id), eq(contracts.is_deleted, 0))).get() ?? null;
  });

  ipcMain.handle('db:contracts:create', (_e, args: InsertDto<'contracts'>) => {
    const now = new Date().toISOString();
    return getDb().insert(contracts).values({
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

  ipcMain.handle('db:contracts:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    getDb().update(contracts).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(contracts.id, args.id)).run();
  });

  // ── Documents CRUD ──
  ipcMain.handle('db:documents:getAll', () => {
    return getDb().select().from(documents).where(eq(documents.is_deleted, 0)).orderBy(desc(documents.created_at)).all();
  });

  ipcMain.handle('db:documents:getByParent', (_e, args: { parent_id: string; origin_type: string }) => {
    return getDb().select().from(documents)
      .where(and(eq(documents.parent_id, args.parent_id), eq(documents.origin_type, args.origin_type), eq(documents.is_deleted, 0)))
      .orderBy(desc(documents.created_at))
      .all();
  });

  ipcMain.handle('db:documents:create', (_e, args: InsertDto<'documents'>) => {
    const now = new Date().toISOString();
    return getDb().insert(documents).values(cleanObject({
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

  ipcMain.handle('db:documents:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    getDb().update(documents).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(documents.id, args.id)).run();
  });

  // ── Roles CRUD ──
  ipcMain.handle('db:roles:getAll', () => {
    return getDb().select().from(roles).where(eq(roles.is_deleted, 0)).orderBy(roles.name).all()
      .map(r => ({ ...r, permissions: JSON.parse(r.permissions) }));
  });

  ipcMain.handle('db:roles:getById', (_e, args: { id: string }) => {
    const r = getDb().select().from(roles).where(and(eq(roles.id, args.id), eq(roles.is_deleted, 0))).get();
    if (!r) return null;
    return { ...r, permissions: JSON.parse(r.permissions) };
  });

  ipcMain.handle('db:roles:create', (_e, args: InsertDto<'roles'> & { permissions: string[] }) => {
    const now = new Date().toISOString();
    const { permissions, ...rest } = args;
    const result = getDb().insert(roles).values(cleanObject({
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
    return { ...result, permissions: JSON.parse(result.permissions) };
  });

  ipcMain.handle('db:roles:update', (_e, args: UpdateDto<'roles'> & { id: string; permissions: string[] }) => {
    const now = new Date().toISOString();
    const { id, permissions, ...updates } = args;
    const result = getDb().update(roles).set(cleanObject({
      ...updates,
      permissions: JSON.stringify(permissions),
      updated_at: now,
      sync_status: 'pending',
    })).where(eq(roles.id, id)).returning().get();
    return { ...result, permissions: JSON.parse(result.permissions) };
  });

  ipcMain.handle('db:roles:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    getDb().update(roles).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(roles.id, args.id)).run();
  });

  // ── Users CRUD ──
  ipcMain.handle('db:users:getAll', () => {
    const users = getDb().select().from(appUsers).where(eq(appUsers.is_deleted, 0)).orderBy(appUsers.name).all();
    const allRoles = getDb().select().from(roles).where(eq(roles.is_deleted, 0)).all();
    const roleMap = new Map(allRoles.map(r => [r.id, r]));
    return users.map(u => {
      const role = roleMap.get(u.role_id);
      return { ...u, role: role ? { ...role, permissions: JSON.parse(role.permissions) } : undefined };
    });
  });

  ipcMain.handle('db:users:getById', (_e, args: { id: string }) => {
    const u = getDb().select().from(appUsers).where(and(eq(appUsers.id, args.id), eq(appUsers.is_deleted, 0))).get();
    if (!u) return null;
    const role = getDb().select().from(roles).where(and(eq(roles.id, u.role_id), eq(roles.is_deleted, 0))).get();
    return { ...u, role: role ? { ...role, permissions: JSON.parse(role.permissions) } : undefined };
  });

  ipcMain.handle('db:users:create', (_e, args: InsertDto<'appUsers'>) => {
    const now = new Date().toISOString();
    return getDb().insert(appUsers).values(cleanObject({
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

  ipcMain.handle('db:users:update', (_e, args: UpdateDto<'appUsers'> & { id: string }) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    return getDb().update(appUsers).set(cleanObject({ ...updates, updated_at: now, sync_status: 'pending' })).where(eq(appUsers.id, id)).returning().get();
  });

  ipcMain.handle('db:users:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    getDb().update(appUsers).set({ is_deleted: 1, sync_status: 'pending', updated_at: now }).where(eq(appUsers.id, args.id)).run();
  });

  ipcMain.handle('db:users:login', (_e, args: { email: string; password?: string }) => {
    let user = args.password
      ? getDb().select().from(appUsers).where(and(eq(appUsers.email, args.email), eq(appUsers.password, args.password), eq(appUsers.is_deleted, 0))).get()
      : getDb().select().from(appUsers).where(and(eq(appUsers.email, args.email), eq(appUsers.is_deleted, 0))).get();

    if (!user) return null;

    const role = getDb().select().from(roles).where(and(eq(roles.id, user.role_id), eq(roles.is_deleted, 0))).get();
    
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
