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
import { runSeed } from './seed';

// ─── Initialization ───────────────────────────────────────────────────────────

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'gc-loca-moto.sqlite');
  // Em desenvolvimento: migrations estão em database/migrations/sqlite (raiz do projeto)
  // Em produção (electron-builder): empacotadas junto com o app
  const migrationsFolder = app.isPackaged
    ? path.join(process.resourcesPath, 'database/migrations/sqlite')
    : path.resolve('database/migrations/sqlite');

  console.log('Resolved Migrations folder:', migrationsFolder);
  console.log('Exists?', require('fs').existsSync(migrationsFolder));
  if (require('fs').existsSync(migrationsFolder)) {
    console.log('Meta Exists?', require('fs').existsSync(path.join(migrationsFolder, 'meta', '_journal.json')));
  }

  try {
    initDb(dbPath, migrationsFolder);
    runSeed(getDb());
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Em desenvolvimento, vamos logar onde ele tentou procurar
    console.error('Tried migrations at:', migrationsFolder);
  }
}

// Helper to remove undefined values before binding to SQLite
function cleanObject<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

// Helper types for DTOs
type InsertDto<T extends keyof typeof import('../schema/sqlite')> = Omit<typeof import('../schema/sqlite')[T]['$inferInsert'], 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'dirty'>;
type UpdateDto<T extends keyof typeof import('../schema/sqlite')> = Omit<typeof import('../schema/sqlite')[T]['$inferInsert'], 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'dirty'>;

// ─── Config helpers ───────────────────────────────────────────────────────────

function getConfig(key: string): string | null {
  const row = getDb().select({ value: config.value }).from(config).where(eq(config.key, key)).get();
  return row?.value ?? null;
}

