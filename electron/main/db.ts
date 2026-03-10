import { app, ipcMain } from 'electron';
import path from 'path';
import { randomUUID } from 'crypto';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { initDb, getDb, getRawDb } from '../../db/index';
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
} from '../../db/schema';

// ─── Initialization ───────────────────────────────────────────────────────────

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'gc-loca-moto.sqlite');
  // Em desenvolvimento: migrations estão em db/migrations/sqlite (raiz do projeto)
  // Em produção (electron-builder): empacotadas junto com o app
  const migrationsFolder = app.isPackaged
    ? path.join(process.resourcesPath, 'db/migrations/sqlite')
    : path.join(app.getAppPath(), 'db/migrations/sqlite');

  initDb(dbPath, migrationsFolder);
  seedData();
}

function seedData(): void {
  const db = getDb();
  const now = new Date().toISOString();

  // Status de veículos padrão
  const statusCount = db.select({ n: sql<number>`count(*)` }).from(vehicleStatuses).get();
  if ((statusCount?.n ?? 0) === 0) {
    db.insert(vehicleStatuses).values([
      { id: 'vs_available',    name: 'Disponível',      color: '#22c55e', isDefault: 1, createdAt: now, updatedAt: now, dirty: 0 },
      { id: 'vs_rented',      name: 'Alugada',          color: '#3b82f6', isDefault: 1, createdAt: now, updatedAt: now, dirty: 0 },
      { id: 'vs_maintenance', name: 'Em Manutenção',    color: '#f59e0b', isDefault: 1, createdAt: now, updatedAt: now, dirty: 0 },
      { id: 'vs_unavailable', name: 'Indisponível',     color: '#ef4444', isDefault: 1, createdAt: now, updatedAt: now, dirty: 0 },
    ]).onConflictDoNothing().run();
  }

  // Roles e usuários padrão
  const rolesCount = db.select({ n: sql<number>`count(*)` }).from(roles).get();
  if ((rolesCount?.n ?? 0) === 0) {
    db.insert(roles).values([
      { id: 'role_admin',    workshopId: null, name: 'Gerente',     permissions: JSON.stringify(['*']),                                                      createdAt: now, updatedAt: now },
      { id: 'role_mechanic', workshopId: null, name: 'Oficina',     permissions: JSON.stringify(['veiculos_view', 'oficina_view', 'oficina_edit']),           createdAt: now, updatedAt: now },
      { id: 'role_billing',  workshopId: null, name: 'Financeiro',  permissions: JSON.stringify(['financeiro_view', 'financeiro_edit']),                      createdAt: now, updatedAt: now },
    ]).onConflictDoNothing().run();

    db.insert(appUsers).values([
      { id: '1', name: 'Gestor Master',    email: 'admin@gclocamoto.com.br',      password: 'admin123',    roleId: 'role_admin',    createdAt: now, updatedAt: now },
      { id: '2', name: 'Roberto Mecânico', email: 'oficina@gclocamoto.com.br',    password: 'oficina123',  roleId: 'role_mechanic', createdAt: now, updatedAt: now },
      { id: '3', name: 'Clara Financeiro', email: 'financeiro@gclocamoto.com.br', password: 'financas123', roleId: 'role_billing',  createdAt: now, updatedAt: now },
    ]).onConflictDoNothing().run();
  }
}

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
  const row = getDb().select({ lastSyncAt: syncMetadata.lastSyncAt }).from(syncMetadata).where(eq(syncMetadata.tableName, tableName)).get();
  return row?.lastSyncAt ?? null;
}

