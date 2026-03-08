import { app, ipcMain } from 'electron';
import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';

export let db: Database.Database;

// ─── Initialization ──────────────────────────────────────────────────────────

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'gc-loca-moto.sqlite');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  createTables();
  runMigrations();
}

function runMigrations(): void {
  // Array of tables to ensure deleted_at exists for existing SQLite database files
  const tables = ['customers', 'vehicles', 'rental_contracts', 'maintenance_records', 'vehicle_models'];

  for (const table of tables) {
    try {
      const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
      const hasDeletedAt = columns.some(col => col.name === 'deleted_at');
      const hasUserId = columns.some(col => col.name === 'user_id');

      if (!hasDeletedAt) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN deleted_at TEXT`);
        console.log(`[Database] Migration: Added deleted_at column to ${table}`);
      }

      if (!hasUserId && table !== 'vehicle_models') { // vehicle_models is new, user_id is in CREATE
        db.exec(`ALTER TABLE ${table} ADD COLUMN user_id TEXT DEFAULT '1'`);
        console.log(`[Database] Migration: Added user_id column to ${table}`);
      }
    } catch (err) {
      console.error(`[Database] Migration error on ${table}:`, err);
    }
  }

  try {
    const vColumns = db.prepare(`PRAGMA table_info(vehicles)`).all() as { name: string }[];
    const hasModelId = vColumns.some(col => col.name === 'model_id');
    const hasModel = vColumns.some(col => col.name === 'model');
    const hasBrand = vColumns.some(col => col.name === 'brand');

    if (!hasModelId) {
      db.exec(`ALTER TABLE vehicles ADD COLUMN model_id TEXT`);
      console.log(`[Database] Migration: Added model_id column to vehicles`);
    }

    // Try dropping old columns by recreating the table
    if (hasModel || hasBrand) {
      console.log(`[Database] Migration: Recreating vehicles table to remove legacy columns`);
      db.transaction(() => {
        db.exec(`
          CREATE TABLE vehicles_new (
            id                   TEXT PRIMARY KEY,
            user_id              TEXT NOT NULL,
            plate                TEXT NOT NULL,
            model_id             TEXT,
            year                 INTEGER NOT NULL,
            status               TEXT NOT NULL,
            mileage              INTEGER NOT NULL DEFAULT 0,
            current_renter_id    TEXT,
            default_monthly_rate REAL NOT NULL DEFAULT 0,
            created_at           TEXT NOT NULL,
            updated_at           TEXT NOT NULL,
            dirty                INTEGER NOT NULL DEFAULT 1,
            deleted_at           TEXT
          );
        `);

        db.exec(`
          INSERT INTO vehicles_new (id, user_id, plate, model_id, year, status, mileage, current_renter_id, default_monthly_rate, created_at, updated_at, dirty, deleted_at)
          SELECT id, user_id, plate, model_id, year, status, mileage, current_renter_id, default_monthly_rate, created_at, updated_at, dirty, deleted_at
          FROM vehicles;
        `);

        db.exec(`DROP TABLE vehicles;`);
        db.exec(`ALTER TABLE vehicles_new RENAME TO vehicles;`);
        db.exec(`CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);`);
        db.exec(`CREATE INDEX idx_vehicles_plate   ON vehicles(plate);`);
        console.log(`[Database] Migration: Recreated vehicles table successfully`);
      })();
    }
  } catch (err) {
    console.error(`[Database] Migration error on vehicles (model_id/drops):`, err);
  }
}

function createTables(): void {
  db.exec(`
    -- Configuration (Supabase credentials stored locally)
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS roles (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      permissions TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      deleted_at  TEXT
    );

    CREATE TABLE IF NOT EXISTS app_users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      role_id     TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      deleted_at  TEXT,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    -- Sync metadata (tracks last successful sync per table)
    CREATE TABLE IF NOT EXISTS sync_metadata (
      table_name  TEXT PRIMARY KEY,
      last_sync_at TEXT
    );

    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id                 TEXT PRIMARY KEY,
      user_id            TEXT NOT NULL,
      name               TEXT NOT NULL,
      phone              TEXT,
      cpf                TEXT,
      active_contract    INTEGER NOT NULL DEFAULT 0,
      balance_due        REAL    NOT NULL DEFAULT 0,
      last_payment_date  TEXT,
      created_at         TEXT NOT NULL,
      updated_at         TEXT NOT NULL,
      dirty              INTEGER NOT NULL DEFAULT 1,
      deleted_at         TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
    CREATE INDEX IF NOT EXISTS idx_customers_cpf     ON customers(cpf);

    -- Vehicle Models
    CREATE TABLE IF NOT EXISTS vehicle_models (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      name       TEXT NOT NULL,
      brand      TEXT NOT NULL,
      image_url  TEXT,
      status     TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      dirty      INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_vehicle_models_user_id ON vehicle_models(user_id);

    -- Vehicles
    CREATE TABLE IF NOT EXISTS vehicles (
      id                   TEXT PRIMARY KEY,
      user_id              TEXT NOT NULL,
      plate                TEXT NOT NULL,
      model_id             TEXT,
      year                 INTEGER NOT NULL,
      status               TEXT NOT NULL,
      mileage              INTEGER NOT NULL DEFAULT 0,
      current_renter_id    TEXT,
      default_monthly_rate REAL NOT NULL DEFAULT 0,
      created_at           TEXT NOT NULL,
      updated_at           TEXT NOT NULL,
      dirty                INTEGER NOT NULL DEFAULT 1,
      deleted_at           TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
    CREATE INDEX IF NOT EXISTS idx_vehicles_plate   ON vehicles(plate);

    -- Rental contracts
    CREATE TABLE IF NOT EXISTS rental_contracts (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL,
      vehicle_id   TEXT NOT NULL,
      customer_id  TEXT NOT NULL,
      start_date   TEXT NOT NULL,
      end_date     TEXT,
      monthly_rate REAL NOT NULL,
      status       TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      dirty        INTEGER NOT NULL DEFAULT 1,
      deleted_at   TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_rentals_user_id     ON rental_contracts(user_id);
    CREATE INDEX IF NOT EXISTS idx_rentals_vehicle_id  ON rental_contracts(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_rentals_customer_id ON rental_contracts(customer_id);

    -- Maintenance records
    CREATE TABLE IF NOT EXISTS maintenance_records (
      id               TEXT PRIMARY KEY,
      user_id          TEXT NOT NULL,
      vehicle_id       TEXT NOT NULL,
      vehicle_plate    TEXT NOT NULL,
      entry_date       TEXT NOT NULL,
      completion_date  TEXT,
      mechanic_name    TEXT NOT NULL,
      description      TEXT NOT NULL,
      type             TEXT NOT NULL,
      cost             REAL NOT NULL DEFAULT 0,
      status           TEXT NOT NULL DEFAULT 'OPEN',
      created_at       TEXT NOT NULL,
      updated_at       TEXT NOT NULL,
      dirty            INTEGER NOT NULL DEFAULT 1,
      deleted_at       TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_maintenance_user_id    ON maintenance_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance_records(vehicle_id);
  `);

  // Semente inicial de roles e usuários caso vazio
  const rolesCount = db.prepare('SELECT COUNT(*) as count FROM roles').get() as { count: number };
  if (rolesCount.count === 0) {
    const now = new Date().toISOString();

    // Gerente (Admin)
    db.prepare(`INSERT INTO roles (id, name, permissions, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run(
      'role_admin', 'Gerente', JSON.stringify(['*']), now, now
    );
    // Oficina
    db.prepare(`INSERT INTO roles (id, name, permissions, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run(
      'role_mechanic', 'Oficina', JSON.stringify(['veiculos_view', 'oficina_view', 'oficina_edit']), now, now
    );
    // Financeiro
    db.prepare(`INSERT INTO roles (id, name, permissions, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run(
      'role_billing', 'Financeiro', JSON.stringify(['financeiro_view', 'financeiro_edit']), now, now
    );

    // Usuário admin padrão
    db.prepare(`INSERT INTO app_users (id, name, email, password, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      '1', 'Gestor Master', 'admin@gclocamoto.com.br', 'admin123', 'role_admin', now, now
    );
    // Mecânico
    db.prepare(`INSERT INTO app_users (id, name, email, password, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      '2', 'Roberto Mecânico', 'oficina@gclocamoto.com.br', 'oficina123', 'role_mechanic', now, now
    );
    // Financeiro
    db.prepare(`INSERT INTO app_users (id, name, email, password, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      '3', 'Clara Financeiro', 'financeiro@gclocamoto.com.br', 'financas123', 'role_billing', now, now
    );
  }
}

// ─── Config helpers ───────────────────────────────────────────────────────────

function getConfig(key: string): string | null {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

function setConfig(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run(key, value);
}

// ─── Sync metadata helpers ────────────────────────────────────────────────────

function getSyncMetadata(tableName: string): string | null {
  const row = db.prepare('SELECT last_sync_at FROM sync_metadata WHERE table_name = ?').get(tableName) as { last_sync_at: string } | undefined;
  return row?.last_sync_at ?? null;
}

function setSyncMetadata(tableName: string, timestamp: string): void {
  db.prepare('INSERT OR REPLACE INTO sync_metadata (table_name, last_sync_at) VALUES (?, ?)').run(tableName, timestamp);
}

// ─── Generic upsert batch (used by sync) ─────────────────────────────────────

function upsertCustomers(rows: Record<string, unknown>[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO customers
      (id, user_id, name, phone, cpf, active_contract, balance_due, last_payment_date, created_at, updated_at, dirty)
    VALUES
      (@id, @user_id, @name, @phone, @cpf, @active_contract, @balance_due, @last_payment_date, @created_at, @updated_at, 0)
  `);
  const insertMany = db.transaction((items: Record<string, unknown>[]) => {
    for (const item of items) stmt.run(item);
  });
  insertMany(rows);
}

function upsertVehicleModels(rows: Record<string, unknown>[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO vehicle_models
      (id, user_id, name, brand, image_url, status, created_at, updated_at, dirty)
    VALUES
      (@id, @user_id, @name, @brand, @image_url, @status, @created_at, @updated_at, 0)
  `);
  const insertMany = db.transaction((items: Record<string, unknown>[]) => {
    for (const item of items) stmt.run(item);
  });
  insertMany(rows);
}

function upsertVehicles(rows: Record<string, unknown>[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO vehicles
      (id, user_id, plate, model_id, year, status, mileage, current_renter_id, default_monthly_rate, created_at, updated_at, dirty)
    VALUES
      (@id, @user_id, @plate, @model_id, @year, @status, @mileage, @current_renter_id, @default_monthly_rate, @created_at, @updated_at, 0)
  `);
  const insertMany = db.transaction((items: Record<string, unknown>[]) => {
    for (const item of items) stmt.run(item);
  });
  insertMany(rows);
}

function upsertRentals(rows: Record<string, unknown>[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO rental_contracts
      (id, user_id, vehicle_id, customer_id, start_date, end_date, monthly_rate, status, created_at, updated_at, dirty)
    VALUES
      (@id, @user_id, @vehicle_id, @customer_id, @start_date, @end_date, @monthly_rate, @status, @created_at, @updated_at, 0)
  `);
  const insertMany = db.transaction((items: Record<string, unknown>[]) => {
    for (const item of items) stmt.run(item);
  });
  insertMany(rows);
}

function upsertMaintenance(rows: Record<string, unknown>[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO maintenance_records
      (id, user_id, vehicle_id, vehicle_plate, entry_date, completion_date, mechanic_name, description, type, cost, status, created_at, updated_at, dirty)
    VALUES
      (@id, @user_id, @vehicle_id, @vehicle_plate, @entry_date, @completion_date, @mechanic_name, @description, @type, @cost, @status, @created_at, @updated_at, 0)
  `);
  const insertMany = db.transaction((items: Record<string, unknown>[]) => {
    for (const item of items) stmt.run(item);
  });
  insertMany(rows);
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

export function registerIpcHandlers(): void {

  // ── Config ──
  ipcMain.handle('db:config:get', (_e, args: { key: string }) => {
    return getConfig(args.key);
  });

  ipcMain.handle('db:config:set', (_e, args: { key: string; value: string }) => {
    setConfig(args.key, args.value);
  });

  ipcMain.handle('db:config:getAll', () => {
    return db.prepare('SELECT key, value FROM config').all();
  });

  // ── Sync metadata ──
  ipcMain.handle('sync:getMetadata', (_e, args: { table: string }) => {
    return getSyncMetadata(args.table);
  });

  ipcMain.handle('sync:setMetadata', (_e, args: { table: string; timestamp: string }) => {
    setSyncMetadata(args.table, args.timestamp);
  });

  ipcMain.handle('sync:status', () => {
    const countDirty = (table: string) =>
      (db.prepare(`SELECT COUNT(*) as n FROM ${table} WHERE dirty = 1`).get() as { n: number }).n;
    return {
      lastSync: getConfig('last_sync_at'),
      pendingCount:
        countDirty('customers') +
        countDirty('vehicle_models') +
        countDirty('vehicles') +
        countDirty('rental_contracts') +
        countDirty('maintenance_records'),
    };
  });

  // ── Upsert batches (used by sync from Supabase) ──
  ipcMain.handle('db:customers:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertCustomers(args.rows);
  });
  ipcMain.handle('db:vehicleModels:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertVehicleModels(args.rows);
  });
  ipcMain.handle('db:vehicles:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertVehicles(args.rows);
  });
  ipcMain.handle('db:rentals:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertRentals(args.rows);
  });
  ipcMain.handle('db:maintenance:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertMaintenance(args.rows);
  });

  // ── Customers CRUD ──
  ipcMain.handle('db:customers:getAll', (_e, args: { userId: string }) => {
    return db.prepare('SELECT * FROM customers WHERE user_id = ? AND deleted_at IS NULL ORDER BY name').all(args.userId);
  });

  ipcMain.handle('db:customers:getById', (_e, args: { id: string; userId: string }) => {
    return db.prepare('SELECT * FROM customers WHERE id = ? AND user_id = ? AND deleted_at IS NULL').get(args.id, args.userId) ?? null;
  });

  ipcMain.handle('db:customers:create', (_e, args: Record<string, unknown> & { userId: string }) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO customers (id, user_id, name, phone, cpf, active_contract, balance_due, last_payment_date, created_at, updated_at, dirty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id, args.userId, args.name, args.phone ?? null, args.cpf ?? null,
      args.active_contract ? 1 : 0, args.balance_due ?? 0, args.last_payment_date ?? null,
      now, now
    );
    return db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  });

  ipcMain.handle('db:customers:update', (_e, args: Record<string, unknown> & { id: string; userId: string }) => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];

    const updateable = ['name', 'phone', 'cpf', 'active_contract', 'balance_due', 'last_payment_date'] as const;
    for (const field of updateable) {
      if (field in args) {
        fields.push(`${field} = ?`);
        values.push(field === 'active_contract' ? (args[field] ? 1 : 0) : args[field]);
      }
    }
    fields.push('updated_at = ?', 'dirty = 1');
    values.push(now, args.id, args.userId);

    db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    return db.prepare('SELECT * FROM customers WHERE id = ?').get(args.id);
  });

  ipcMain.handle('db:customers:delete', (_e, args: { id: string; userId: string }) => {
    const now = new Date().toISOString();
    db.prepare('UPDATE customers SET deleted_at = ?, dirty = 1 WHERE id = ? AND user_id = ?').run(now, args.id, args.userId);
  });

  // ── Vehicle Models CRUD ──
  ipcMain.handle('db:vehicleModels:getAll', (_e, args: { userId: string }) => {
    return db.prepare('SELECT * FROM vehicle_models WHERE user_id = ? AND deleted_at IS NULL ORDER BY name').all(args.userId);
  });

  ipcMain.handle('db:vehicleModels:getById', (_e, args: { id: string; userId: string }) => {
    return db.prepare('SELECT * FROM vehicle_models WHERE id = ? AND user_id = ? AND deleted_at IS NULL').get(args.id, args.userId) ?? null;
  });

  ipcMain.handle('db:vehicleModels:create', (_e, args: Record<string, unknown> & { userId: string }) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO vehicle_models (id, user_id, name, brand, image_url, status, created_at, updated_at, dirty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id, args.userId, args.name, args.brand, args.image_url ?? null, args.status ?? 'ACTIVE', now, now
    );
    return db.prepare('SELECT * FROM vehicle_models WHERE id = ?').get(id);
  });

  ipcMain.handle('db:vehicleModels:update', (_e, args: Record<string, unknown> & { id: string; userId: string }) => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];

    const updateable = ['name', 'brand', 'image_url', 'status'] as const;
    for (const field of updateable) {
      if (field in args) {
        fields.push(`${field} = ?`);
        values.push(args[field]);
      }
    }
    fields.push('updated_at = ?', 'dirty = 1');
    values.push(now, args.id, args.userId);

    db.prepare(`UPDATE vehicle_models SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    return db.prepare('SELECT * FROM vehicle_models WHERE id = ?').get(args.id);
  });

  ipcMain.handle('db:vehicleModels:delete', (_e, args: { id: string; userId: string }) => {
    const now = new Date().toISOString();
    db.prepare('UPDATE vehicle_models SET deleted_at = ?, dirty = 1 WHERE id = ? AND user_id = ?').run(now, args.id, args.userId);
  });

  // ── Vehicles CRUD ──
  ipcMain.handle('db:vehicles:getAll', (_e, args: { userId: string }) => {
    const rawVehicles = db.prepare('SELECT * FROM vehicles WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC').all(args.userId);
    const models = db.prepare('SELECT * FROM vehicle_models WHERE user_id = ? AND deleted_at IS NULL').all(args.userId);
    const modelMap = new Map(models.map((m: any) => [m.id, m]));
    return rawVehicles.map((v: any) => ({
      ...v,
      model: modelMap.get(v.model_id) || null
    }));
  });

  ipcMain.handle('db:vehicles:getById', (_e, args: { id: string; userId: string }) => {
    const v: any = db.prepare('SELECT * FROM vehicles WHERE id = ? AND user_id = ? AND deleted_at IS NULL').get(args.id, args.userId);
    if (!v) return null;
    const model = db.prepare('SELECT * FROM vehicle_models WHERE id = ? AND user_id = ?').get(v.model_id, args.userId) ?? null;
    return { ...v, model };
  });

  ipcMain.handle('db:vehicles:create', (_e, args: Record<string, unknown> & { userId: string }) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO vehicles (id, user_id, plate, model_id, year, status, mileage, current_renter_id, default_monthly_rate, created_at, updated_at, dirty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id, args.userId, args.plate, args.model_id, args.year,
      args.status, args.mileage ?? 0, args.current_renter_id ?? null,
      args.default_monthly_rate ?? 0, now, now
    );
    const v: any = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    const model = db.prepare('SELECT * FROM vehicle_models WHERE id = ? AND user_id = ?').get(v.model_id, args.userId) ?? null;
    return { ...v, model };
  });

  ipcMain.handle('db:vehicles:update', (_e, args: Record<string, unknown> & { id: string; userId: string }) => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];

    const updateable = ['plate', 'model_id', 'year', 'status', 'mileage', 'current_renter_id', 'default_monthly_rate'] as const;
    for (const field of updateable) {
      if (field in args) {
        fields.push(`${field} = ?`);
        values.push(args[field]);
      }
    }
    fields.push('updated_at = ?', 'dirty = 1');
    values.push(now, args.id, args.userId);

    db.prepare(`UPDATE vehicles SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    const v: any = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(args.id);
    const model = db.prepare('SELECT * FROM vehicle_models WHERE id = ? AND user_id = ?').get(v.model_id, args.userId) ?? null;
    return { ...v, model };
  });

  ipcMain.handle('db:vehicles:delete', (_e, args: { id: string; userId: string }) => {
    const now = new Date().toISOString();
    db.prepare('UPDATE vehicles SET deleted_at = ?, dirty = 1 WHERE id = ? AND user_id = ?').run(now, args.id, args.userId);
  });

  // ── Rental Contracts CRUD ──
  ipcMain.handle('db:rentals:getAll', (_e, args: { userId: string }) => {
    return db.prepare('SELECT * FROM rental_contracts WHERE user_id = ? AND deleted_at IS NULL ORDER BY start_date DESC').all(args.userId);
  });

  ipcMain.handle('db:rentals:getById', (_e, args: { id: string; userId: string }) => {
    return db.prepare('SELECT * FROM rental_contracts WHERE id = ? AND user_id = ? AND deleted_at IS NULL').get(args.id, args.userId) ?? null;
  });

  ipcMain.handle('db:rentals:create', (_e, args: Record<string, unknown> & { userId: string }) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO rental_contracts (id, user_id, vehicle_id, customer_id, start_date, end_date, monthly_rate, status, created_at, updated_at, dirty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id, args.userId, args.vehicle_id, args.customer_id, args.start_date,
      args.end_date ?? null, args.monthly_rate, args.status ?? 'ACTIVE', now, now
    );
    return db.prepare('SELECT * FROM rental_contracts WHERE id = ?').get(id);
  });

  ipcMain.handle('db:rentals:update', (_e, args: Record<string, unknown> & { id: string; userId: string }) => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];

    const updateable = ['vehicle_id', 'customer_id', 'start_date', 'end_date', 'monthly_rate', 'status'] as const;
    for (const field of updateable) {
      if (field in args) {
        fields.push(`${field} = ?`);
        values.push(args[field]);
      }
    }
    fields.push('updated_at = ?', 'dirty = 1');
    values.push(now, args.id, args.userId);

    db.prepare(`UPDATE rental_contracts SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    return db.prepare('SELECT * FROM rental_contracts WHERE id = ?').get(args.id);
  });

  ipcMain.handle('db:rentals:delete', (_e, args: { id: string; userId: string }) => {
    const now = new Date().toISOString();
    db.prepare('UPDATE rental_contracts SET deleted_at = ?, dirty = 1 WHERE id = ? AND user_id = ?').run(now, args.id, args.userId);
  });

  // ── Maintenance Records CRUD ──
  ipcMain.handle('db:maintenance:getAll', (_e, args: { userId: string }) => {
    return db.prepare('SELECT * FROM maintenance_records WHERE user_id = ? AND deleted_at IS NULL ORDER BY entry_date DESC').all(args.userId);
  });

  ipcMain.handle('db:maintenance:getById', (_e, args: { id: string; userId: string }) => {
    return db.prepare('SELECT * FROM maintenance_records WHERE id = ? AND user_id = ? AND deleted_at IS NULL').get(args.id, args.userId) ?? null;
  });

  ipcMain.handle('db:maintenance:create', (_e, args: Record<string, unknown> & { userId: string }) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO maintenance_records
        (id, user_id, vehicle_id, vehicle_plate, entry_date, completion_date, mechanic_name, description, type, cost, status, created_at, updated_at, dirty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id, args.userId, args.vehicle_id, args.vehicle_plate, args.entry_date,
      args.completion_date ?? null, args.mechanic_name, args.description, args.type,
      args.cost ?? 0, args.status ?? 'OPEN', now, now
    );
    return db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id);
  });

  ipcMain.handle('db:maintenance:update', (_e, args: Record<string, unknown> & { id: string; userId: string }) => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];

    const updateable = ['vehicle_id', 'vehicle_plate', 'entry_date', 'completion_date', 'mechanic_name', 'description', 'type', 'cost', 'status'] as const;
    for (const field of updateable) {
      if (field in args) {
        fields.push(`${field} = ?`);
        values.push(args[field]);
      }
    }
    fields.push('updated_at = ?', 'dirty = 1');
    values.push(now, args.id, args.userId);

    db.prepare(`UPDATE maintenance_records SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    return db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(args.id);
  });

  ipcMain.handle('db:maintenance:delete', (_e, args: { id: string; userId: string }) => {
    const now = new Date().toISOString();
    db.prepare('UPDATE maintenance_records SET deleted_at = ?, dirty = 1 WHERE id = ? AND user_id = ?').run(now, args.id, args.userId);
  });

  // ── App info ──
  ipcMain.handle('app:isElectron', () => true);
  ipcMain.handle('app:getVersion', () => app.getVersion());

  // ── Roles CRUD ──
  ipcMain.handle('db:roles:getAll', () => {
    return db.prepare("SELECT * FROM roles WHERE deleted_at IS NULL ORDER BY name").all()
      .map((r: any) => ({ ...r, permissions: JSON.parse(r.permissions) }));
  });

  ipcMain.handle('db:roles:create', (_e, args: any) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare("INSERT INTO roles (id, name, permissions, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(
      id, args.name, JSON.stringify(args.permissions), now, now
    );
    const r: any = db.prepare("SELECT * FROM roles WHERE id = ?").get(id);
    return { ...r, permissions: JSON.parse(r.permissions) };
  });

  ipcMain.handle('db:roles:update', (_e, args: any) => {
    const now = new Date().toISOString();
    db.prepare("UPDATE roles SET name = ?, permissions = ?, updated_at = ? WHERE id = ?").run(
      args.name, JSON.stringify(args.permissions), now, args.id
    );
    const r: any = db.prepare("SELECT * FROM roles WHERE id = ?").get(args.id);
    return { ...r, permissions: JSON.parse(r.permissions) };
  });

  ipcMain.handle('db:roles:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    db.prepare("UPDATE roles SET deleted_at = ? WHERE id = ?").run(now, args.id);
  });

  // ── Users CRUD ──
  ipcMain.handle('db:users:getAll', () => {
    const users: any[] = db.prepare(`
      SELECT 
        u.id, u.name, u.email, u.role_id, u.created_at, u.updated_at,
        r.id as r_id, r.name as r_name, r.permissions as r_permissions
      FROM app_users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.deleted_at IS NULL
      ORDER BY u.name
    `).all();

    return users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role_id: u.role_id,
      created_at: u.created_at,
      updated_at: u.updated_at,
      role: u.r_id ? {
        id: u.r_id,
        name: u.r_name,
        permissions: JSON.parse(u.r_permissions)
      } : undefined
    }));
  });

  ipcMain.handle('db:users:create', (_e, args: any) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare("INSERT INTO app_users (id, name, email, password, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      id, args.name, args.email, args.password, args.role_id, now, now
    );
    return db.prepare("SELECT * FROM app_users WHERE id = ?").get(id);
  });

  ipcMain.handle('db:users:update', (_e, args: any) => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];
    const updateable = ['name', 'email', 'password', 'role_id'] as const;
    for (const field of updateable) {
      if (args[field]) {
        fields.push(`${field} = ?`);
        values.push(args[field]);
      }
    }
    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(now, args.id);
      db.prepare(`UPDATE app_users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
  });

  ipcMain.handle('db:users:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    db.prepare("UPDATE app_users SET deleted_at = ? WHERE id = ?").run(now, args.id);
  });

  ipcMain.handle('db:users:login', (_e, args: { email: string; password?: string }) => {
    // If no password is provided, just get the user by email (for re-hydration/mocking). 
    // In MVP password might be verified here.
    let userRow: any;
    if (args.password) {
      userRow = db.prepare("SELECT * FROM app_users WHERE email = ? AND password = ? AND deleted_at IS NULL").get(args.email, args.password);
    } else {
      userRow = db.prepare("SELECT * FROM app_users WHERE email = ? AND deleted_at IS NULL").get(args.email);
    }

    if (!userRow) return null;

    const r: any = db.prepare("SELECT * FROM roles WHERE id = ?").get(userRow.role_id);
    return {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role_id: userRow.role_id,
      role: r ? { id: r.id, name: r.name, permissions: JSON.parse(r.permissions) } : undefined
    };
  });
}