function setConfig(key: string, value: string): void {
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
  const db = getDb();

  // ── Config ──
  ipcMain.handle('db:config:get', (_e, args: { key: string }) => getConfig(args.key));
  ipcMain.handle('db:config:set', (_e, args: { key: string; value: string }) => setConfig(args.key, args.value));
  ipcMain.handle('db:config:getAll', () => db.select().from(config).all());

  // ── Sync metadata ──
  ipcMain.handle('sync:getMetadata', (_e, args: { table: string }) => getSyncMetadata(args.table));
  ipcMain.handle('sync:setMetadata', (_e, args: { table: string; timestamp: string }) => setSyncMetadata(args.table, args.timestamp));

  ipcMain.handle('sync:status', () => {
    const countDirty = (t: any) => {
      const r = db.select({ n: sql<number>`count(*)` }).from(t).where(eq(t.dirty, 1)).get();
      return r?.n ?? 0;
    };
    return {
      lastSync: getConfig('last_sync_at'),
      pendingCount:
        countDirty(customers) +
        countDirty(vehicleModels) +
        countDirty(vehicles) +
        countDirty(rentals) +
        countDirty(contracts) +
        countDirty(maintenanceRecords) +
        countDirty(workshops) +
        countDirty(documents) +
        countDirty(vehicleStatuses),
    };
  });

  // ── Upsert batches (usados pelo sync) ──
  ipcMain.handle('db:customers:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('customers', ['id', 'user_id', 'name', 'phone', 'cpf', 'active_contract', 'balance_due', 'last_payment_date', 'created_at', 'updated_at', 'dirty'], args.rows.map(r => ({ ...r, dirty: 0 })));
  });
  ipcMain.handle('db:vehicleModels:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('vehicle_models', ['id', 'name', 'brand', 'image_url', 'status', 'created_at', 'updated_at', 'dirty'], args.rows.map(r => ({ ...r, dirty: 0 })));
  });
  ipcMain.handle('db:vehicles:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('vehicles', ['id', 'plate', 'model_id', 'year', 'status_id', 'mileage', 'current_renter_id', 'default_monthly_rate', 'created_at', 'updated_at', 'dirty'], args.rows.map(r => ({ ...r, dirty: 0 })));
  });
  ipcMain.handle('db:rentals:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('rentals', ['id', 'user_id', 'vehicle_id', 'customer_id', 'start_date', 'end_date', 'monthly_rate', 'status', 'created_at', 'updated_at', 'dirty'], args.rows.map(r => ({ ...r, dirty: 0 })));
  });
  ipcMain.handle('db:maintenance:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('maintenance_records', ['id', 'user_id', 'vehicle_id', 'workshop_id', 'vehicle_plate', 'entry_date', 'completion_date', 'mechanic_name', 'description', 'type', 'cost', 'status', 'created_at', 'updated_at', 'dirty'], args.rows.map(r => ({ ...r, dirty: 0 })));
  });
  ipcMain.handle('db:workshops:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('workshops', ['id', 'name', 'address', 'status', 'created_at', 'updated_at', 'dirty'], args.rows.map(r => ({ ...r, dirty: 0 })));
  });
  ipcMain.handle('db:contracts:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('contracts', ['id', 'rental_id', 'created_at', 'updated_at', 'dirty'], args.rows.map(r => ({ ...r, dirty: 0 })));
  });
  ipcMain.handle('db:documents:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('documents', ['id', 'parent_id', 'origin_type', 'file_url', 'created_at', 'updated_at', 'dirty'], args.rows.map(r => ({ ...r, dirty: 0 })));
  });
  ipcMain.handle('db:vehicleStatuses:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertBatchRaw('vehicle_statuses', ['id', 'name', 'color', 'is_default', 'created_at', 'updated_at', 'dirty'], args.rows.map(r => ({ ...r, dirty: 0 })));
  });

  // ── Customers CRUD ──
  ipcMain.handle('db:customers:getAll', (_e, args: { user_id: number }) => {
    return db.select().from(customers)
      .where(and(eq(customers.user_id, args.user_id), isNull(customers.deleted_at)))
      .orderBy(customers.name)
      .all();
  });

  ipcMain.handle('db:customers:getById', (_e, args: { id: number; user_id: number }) => {
    return db.select().from(customers)
      .where(and(eq(customers.id, args.id), eq(customers.user_id, args.user_id), isNull(customers.deleted_at)))
      .get() ?? null;
  });

  ipcMain.handle('db:customers:create', (_e, args: InsertDto<'customers'>) => {
    const now = new Date().toISOString();
    const result = db.insert(customers).values(cleanObject({
      ...args,
      created_at: now,
      updated_at: now,
      dirty: 1
    })).run();
    return db.select().from(customers).where(eq(customers.id, result.lastInsertRowid as number)).get();
  });

  ipcMain.handle('db:customers:update', (_e, args: UpdateDto<'customers'> & { id: number; user_id: number }) => {
    const { id, user_id, ...updates } = args;
    db.update(customers)
      .set(cleanObject({ ...updates, updated_at: new Date().toISOString(), dirty: 1 }))
      .where(and(eq(customers.id, id), eq(customers.user_id, user_id)))
      .run();
    return db.select().from(customers).where(eq(customers.id, id)).get();
  });

  ipcMain.handle('db:customers:delete', (_e, args: { id: number; user_id: number }) => {
    db.update(customers)
      .set({ deleted_at: new Date().toISOString(), dirty: 1 })
      .where(and(eq(customers.id, args.id), eq(customers.user_id, args.user_id)))
      .run();
  });

  // ── Vehicle Models CRUD ──
  ipcMain.handle('db:vehicleModels:getAll', () => {
    return db.select().from(vehicleModels).where(isNull(vehicleModels.deleted_at)).orderBy(vehicleModels.name).all();
  });

  ipcMain.handle('db:vehicleModels:getById', (_e, args: { id: number }) => {
    return db.select().from(vehicleModels).where(and(eq(vehicleModels.id, args.id), isNull(vehicleModels.deleted_at))).get() ?? null;
  });

  ipcMain.handle('db:vehicleModels:create', (_e, args: InsertDto<'vehicleModels'>) => {
    const now = new Date().toISOString();
    const result = db.insert(vehicleModels).values(cleanObject({
      ...args,
      created_at: now,
      updated_at: now,
      dirty: 1
    })).run();
    return db.select().from(vehicleModels).where(eq(vehicleModels.id, result.lastInsertRowid as number)).get();
  });

  ipcMain.handle('db:vehicleModels:update', (_e, args: UpdateDto<'vehicleModels'> & { id: number }) => {
    const { id, ...updates } = args;
    db.update(vehicleModels)
      .set(cleanObject({ ...updates, updated_at: new Date().toISOString(), dirty: 1 }))
      .where(eq(vehicleModels.id, id))
      .run();
    return db.select().from(vehicleModels).where(eq(vehicleModels.id, id)).get();
  });

  ipcMain.handle('db:vehicleModels:delete', (_e, args: { id: number }) => {
    db.update(vehicleModels).set({ deleted_at: new Date().toISOString(), dirty: 1 }).where(eq(vehicleModels.id, args.id)).run();
  });

  // ── Vehicles CRUD ──
  const vehicleWithRelations = (vehicleRow: typeof vehicles.$inferSelect) => {
    const model = vehicleRow.model_id
      ? db.select().from(vehicleModels).where(eq(vehicleModels.id, vehicleRow.model_id)).get() ?? null
      : null;
    const vehicleStatus = db.select().from(vehicleStatuses).where(eq(vehicleStatuses.id, vehicleRow.status_id)).get() ?? null;
    return { ...vehicleRow, model, vehicleStatus };
  };

  ipcMain.handle('db:vehicles:getAll', () => {
    const rows = db.select().from(vehicles).where(isNull(vehicles.deleted_at)).orderBy(desc(vehicles.created_at)).all();
    const allModels = db.select().from(vehicleModels).where(isNull(vehicleModels.deleted_at)).all();
    const allStatuses = db.select().from(vehicleStatuses).where(isNull(vehicleStatuses.deleted_at)).all();
    const modelMap = new Map(allModels.map(m => [m.id, m]));
    const statusMap = new Map(allStatuses.map(s => [s.id, s]));
    return rows.map(v => ({ ...v, model: modelMap.get(v.model_id!) ?? null, vehicleStatus: statusMap.get(v.status_id) ?? null }));
  });

  ipcMain.handle('db:vehicles:getById', (_e, args: { id: number }) => {
    const v = db.select().from(vehicles).where(and(eq(vehicles.id, args.id), isNull(vehicles.deleted_at))).get();
    if (!v) return null;
    return vehicleWithRelations(v);
  });

  ipcMain.handle('db:vehicles:create', (_e, args: InsertDto<'vehicles'>) => {
    const now = new Date().toISOString();
    const result = db.insert(vehicles).values(cleanObject({
      ...args,
      created_at: now,
      updated_at: now,
      dirty: 1
    })).run();
    const v = db.select().from(vehicles).where(eq(vehicles.id, result.lastInsertRowid as number)).get()!;
    return vehicleWithRelations(v);
  });

  ipcMain.handle('db:vehicles:update', (_e, args: UpdateDto<'vehicles'> & { id: number }) => {
    const { id, ...updates } = args;
    db.update(vehicles)
      .set(cleanObject({ ...updates, updated_at: new Date().toISOString(), dirty: 1 }))
      .where(eq(vehicles.id, id))
      .run();
    const v = db.select().from(vehicles).where(eq(vehicles.id, id)).get()!;
    return vehicleWithRelations(v);
  });

  ipcMain.handle('db:vehicles:delete', (_e, args: { id: number }) => {
    db.update(vehicles).set({ deleted_at: new Date().toISOString(), dirty: 1 }).where(eq(vehicles.id, args.id)).run();
  });

  // ── Rentals CRUD ──
  ipcMain.handle('db:rentals:getAll', (_e, args: { user_id: number }) => {
    return db.select().from(rentals)
      .where(and(eq(rentals.user_id, args.user_id), isNull(rentals.deleted_at)))
      .orderBy(desc(rentals.start_date))
      .all();
  });

  ipcMain.handle('db:rentals:getById', (_e, args: { id: number; user_id: number }) => {
    return db.select().from(rentals)
      .where(and(eq(rentals.id, args.id), eq(rentals.user_id, args.user_id), isNull(rentals.deleted_at)))
      .get() ?? null;
  });

  ipcMain.handle('db:rentals:create', (_e, args: InsertDto<'rentals'>) => {
    const now = new Date().toISOString();
    const result = db.insert(rentals).values(cleanObject({
      ...args,
      created_at: now,
      updated_at: now,
      dirty: 1
    })).run();
    return db.select().from(rentals).where(eq(rentals.id, result.lastInsertRowid as number)).get();
  });

  ipcMain.handle('db:rentals:update', (_e, args: UpdateDto<'rentals'> & { id: number; user_id: number }) => {
    const { id, user_id, ...updates } = args;
    db.update(rentals)
      .set(cleanObject({ ...updates, updated_at: new Date().toISOString(), dirty: 1 }))
      .where(and(eq(rentals.id, id), eq(rentals.user_id, user_id)))
      .run();
    return db.select().from(rentals).where(eq(rentals.id, id)).get();
  });

  ipcMain.handle('db:rentals:delete', (_e, args: { id: number; user_id: number }) => {
    db.update(rentals).set({ deleted_at: new Date().toISOString(), dirty: 1 })
      .where(and(eq(rentals.id, args.id), eq(rentals.user_id, args.user_id)))
      .run();
  });

  // ── Maintenance Records CRUD ──
  ipcMain.handle('db:maintenance:getAll', (_e, args: { user_id: number }) => {
    return db.select().from(maintenanceRecords)
      .where(and(eq(maintenanceRecords.user_id, args.user_id), isNull(maintenanceRecords.deleted_at)))
      .orderBy(desc(maintenanceRecords.entry_date))
      .all();
  });

  ipcMain.handle('db:maintenance:getById', (_e, args: { id: number; user_id: number }) => {
    return db.select().from(maintenanceRecords)
      .where(and(eq(maintenanceRecords.id, args.id), eq(maintenanceRecords.user_id, args.user_id), isNull(maintenanceRecords.deleted_at)))
      .get() ?? null;
  });

  ipcMain.handle('db:maintenance:create', (_e, args: InsertDto<'maintenanceRecords'>) => {
    const now = new Date().toISOString();
    const result = db.insert(maintenanceRecords).values(cleanObject({
      ...args,
      created_at: now,
      updated_at: now,
      dirty: 1
    })).run();
    return db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, result.lastInsertRowid as number)).get();
  });

  ipcMain.handle('db:maintenance:update', (_e, args: UpdateDto<'maintenanceRecords'> & { id: number; user_id: number }) => {
    const { id, user_id, ...updates } = args;
    db.update(maintenanceRecords)
      .set(cleanObject({ ...updates, updated_at: new Date().toISOString(), dirty: 1 }))
      .where(and(eq(maintenanceRecords.id, id), eq(maintenanceRecords.user_id, user_id)))
      .run();
    return db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, id)).get();
  });

  ipcMain.handle('db:maintenance:delete', (_e, args: { id: number; user_id: number }) => {
    db.update(maintenanceRecords).set({ deleted_at: new Date().toISOString(), dirty: 1 })
      .where(and(eq(maintenanceRecords.id, args.id), eq(maintenanceRecords.user_id, args.user_id)))
      .run();
  });

  // ── Workshops CRUD ──
  ipcMain.handle('db:workshops:getAll', () => {
    return db.select().from(workshops).where(isNull(workshops.deleted_at)).orderBy(workshops.name).all();
  });

  ipcMain.handle('db:workshops:getById', (_e, args: { id: number }) => {
    return db.select().from(workshops).where(and(eq(workshops.id, args.id), isNull(workshops.deleted_at))).get() ?? null;
  });

  ipcMain.handle('db:workshops:create', (_e, args: InsertDto<'workshops'>) => {
    const now = new Date().toISOString();
    const result = db.insert(workshops).values(cleanObject({
      ...args,
      created_at: now,
      updated_at: now,
      dirty: 1
    })).run();
    return db.select().from(workshops).where(eq(workshops.id, result.lastInsertRowid as number)).get();
  });

  ipcMain.handle('db:workshops:update', (_e, args: UpdateDto<'workshops'> & { id: number }) => {
    const { id, ...updates } = args;
    db.update(workshops)
      .set(cleanObject({ ...updates, updated_at: new Date().toISOString(), dirty: 1 }))
      .where(eq(workshops.id, id))
      .run();
    return db.select().from(workshops).where(eq(workshops.id, id)).get();
  });

  ipcMain.handle('db:workshops:delete', (_e, args: { id: number }) => {
    db.update(workshops).set({ deleted_at: new Date().toISOString(), dirty: 1 }).where(eq(workshops.id, args.id)).run();
  });

  // ── Vehicle Statuses CRUD ──
  ipcMain.handle('db:vehicleStatuses:getAll', () => {
    return db.select().from(vehicleStatuses).where(isNull(vehicleStatuses.deleted_at)).all();
  });

  ipcMain.handle('db:vehicleStatuses:getById', (_e, args: { id: number }) => {
    return db.select().from(vehicleStatuses).where(and(eq(vehicleStatuses.id, args.id), isNull(vehicleStatuses.deleted_at))).get() ?? null;
  });

  ipcMain.handle('db:vehicleStatuses:create', (_e, args: InsertDto<'vehicleStatuses'>) => {
    const now = new Date().toISOString();
    const result = db.insert(vehicleStatuses).values(cleanObject({
      ...args,
      created_at: now,
      updated_at: now,
      dirty: 1
    })).run();
    return db.select().from(vehicleStatuses).where(eq(vehicleStatuses.id, result.lastInsertRowid as number)).get();
  });

  ipcMain.handle('db:vehicleStatuses:update', (_e, args: UpdateDto<'vehicleStatuses'> & { id: number }) => {
    const { id, ...updates } = args;
    db.update(vehicleStatuses)
      .set(cleanObject({ ...updates, updated_at: new Date().toISOString(), dirty: 1 }))
      .where(eq(vehicleStatuses.id, id))
      .run();
    return db.select().from(vehicleStatuses).where(eq(vehicleStatuses.id, id)).get();
  });

  ipcMain.handle('db:vehicleStatuses:delete', (_e, args: { id: number }) => {
    db.update(vehicleStatuses).set({ deleted_at: new Date().toISOString(), dirty: 1 }).where(eq(vehicleStatuses.id, args.id)).run();
  });

  // ── Contracts CRUD ──
  ipcMain.handle('db:contracts:getAll', () => {
    return db.select().from(contracts).where(isNull(contracts.deleted_at)).orderBy(desc(contracts.created_at)).all();
  });

  ipcMain.handle('db:contracts:getById', (_e, args: { id: number }) => {
    return db.select().from(contracts).where(and(eq(contracts.id, args.id), isNull(contracts.deleted_at))).get() ?? null;
  });

  ipcMain.handle('db:contracts:getByRental', (_e, args: { rental_id: number }) => {
    return db.select().from(contracts).where(and(eq(contracts.rental_id, args.rental_id), isNull(contracts.deleted_at))).get() ?? null;
  });

  ipcMain.handle('db:contracts:create', (_e, args: InsertDto<'contracts'>) => {
    const now = new Date().toISOString();
    const result = db.insert(contracts).values({
      ...args,
      created_at: now,
      updated_at: now,
      dirty: 1
    }).run();
    return db.select().from(contracts).where(eq(contracts.id, result.lastInsertRowid as number)).get();
  });

  ipcMain.handle('db:contracts:delete', (_e, args: { id: number }) => {
    db.update(contracts).set({ deleted_at: new Date().toISOString(), dirty: 1 }).where(eq(contracts.id, args.id)).run();
  });

  // ── Documents CRUD ──
  ipcMain.handle('db:documents:getAll', () => {
    return db.select().from(documents).where(isNull(documents.deleted_at)).orderBy(desc(documents.created_at)).all();
  });

  ipcMain.handle('db:documents:getByParent', (_e, args: { parent_id: number; origin_type: string }) => {
    return db.select().from(documents)
      .where(and(eq(documents.parent_id, args.parent_id), eq(documents.origin_type, args.origin_type), isNull(documents.deleted_at)))
      .orderBy(desc(documents.created_at))
      .all();
  });

  ipcMain.handle('db:documents:create', (_e, args: InsertDto<'documents'>) => {
    const now = new Date().toISOString();
    const result = db.insert(documents).values(cleanObject({
      ...args,
      created_at: now,
      updated_at: now,
      dirty: 1
    })).run();
    return db.select().from(documents).where(eq(documents.id, result.lastInsertRowid as number)).get();
  });

  ipcMain.handle('db:documents:delete', (_e, args: { id: number }) => {
    db.update(documents).set({ deleted_at: new Date().toISOString(), dirty: 1 }).where(eq(documents.id, args.id)).run();
  });

  // ── Roles CRUD ──
  ipcMain.handle('db:roles:getAll', () => {
    return db.select().from(roles).where(isNull(roles.deleted_at)).orderBy(roles.name).all()
      .map(r => ({ ...r, permissions: JSON.parse(r.permissions) }));
  });

  ipcMain.handle('db:roles:getById', (_e, args: { id: number }) => {
    const r = db.select().from(roles).where(and(eq(roles.id, args.id), isNull(roles.deleted_at))).get();
    if (!r) return null;
    return { ...r, permissions: JSON.parse(r.permissions) };
  });

  ipcMain.handle('db:roles:create', (_e, args: InsertDto<'roles'> & { permissions: string[] }) => {
    const now = new Date().toISOString();
    const { permissions, ...rest } = args;
    const result = db.insert(roles).values(cleanObject({
      ...rest,
      permissions: JSON.stringify(permissions),
      created_at: now,
      updated_at: now,
    })).run();
    const r = db.select().from(roles).where(eq(roles.id, result.lastInsertRowid as number)).get()!;
    return { ...r, permissions: JSON.parse(r.permissions) };
  });

  ipcMain.handle('db:roles:update', (_e, args: UpdateDto<'roles'> & { id: number; permissions: string[] }) => {
    const now = new Date().toISOString();
    const { id, permissions, ...updates } = args;
    db.update(roles).set(cleanObject({
      ...updates,
      permissions: JSON.stringify(permissions),
      updated_at: now,
    })).where(eq(roles.id, id)).run();
    const r = db.select().from(roles).where(eq(roles.id, id)).get()!;
    return { ...r, permissions: JSON.parse(r.permissions) };
  });

  ipcMain.handle('db:roles:delete', (_e, args: { id: number }) => {
    db.update(roles).set({ deleted_at: new Date().toISOString() }).where(eq(roles.id, args.id)).run();
  });

  // ── Users CRUD ──
  ipcMain.handle('db:users:getAll', () => {
    const users = db.select().from(appUsers).where(isNull(appUsers.deleted_at)).orderBy(appUsers.name).all();
    const allRoles = db.select().from(roles).all();
    const roleMap = new Map(allRoles.map(r => [r.id, r]));
    return users.map(u => {
      const role = roleMap.get(u.role_id);
      return { ...u, role: role ? { ...role, permissions: JSON.parse(role.permissions) } : undefined };
    });
  });

  ipcMain.handle('db:users:getById', (_e, args: { id: number }) => {
    const u = db.select().from(appUsers).where(and(eq(appUsers.id, args.id), isNull(appUsers.deleted_at))).get();
    if (!u) return null;
    const role = db.select().from(roles).where(eq(roles.id, u.role_id)).get();
    return { ...u, role: role ? { ...role, permissions: JSON.parse(role.permissions) } : undefined };
  });

  ipcMain.handle('db:users:create', (_e, args: InsertDto<'appUsers'>) => {
    const now = new Date().toISOString();
    const result = db.insert(appUsers).values(cleanObject({
      ...args,
      created_at: now,
      updated_at: now,
    })).run();
    return db.select().from(appUsers).where(eq(appUsers.id, result.lastInsertRowid as number)).get();
  });

  ipcMain.handle('db:users:update', (_e, args: UpdateDto<'appUsers'> & { id: number }) => {
    const { id, ...updates } = args;
    db.update(appUsers).set(cleanObject({ ...updates, updated_at: new Date().toISOString() })).where(eq(appUsers.id, id)).run();
    return db.select().from(appUsers).where(eq(appUsers.id, id)).get();
  });

  ipcMain.handle('db:users:delete', (_e, args: { id: number }) => {
    db.update(appUsers).set({ deleted_at: new Date().toISOString() }).where(eq(appUsers.id, args.id)).run();
  });

  ipcMain.handle('db:users:login', (_e, args: { email: string; password?: string }) => {
    let user = args.password
      ? db.select().from(appUsers).where(and(eq(appUsers.email, args.email), eq(appUsers.password, args.password), isNull(appUsers.deleted_at))).get()
      : db.select().from(appUsers).where(and(eq(appUsers.email, args.email), isNull(appUsers.deleted_at))).get();

    if (!user) return null;

    const role = db.select().from(roles).where(eq(roles.id, user.role_id)).get();
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      role: role ? { id: role.id, name: role.name, permissions: JSON.parse(role.permissions) } : undefined,
    };
  });

  // ── App info ──
  ipcMain.handle('app:isElectron', () => true);
  ipcMain.handle('app:getVersion', () => app.getVersion());
}
