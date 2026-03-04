import { app, ipcMain } from 'electron';
import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';

let db: Database.Database;

// ─── Initialization ──────────────────────────────────────────────────────────

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'gc-loca-moto.sqlite');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  createTables();
}

function createTables(): void {
  db.exec(`
    -- Configuration (Supabase credentials stored locally)
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
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

    -- Vehicles
    CREATE TABLE IF NOT EXISTS vehicles (
      id                   TEXT PRIMARY KEY,
      user_id              TEXT NOT NULL,
      plate                TEXT NOT NULL,
      model                TEXT NOT NULL,
      brand                TEXT NOT NULL,
      year                 INTEGER NOT NULL,
      status               TEXT NOT NULL,
      mileage              INTEGER NOT NULL DEFAULT 0,
      image_url            TEXT,
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

function upsertVehicles(rows: Record<string, unknown>[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO vehicles
      (id, user_id, plate, model, brand, year, status, mileage, image_url, current_renter_id, default_monthly_rate, created_at, updated_at, dirty)
    VALUES
      (@id, @user_id, @plate, @model, @brand, @year, @status, @mileage, @image_url, @current_renter_id, @default_monthly_rate, @created_at, @updated_at, 0)
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
        countDirty('vehicles') +
        countDirty('rental_contracts') +
        countDirty('maintenance_records'),
    };
  });

  // ── Upsert batches (used by sync from Supabase) ──
  ipcMain.handle('db:customers:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertCustomers(args.rows);
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

  // ── Vehicles CRUD ──
  ipcMain.handle('db:vehicles:getAll', (_e, args: { userId: string }) => {
    return db.prepare('SELECT * FROM vehicles WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC').all(args.userId);
  });

  ipcMain.handle('db:vehicles:getById', (_e, args: { id: string; userId: string }) => {
    return db.prepare('SELECT * FROM vehicles WHERE id = ? AND user_id = ? AND deleted_at IS NULL').get(args.id, args.userId) ?? null;
  });

  ipcMain.handle('db:vehicles:create', (_e, args: Record<string, unknown> & { userId: string }) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO vehicles (id, user_id, plate, model, brand, year, status, mileage, image_url, current_renter_id, default_monthly_rate, created_at, updated_at, dirty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id, args.userId, args.plate, args.model, args.brand, args.year,
      args.status, args.mileage ?? 0, args.image_url ?? null, args.current_renter_id ?? null,
      args.default_monthly_rate ?? 0, now, now
    );
    return db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
  });

  ipcMain.handle('db:vehicles:update', (_e, args: Record<string, unknown> & { id: string; userId: string }) => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];

    const updateable = ['plate', 'model', 'brand', 'year', 'status', 'mileage', 'image_url', 'current_renter_id', 'default_monthly_rate'] as const;
    for (const field of updateable) {
      if (field in args) {
        fields.push(`${field} = ?`);
        values.push(args[field]);
      }
    }
    fields.push('updated_at = ?', 'dirty = 1');
    values.push(now, args.id, args.userId);

    db.prepare(`UPDATE vehicles SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    return db.prepare('SELECT * FROM vehicles WHERE id = ?').get(args.id);
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
}