function setSyncMetadata(tableName: string, timestamp: string): void {
  getDb().insert(syncMetadata).values({ tableName, lastSyncAt: timestamp }).onConflictDoUpdate({ target: syncMetadata.tableName, set: { lastSyncAt: timestamp } }).run();
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
    const countDirty = (t: typeof customers | typeof vehicleModels | typeof vehicles | typeof rentals | typeof contracts | typeof maintenanceRecords | typeof workshops | typeof documents | typeof vehicleStatuses) => {
      const r = db.select({ n: sql<number>`count(*)` }).from(t).where(eq((t as any).dirty, 1)).get();
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
  ipcMain.handle('db:customers:getAll', (_e, args: { userId: string }) => {
    return db.select().from(customers)
      .where(and(eq(customers.userId, args.userId), isNull(customers.deletedAt)))
      .orderBy(customers.name)
      .all();
  });

  ipcMain.handle('db:customers:getById', (_e, args: { id: string; userId: string }) => {
    return db.select().from(customers)
      .where(and(eq(customers.id, args.id), eq(customers.userId, args.userId), isNull(customers.deletedAt)))
      .get() ?? null;
  });

  ipcMain.handle('db:customers:create', (_e, args: Record<string, unknown> & { userId: string }) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.insert(customers).values({
      id,
      userId: args.userId,
      name: args.name as string,
      phone: (args.phone as string) ?? null,
      cpf: (args.cpf as string) ?? null,
      activeContract: args.active_contract ? 1 : 0,
      balanceDue: (args.balance_due as number) ?? 0,
      lastPaymentDate: (args.last_payment_date as string) ?? null,
      createdAt: now,
      updatedAt: now,
    }).run();
    return db.select().from(customers).where(eq(customers.id, id)).get();
  });

  ipcMain.handle('db:customers:update', (_e, args: Record<string, unknown> & { id: string; userId: string }) => {
    const now = new Date().toISOString();
    const set: Partial<typeof customers.$inferInsert> = { updatedAt: now, dirty: 1 };
    if ('name' in args)              set.name = args.name as string;
    if ('phone' in args)             set.phone = args.phone as string;
    if ('cpf' in args)               set.cpf = args.cpf as string;
    if ('active_contract' in args)   set.activeContract = args.active_contract ? 1 : 0;
    if ('balance_due' in args)       set.balanceDue = args.balance_due as number;
    if ('last_payment_date' in args) set.lastPaymentDate = args.last_payment_date as string;

    db.update(customers).set(set)
      .where(and(eq(customers.id, args.id), eq(customers.userId, args.userId)))
      .run();
    return db.select().from(customers).where(eq(customers.id, args.id)).get();
  });

  ipcMain.handle('db:customers:delete', (_e, args: { id: string; userId: string }) => {
    db.update(customers).set({ deletedAt: new Date().toISOString(), dirty: 1 })
      .where(and(eq(customers.id, args.id), eq(customers.userId, args.userId)))
      .run();
  });

  // ── Vehicle Models CRUD ──
  ipcMain.handle('db:vehicleModels:getAll', () => {
    return db.select().from(vehicleModels).where(isNull(vehicleModels.deletedAt)).orderBy(vehicleModels.name).all();
  });

  ipcMain.handle('db:vehicleModels:getById', (_e, args: { id: string }) => {
    return db.select().from(vehicleModels).where(and(eq(vehicleModels.id, args.id), isNull(vehicleModels.deletedAt))).get() ?? null;
  });

  ipcMain.handle('db:vehicleModels:create', (_e, args: Record<string, unknown>) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.insert(vehicleModels).values({
      id,
      name: args.name as string,
      brand: args.brand as string,
      imageUrl: (args.image_url as string) ?? null,
      status: (args.status as string) ?? 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    }).run();
    return db.select().from(vehicleModels).where(eq(vehicleModels.id, id)).get();
  });

  ipcMain.handle('db:vehicleModels:update', (_e, args: Record<string, unknown> & { id: string }) => {
    const now = new Date().toISOString();
    const set: Partial<typeof vehicleModels.$inferInsert> = { updatedAt: now, dirty: 1 };
    if ('name' in args)      set.name = args.name as string;
    if ('brand' in args)     set.brand = args.brand as string;
    if ('image_url' in args) set.imageUrl = args.image_url as string;
    if ('status' in args)    set.status = args.status as string;

    db.update(vehicleModels).set(set).where(eq(vehicleModels.id, args.id)).run();
    return db.select().from(vehicleModels).where(eq(vehicleModels.id, args.id)).get();
  });

  ipcMain.handle('db:vehicleModels:delete', (_e, args: { id: string }) => {
    db.update(vehicleModels).set({ deletedAt: new Date().toISOString(), dirty: 1 }).where(eq(vehicleModels.id, args.id)).run();
  });

  // ── Vehicles CRUD (inclui join com model e status) ──
  const vehicleWithRelations = (vehicleRow: typeof vehicles.$inferSelect) => {
    const model = vehicleRow.modelId
      ? db.select().from(vehicleModels).where(eq(vehicleModels.id, vehicleRow.modelId)).get() ?? null
      : null;
    const vehicleStatus = db.select().from(vehicleStatuses).where(eq(vehicleStatuses.id, vehicleRow.statusId)).get() ?? null;
    return { ...vehicleRow, model, vehicleStatus };
  };

  ipcMain.handle('db:vehicles:getAll', () => {
    const rows = db.select().from(vehicles).where(isNull(vehicles.deletedAt)).orderBy(desc(vehicles.createdAt)).all();
    const allModels = db.select().from(vehicleModels).where(isNull(vehicleModels.deletedAt)).all();
    const allStatuses = db.select().from(vehicleStatuses).where(isNull(vehicleStatuses.deletedAt)).all();
    const modelMap = new Map(allModels.map(m => [m.id, m]));
    const statusMap = new Map(allStatuses.map(s => [s.id, s]));
    return rows.map(v => ({ ...v, model: modelMap.get(v.modelId ?? '') ?? null, vehicleStatus: statusMap.get(v.statusId) ?? null }));
  });

  ipcMain.handle('db:vehicles:getById', (_e, args: { id: string }) => {
    const v = db.select().from(vehicles).where(and(eq(vehicles.id, args.id), isNull(vehicles.deletedAt))).get();
    if (!v) return null;
    return vehicleWithRelations(v);
  });

  ipcMain.handle('db:vehicles:create', (_e, args: Record<string, unknown>) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.insert(vehicles).values({
      id,
      plate: args.plate as string,
      modelId: (args.model_id as string) ?? null,
      year: args.year as number,
      statusId: args.status_id as string,
      mileage: (args.mileage as number) ?? 0,
      currentRenterId: (args.current_renter_id as string) ?? null,
      defaultMonthlyRate: (args.default_monthly_rate as number) ?? 0,
      createdAt: now,
      updatedAt: now,
    }).run();
    const v = db.select().from(vehicles).where(eq(vehicles.id, id)).get()!;
    return vehicleWithRelations(v);
  });

  ipcMain.handle('db:vehicles:update', (_e, args: Record<string, unknown> & { id: string }) => {
    const now = new Date().toISOString();
    const set: Partial<typeof vehicles.$inferInsert> = { updatedAt: now, dirty: 1 };
    if ('plate' in args)                set.plate = args.plate as string;
    if ('model_id' in args)             set.modelId = args.model_id as string;
    if ('year' in args)                 set.year = args.year as number;
    if ('status_id' in args)            set.statusId = args.status_id as string;
    if ('mileage' in args)              set.mileage = args.mileage as number;
    if ('current_renter_id' in args)    set.currentRenterId = args.current_renter_id as string;
    if ('default_monthly_rate' in args) set.defaultMonthlyRate = args.default_monthly_rate as number;

    db.update(vehicles).set(set).where(eq(vehicles.id, args.id)).run();
    const v = db.select().from(vehicles).where(eq(vehicles.id, args.id)).get()!;
    return vehicleWithRelations(v);
  });

  ipcMain.handle('db:vehicles:delete', (_e, args: { id: string }) => {
    db.update(vehicles).set({ deletedAt: new Date().toISOString(), dirty: 1 }).where(eq(vehicles.id, args.id)).run();
  });

  // ── Rentals CRUD ──
  ipcMain.handle('db:rentals:getAll', (_e, args: { userId: string }) => {
    return db.select().from(rentals)
      .where(and(eq(rentals.userId, args.userId), isNull(rentals.deletedAt)))
      .orderBy(desc(rentals.startDate))
      .all();
  });

  ipcMain.handle('db:rentals:getById', (_e, args: { id: string; userId: string }) => {
    return db.select().from(rentals)
      .where(and(eq(rentals.id, args.id), eq(rentals.userId, args.userId), isNull(rentals.deletedAt)))
      .get() ?? null;
  });

  ipcMain.handle('db:rentals:create', (_e, args: Record<string, unknown> & { userId: string }) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.insert(rentals).values({
      id,
      userId: args.userId,
      vehicleId: args.vehicle_id as string,
      customerId: args.customer_id as string,
      startDate: args.start_date as string,
      endDate: (args.end_date as string) ?? null,
      monthlyRate: args.monthly_rate as number,
      status: (args.status as string) ?? 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    }).run();
    return db.select().from(rentals).where(eq(rentals.id, id)).get();
  });

  ipcMain.handle('db:rentals:update', (_e, args: Record<string, unknown> & { id: string; userId: string }) => {
    const now = new Date().toISOString();
    const set: Partial<typeof rentals.$inferInsert> = { updatedAt: now, dirty: 1 };
    if ('vehicle_id' in args)   set.vehicleId = args.vehicle_id as string;
    if ('customer_id' in args)  set.customerId = args.customer_id as string;
    if ('start_date' in args)   set.startDate = args.start_date as string;
    if ('end_date' in args)     set.endDate = args.end_date as string;
    if ('monthly_rate' in args) set.monthlyRate = args.monthly_rate as number;
    if ('status' in args)       set.status = args.status as string;

    db.update(rentals).set(set).where(and(eq(rentals.id, args.id), eq(rentals.userId, args.userId))).run();
    return db.select().from(rentals).where(eq(rentals.id, args.id)).get();
  });

  ipcMain.handle('db:rentals:delete', (_e, args: { id: string; userId: string }) => {
    db.update(rentals).set({ deletedAt: new Date().toISOString(), dirty: 1 })
      .where(and(eq(rentals.id, args.id), eq(rentals.userId, args.userId)))
      .run();
  });

  // ── Maintenance Records CRUD ──
  ipcMain.handle('db:maintenance:getAll', (_e, args: { userId: string }) => {
    return db.select().from(maintenanceRecords)
      .where(and(eq(maintenanceRecords.userId, args.userId), isNull(maintenanceRecords.deletedAt)))
      .orderBy(desc(maintenanceRecords.entryDate))
      .all();
  });

  ipcMain.handle('db:maintenance:getById', (_e, args: { id: string; userId: string }) => {
    return db.select().from(maintenanceRecords)
      .where(and(eq(maintenanceRecords.id, args.id), eq(maintenanceRecords.userId, args.userId), isNull(maintenanceRecords.deletedAt)))
      .get() ?? null;
  });

  ipcMain.handle('db:maintenance:create', (_e, args: Record<string, unknown> & { userId: string }) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.insert(maintenanceRecords).values({
      id,
      userId: args.userId,
      vehicleId: args.vehicle_id as string,
      workshopId: (args.workshop_id as string) ?? null,
      vehiclePlate: args.vehicle_plate as string,
      entryDate: args.entry_date as string,
      completionDate: (args.completion_date as string) ?? null,
      mechanicName: args.mechanic_name as string,
      description: args.description as string,
      type: args.type as string,
      cost: (args.cost as number) ?? 0,
      status: (args.status as string) ?? 'OPEN',
      createdAt: now,
      updatedAt: now,
    }).run();
    return db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, id)).get();
  });

  ipcMain.handle('db:maintenance:update', (_e, args: Record<string, unknown> & { id: string; userId: string }) => {
    const now = new Date().toISOString();
    const set: Partial<typeof maintenanceRecords.$inferInsert> = { updatedAt: now, dirty: 1 };
    if ('vehicle_id' in args)      set.vehicleId = args.vehicle_id as string;
    if ('workshop_id' in args)     set.workshopId = args.workshop_id as string;
    if ('vehicle_plate' in args)   set.vehiclePlate = args.vehicle_plate as string;
    if ('entry_date' in args)      set.entryDate = args.entry_date as string;
    if ('completion_date' in args) set.completionDate = args.completion_date as string;
    if ('mechanic_name' in args)   set.mechanicName = args.mechanic_name as string;
    if ('description' in args)     set.description = args.description as string;
    if ('type' in args)            set.type = args.type as string;
    if ('cost' in args)            set.cost = args.cost as number;
    if ('status' in args)          set.status = args.status as string;

    db.update(maintenanceRecords).set(set)
      .where(and(eq(maintenanceRecords.id, args.id), eq(maintenanceRecords.userId, args.userId)))
      .run();
    return db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, args.id)).get();
  });

  ipcMain.handle('db:maintenance:delete', (_e, args: { id: string; userId: string }) => {
    db.update(maintenanceRecords).set({ deletedAt: new Date().toISOString(), dirty: 1 })
      .where(and(eq(maintenanceRecords.id, args.id), eq(maintenanceRecords.userId, args.userId)))
      .run();
  });

  // ── App info ──
  ipcMain.handle('app:isElectron', () => true);
  ipcMain.handle('app:getVersion', () => app.getVersion());

  // ── Workshops CRUD ──
  ipcMain.handle('db:workshops:getAll', () => {
    return db.select().from(workshops).where(isNull(workshops.deletedAt)).orderBy(workshops.name).all();
  });

  ipcMain.handle('db:workshops:getById', (_e, args: { id: string }) => {
    return db.select().from(workshops).where(and(eq(workshops.id, args.id), isNull(workshops.deletedAt))).get() ?? null;
  });

  ipcMain.handle('db:workshops:create', (_e, args: Record<string, unknown>) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.insert(workshops).values({
      id,
      name: args.name as string,
      address: (args.address as string) ?? null,
      status: (args.status as string) ?? 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    }).run();
    return db.select().from(workshops).where(eq(workshops.id, id)).get();
  });

  ipcMain.handle('db:workshops:update', (_e, args: Record<string, unknown> & { id: string }) => {
    const now = new Date().toISOString();
    const set: Partial<typeof workshops.$inferInsert> = { updatedAt: now, dirty: 1 };
    if ('name' in args)    set.name = args.name as string;
    if ('address' in args) set.address = args.address as string;
    if ('status' in args)  set.status = args.status as string;

    db.update(workshops).set(set).where(eq(workshops.id, args.id)).run();
    return db.select().from(workshops).where(eq(workshops.id, args.id)).get();
  });

  ipcMain.handle('db:workshops:delete', (_e, args: { id: string }) => {
    db.update(workshops).set({ deletedAt: new Date().toISOString(), dirty: 1 }).where(eq(workshops.id, args.id)).run();
  });

  // ── Vehicle Statuses CRUD ──
  ipcMain.handle('db:vehicleStatuses:getAll', () => {
    return db.select().from(vehicleStatuses).where(isNull(vehicleStatuses.deletedAt)).orderBy(vehicleStatuses.name).all();
  });

  ipcMain.handle('db:vehicleStatuses:getById', (_e, args: { id: string }) => {
    return db.select().from(vehicleStatuses).where(and(eq(vehicleStatuses.id, args.id), isNull(vehicleStatuses.deletedAt))).get() ?? null;
  });

  ipcMain.handle('db:vehicleStatuses:create', (_e, args: Record<string, unknown>) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.insert(vehicleStatuses).values({
      id,
      name: args.name as string,
      color: (args.color as string) ?? '#6b7280',
      isDefault: args.is_default ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    }).run();
    return db.select().from(vehicleStatuses).where(eq(vehicleStatuses.id, id)).get();
  });

  ipcMain.handle('db:vehicleStatuses:update', (_e, args: Record<string, unknown> & { id: string }) => {
    const now = new Date().toISOString();
    const set: Partial<typeof vehicleStatuses.$inferInsert> = { updatedAt: now, dirty: 1 };
    if ('name' in args)       set.name = args.name as string;
    if ('color' in args)      set.color = args.color as string;
    if ('is_default' in args) set.isDefault = args.is_default ? 1 : 0;

    db.update(vehicleStatuses).set(set).where(eq(vehicleStatuses.id, args.id)).run();
    return db.select().from(vehicleStatuses).where(eq(vehicleStatuses.id, args.id)).get();
  });

  ipcMain.handle('db:vehicleStatuses:delete', (_e, args: { id: string }) => {
    db.update(vehicleStatuses).set({ deletedAt: new Date().toISOString(), dirty: 1 }).where(eq(vehicleStatuses.id, args.id)).run();
  });

  // ── Contracts CRUD ──
  ipcMain.handle('db:contracts:getAll', () => {
    return db.select().from(contracts).where(isNull(contracts.deletedAt)).orderBy(desc(contracts.createdAt)).all();
  });

  ipcMain.handle('db:contracts:getById', (_e, args: { id: string }) => {
    return db.select().from(contracts).where(and(eq(contracts.id, args.id), isNull(contracts.deletedAt))).get() ?? null;
  });

  ipcMain.handle('db:contracts:getByRental', (_e, args: { rentalId: string }) => {
    return db.select().from(contracts).where(and(eq(contracts.rentalId, args.rentalId), isNull(contracts.deletedAt))).get() ?? null;
  });

  ipcMain.handle('db:contracts:create', (_e, args: Record<string, unknown>) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.insert(contracts).values({ id, rentalId: args.rental_id as string, createdAt: now, updatedAt: now }).run();
    return db.select().from(contracts).where(eq(contracts.id, id)).get();
  });

  ipcMain.handle('db:contracts:update', (_e, args: Record<string, unknown> & { id: string }) => {
    const now = new Date().toISOString();
    const set: Partial<typeof contracts.$inferInsert> = { updatedAt: now, dirty: 1 };
    if ('rental_id' in args) set.rentalId = args.rental_id as string;

    db.update(contracts).set(set).where(eq(contracts.id, args.id)).run();
    return db.select().from(contracts).where(eq(contracts.id, args.id)).get();
  });

  ipcMain.handle('db:contracts:delete', (_e, args: { id: string }) => {
    db.update(contracts).set({ deletedAt: new Date().toISOString(), dirty: 1 }).where(eq(contracts.id, args.id)).run();
  });

  // ── Documents CRUD ──
  ipcMain.handle('db:documents:getAll', () => {
    return db.select().from(documents).where(isNull(documents.deletedAt)).orderBy(desc(documents.createdAt)).all();
  });

  ipcMain.handle('db:documents:getByParent', (_e, args: { parentId: string; originType: string }) => {
    return db.select().from(documents)
      .where(and(eq(documents.parentId, args.parentId), eq(documents.originType, args.originType), isNull(documents.deletedAt)))
      .orderBy(desc(documents.createdAt))
      .all();
  });

  ipcMain.handle('db:documents:create', (_e, args: Record<string, unknown>) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.insert(documents).values({
      id,
      parentId: args.parent_id as string,
      originType: args.origin_type as string,
      fileUrl: args.file_url as string,
      createdAt: now,
      updatedAt: now,
    }).run();
    return db.select().from(documents).where(eq(documents.id, id)).get();
  });

  ipcMain.handle('db:documents:delete', (_e, args: { id: string }) => {
    db.update(documents).set({ deletedAt: new Date().toISOString(), dirty: 1 }).where(eq(documents.id, args.id)).run();
  });

  // ── Roles CRUD ──
  ipcMain.handle('db:roles:getAll', () => {
    return db.select().from(roles).where(isNull(roles.deletedAt)).orderBy(roles.name).all()
      .map(r => ({ ...r, permissions: JSON.parse(r.permissions) }));
  });

  ipcMain.handle('db:roles:create', (_e, args: Record<string, unknown>) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    db.insert(roles).values({
      id,
      workshopId: (args.workshop_id as string) ?? null,
      name: args.name as string,
      permissions: JSON.stringify(args.permissions),
      createdAt: now,
      updatedAt: now,
    }).run();
    const r = db.select().from(roles).where(eq(roles.id, id)).get()!;
    return { ...r, permissions: JSON.parse(r.permissions) };
  });

  ipcMain.handle('db:roles:update', (_e, args: Record<string, unknown> & { id: string }) => {
    const now = new Date().toISOString();
    db.update(roles).set({
      workshopId: (args.workshop_id as string) ?? null,
      name: args.name as string,
      permissions: JSON.stringify(args.permissions),
      updatedAt: now,
    }).where(eq(roles.id, args.id)).run();
    const r = db.select().from(roles).where(eq(roles.id, args.id)).get()!;
    return { ...r, permissions: JSON.parse(r.permissions) };
  });

  ipcMain.handle('db:roles:delete', (_e, args: { id: string }) => {
    db.update(roles).set({ deletedAt: new Date().toISOString() }).where(eq(roles.id, args.id)).run();
  });

  // ── Users CRUD ──
  ipcMain.handle('db:users:getAll', () => {
    const users = db.select().from(appUsers).where(isNull(appUsers.deletedAt)).orderBy(appUsers.name).all();
    const allRoles = db.select().from(roles).all();
    const roleMap = new Map(allRoles.map(r => [r.id, r]));
    return users.map(u => {
      const role = roleMap.get(u.roleId);
      return { ...u, role: role ? { ...role, permissions: JSON.parse(role.permissions) } : undefined };
    });
  });

  ipcMain.handle('db:users:create', (_e, args: Record<string, unknown>) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    db.insert(appUsers).values({
      id,
      name: args.name as string,
      email: args.email as string,
      password: args.password as string,
      roleId: args.role_id as string,
      createdAt: now,
      updatedAt: now,
    }).run();
    return db.select().from(appUsers).where(eq(appUsers.id, id)).get();
  });

  ipcMain.handle('db:users:update', (_e, args: Record<string, unknown> & { id: string }) => {
    const now = new Date().toISOString();
    const set: Partial<typeof appUsers.$inferInsert> = { updatedAt: now };
    if ('name' in args)     set.name = args.name as string;
    if ('email' in args)    set.email = args.email as string;
    if ('password' in args) set.password = args.password as string;
    if ('role_id' in args)  set.roleId = args.role_id as string;

    db.update(appUsers).set(set).where(eq(appUsers.id, args.id)).run();
  });

  ipcMain.handle('db:users:delete', (_e, args: { id: string }) => {
    db.update(appUsers).set({ deletedAt: new Date().toISOString() }).where(eq(appUsers.id, args.id)).run();
  });

  ipcMain.handle('db:users:login', (_e, args: { email: string; password?: string }) => {
    let user = args.password
      ? db.select().from(appUsers).where(and(eq(appUsers.email, args.email), eq(appUsers.password, args.password), isNull(appUsers.deletedAt))).get()
      : db.select().from(appUsers).where(and(eq(appUsers.email, args.email), isNull(appUsers.deletedAt))).get();

    if (!user) return null;

    const role = db.select().from(roles).where(eq(roles.id, user.roleId)).get();
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role_id: user.roleId,
      role: role ? { id: role.id, name: role.name, permissions: JSON.parse(role.permissions) } : undefined,
    };
  });
}
