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
  seedData();
}

function runMigrations(): void {
  // Array of tables to ensure deleted_at exists for existing SQLite database files
  const tablesWithUserId = ['customers', 'maintenance_records'];

  // Check if old rental_contracts table still exists and needs renaming
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
  const hasOldRentals = tables.some(t => t.name === 'rental_contracts');
  const hasNewRentals = tables.some(t => t.name === 'rentals');

  // Also add rental_contracts to migration targets if it still exists (for deleted_at/user_id)
  const migrationTargets = hasOldRentals
    ? [...tablesWithUserId, 'rental_contracts', 'vehicles', 'vehicle_models']
    : [...tablesWithUserId, 'rentals', 'vehicles', 'vehicle_models'];

  for (const table of migrationTargets) {
    try {
      const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
      const hasDeletedAt = columns.some(col => col.name === 'deleted_at');

      if (!hasDeletedAt) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN deleted_at TEXT`);
      }

      // Only add user_id to tables that still need it
      const needsUserId = tablesWithUserId.includes(table) || table === 'rental_contracts' || table === 'rentals';
      if (needsUserId) {
        const hasUserId = columns.some(col => col.name === 'user_id');
        if (!hasUserId) {
          db.exec(`ALTER TABLE ${table} ADD COLUMN user_id TEXT DEFAULT '1'`);
        }
      }
    } catch (err) {
    }
  }

  // Migration: rename rental_contracts → rentals
  if (hasOldRentals && !hasNewRentals) {
    try {
      db.transaction(() => {
        db.exec(`ALTER TABLE rental_contracts RENAME TO rentals;`);
      })();
    } catch (err) {
    }
  }

  // Migration: add workshop_id to roles if missing
  try {
    const rolesColumns = db.prepare(`PRAGMA table_info(roles)`).all() as { name: string }[];
    const hasWorkshopId = rolesColumns.some(col => col.name === 'workshop_id');
    if (!hasWorkshopId) {
      db.exec(`ALTER TABLE roles ADD COLUMN workshop_id TEXT`);
    }
  } catch (err) {
  }

  // Migration: add workshop_id to maintenance_records if missing
  try {
    const mColumns = db.prepare(`PRAGMA table_info(maintenance_records)`).all() as { name: string }[];
    const hasWorkshopId = mColumns.some(col => col.name === 'workshop_id');
    if (!hasWorkshopId) {
      db.exec(`ALTER TABLE maintenance_records ADD COLUMN workshop_id TEXT`);
    }
    db.exec(`CREATE INDEX IF NOT EXISTS idx_maintenance_workshop_id ON maintenance_records(workshop_id)`);
  } catch (err) {
  }

  // Migration: remove user_id from vehicles table (vehicles are shared across all users)
  try {
    const vColumns = db.prepare(`PRAGMA table_info(vehicles)`).all() as { name: string }[];
    const hasModelId = vColumns.some(col => col.name === 'model_id');
    const hasModel = vColumns.some(col => col.name === 'model');
    const hasBrand = vColumns.some(col => col.name === 'brand');
    const hasUserId = vColumns.some(col => col.name === 'user_id');

    if (!hasModelId) {
      db.exec(`ALTER TABLE vehicles ADD COLUMN model_id TEXT`);
    }

    // Recreate vehicles table to remove legacy columns (model, brand) and user_id
    if (hasModel || hasBrand || hasUserId) {
      db.transaction(() => {
        db.exec(`
          CREATE TABLE vehicles_new (
            id                   TEXT PRIMARY KEY,
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
          INSERT INTO vehicles_new (id, plate, model_id, year, status, mileage, current_renter_id, default_monthly_rate, created_at, updated_at, dirty, deleted_at)
          SELECT id, plate, model_id, year, status, mileage, current_renter_id, default_monthly_rate, created_at, updated_at, dirty, deleted_at
          FROM vehicles;
        `);

        db.exec(`DROP TABLE vehicles;`);
        db.exec(`ALTER TABLE vehicles_new RENAME TO vehicles;`);
        db.exec(`CREATE INDEX idx_vehicles_plate ON vehicles(plate);`);
      })();
    }
  } catch (err) {
  }

  // Migration: convert vehicles.status (text) → status_id (FK to vehicle_statuses)
  try {
    const vColumns = db.prepare(`PRAGMA table_info(vehicles)`).all() as { name: string }[];
    const hasStatus = vColumns.some(col => col.name === 'status');
    const hasStatusId = vColumns.some(col => col.name === 'status_id');

    if (hasStatus && !hasStatusId) {
      // Build mapping from status name → vehicle_statuses.id
      const statusRows = db.prepare('SELECT id, name FROM vehicle_statuses').all() as { id: string; name: string }[];
      const statusMap = new Map(statusRows.map(s => [s.name, s.id]));
      const defaultStatusId = statusMap.get('Disponível') || statusRows[0]?.id || 'vs_available';

      db.transaction(() => {
        db.exec(`
          CREATE TABLE vehicles_new (
            id                   TEXT PRIMARY KEY,
            plate                TEXT NOT NULL,
            model_id             TEXT REFERENCES vehicle_models(id),
            year                 INTEGER NOT NULL,
            status_id            TEXT NOT NULL REFERENCES vehicle_statuses(id),
            mileage              INTEGER NOT NULL DEFAULT 0,
            current_renter_id    TEXT REFERENCES customers(id),
            default_monthly_rate REAL NOT NULL DEFAULT 0,
            created_at           TEXT NOT NULL,
            updated_at           TEXT NOT NULL,
            dirty                INTEGER NOT NULL DEFAULT 1,
            deleted_at           TEXT
          );
        `);

        // Migrate data: map status text to status_id
        const oldVehicles = db.prepare('SELECT * FROM vehicles').all() as any[];
        const insertStmt = db.prepare(`
          INSERT INTO vehicles_new (id, plate, model_id, year, status_id, mileage, current_renter_id, default_monthly_rate, created_at, updated_at, dirty, deleted_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const v of oldVehicles) {
          const statusId = statusMap.get(v.status) || defaultStatusId;
          insertStmt.run(v.id, v.plate, v.model_id, v.year, statusId, v.mileage, v.current_renter_id, v.default_monthly_rate, v.created_at, v.updated_at, v.dirty, v.deleted_at);
        }

        db.exec(`DROP TABLE vehicles;`);
        db.exec(`ALTER TABLE vehicles_new RENAME TO vehicles;`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_vehicles_status_id ON vehicles(status_id);`);
      })();
    }
  } catch (err) {
  }

  // Migration: remove user_id from vehicle_models table (models are shared across all users)
  try {
    const vmColumns = db.prepare(`PRAGMA table_info(vehicle_models)`).all() as { name: string }[];
    const hasUserId = vmColumns.some(col => col.name === 'user_id');

    if (hasUserId) {
      db.transaction(() => {
        db.exec(`
          CREATE TABLE vehicle_models_new (
            id         TEXT PRIMARY KEY,
            name       TEXT NOT NULL,
            brand      TEXT NOT NULL,
            image_url  TEXT,
            status     TEXT NOT NULL DEFAULT 'ACTIVE',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            dirty      INTEGER NOT NULL DEFAULT 1,
            deleted_at TEXT
          );
        `);

        db.exec(`
          INSERT INTO vehicle_models_new (id, name, brand, image_url, status, created_at, updated_at, dirty, deleted_at)
          SELECT id, name, brand, image_url, status, created_at, updated_at, dirty, deleted_at
          FROM vehicle_models;
        `);

        db.exec(`DROP TABLE vehicle_models;`);
        db.exec(`ALTER TABLE vehicle_models_new RENAME TO vehicle_models;`);
      })();
    }
  } catch (err) {
  }
}

function createTables(): void {
  db.exec(`
    -- Configuration (Supabase credentials stored locally)
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Workshops (Oficinas)
    CREATE TABLE IF NOT EXISTS workshops (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      address    TEXT,
      status     TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      dirty      INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT
    );

    -- Vehicle Statuses (Status de Veículos)
    CREATE TABLE IF NOT EXISTS vehicle_statuses (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      color      TEXT NOT NULL DEFAULT '#6b7280',
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      dirty      INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS roles (
      id          TEXT PRIMARY KEY,
      workshop_id TEXT,
      name        TEXT NOT NULL,
      permissions TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      deleted_at  TEXT,
      FOREIGN KEY (workshop_id) REFERENCES workshops(id)
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

    -- Vehicle Models (shared across all users)
    CREATE TABLE IF NOT EXISTS vehicle_models (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      brand      TEXT NOT NULL,
      image_url  TEXT,
      status     TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      dirty      INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT
    );

    -- Vehicles (shared across all users)
    CREATE TABLE IF NOT EXISTS vehicles (
      id                   TEXT PRIMARY KEY,
      plate                TEXT NOT NULL,
      model_id             TEXT REFERENCES vehicle_models(id),
      year                 INTEGER NOT NULL,
      status_id            TEXT NOT NULL REFERENCES vehicle_statuses(id),
      mileage              INTEGER NOT NULL DEFAULT 0,
      current_renter_id    TEXT REFERENCES customers(id),
      default_monthly_rate REAL NOT NULL DEFAULT 0,
      created_at           TEXT NOT NULL,
      updated_at           TEXT NOT NULL,
      dirty                INTEGER NOT NULL DEFAULT 1,
      deleted_at           TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
    CREATE INDEX IF NOT EXISTS idx_vehicles_status_id ON vehicles(status_id);

    -- Rentals (Alugueis)
    CREATE TABLE IF NOT EXISTS rentals (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL,
      vehicle_id   TEXT NOT NULL REFERENCES vehicles(id),
      customer_id  TEXT NOT NULL REFERENCES customers(id),
      start_date   TEXT NOT NULL,
      end_date     TEXT,
      monthly_rate REAL NOT NULL,
      status       TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      dirty        INTEGER NOT NULL DEFAULT 1,
      deleted_at   TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_rentals_user_id     ON rentals(user_id);
    CREATE INDEX IF NOT EXISTS idx_rentals_vehicle_id  ON rentals(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_rentals_customer_id ON rentals(customer_id);

    -- Contracts (Contratos) — generated from a rental (1:0..1)
    CREATE TABLE IF NOT EXISTS contracts (
      id         TEXT PRIMARY KEY,
      rental_id  TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      dirty      INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT,
      FOREIGN KEY (rental_id) REFERENCES rentals(id)
    );
    CREATE INDEX IF NOT EXISTS idx_contracts_rental_id ON contracts(rental_id);

    -- Maintenance records
    CREATE TABLE IF NOT EXISTS maintenance_records (
      id               TEXT PRIMARY KEY,
      user_id          TEXT NOT NULL,
      vehicle_id       TEXT NOT NULL REFERENCES vehicles(id),
      workshop_id      TEXT,
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
      deleted_at       TEXT,
      FOREIGN KEY (workshop_id) REFERENCES workshops(id)
    );
    CREATE INDEX IF NOT EXISTS idx_maintenance_user_id    ON maintenance_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance_records(vehicle_id);

    -- Documents (Documentos) — polymorphic attachments for contracts or maintenance
    CREATE TABLE IF NOT EXISTS documents (
      id          TEXT PRIMARY KEY,
      parent_id   TEXT NOT NULL,
      origin_type TEXT NOT NULL,
      file_url    TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      dirty       INTEGER NOT NULL DEFAULT 1,
      deleted_at  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_id, origin_type);
  `);
}

function seedData(): void {
  // Seed default vehicle statuses if empty
  const statusCount = db.prepare('SELECT COUNT(*) as count FROM vehicle_statuses').get() as { count: number };
  if (statusCount.count === 0) {
    const now = new Date().toISOString();
    const defaults = [
      { id: 'vs_available', name: 'Disponível', color: '#22c55e', is_default: 1 },
      { id: 'vs_rented', name: 'Alugada', color: '#3b82f6', is_default: 1 },
      { id: 'vs_maintenance', name: 'Em Manutenção', color: '#f59e0b', is_default: 1 },
      { id: 'vs_unavailable', name: 'Indisponível', color: '#ef4444', is_default: 1 },
    ];
    const stmt = db.prepare(`INSERT INTO vehicle_statuses (id, name, color, is_default, created_at, updated_at, dirty) VALUES (?, ?, ?, ?, ?, ?, 0)`);
    for (const s of defaults) {
      stmt.run(s.id, s.name, s.color, s.is_default, now, now);
    }
  }

  // Semente inicial de roles e usuários caso vazio
  const rolesCount = db.prepare('SELECT COUNT(*) as count FROM roles').get() as { count: number };
  if (rolesCount.count === 0) {
    const now = new Date().toISOString();

    // Gerente (Admin) — no workshop
    db.prepare(`INSERT INTO roles (id, workshop_id, name, permissions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'role_admin', null, 'Gerente', JSON.stringify(['*']), now, now
    );
    // Oficina — workshop_id null until a workshop is created
    db.prepare(`INSERT INTO roles (id, workshop_id, name, permissions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'role_mechanic', null, 'Oficina', JSON.stringify(['veiculos_view', 'oficina_view', 'oficina_edit']), now, now
    );
    // Financeiro — no workshop
    db.prepare(`INSERT INTO roles (id, workshop_id, name, permissions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'role_billing', null, 'Financeiro', JSON.stringify(['financeiro_view', 'financeiro_edit']), now, now
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
      (id, name, brand, image_url, status, created_at, updated_at, dirty)
    VALUES
      (@id, @name, @brand, @image_url, @status, @created_at, @updated_at, 0)
  `);
  const insertMany = db.transaction((items: Record<string, unknown>[]) => {
    for (const item of items) stmt.run(item);
  });
  insertMany(rows);
}

function upsertVehicles(rows: Record<string, unknown>[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO vehicles
      (id, plate, model_id, year, status_id, mileage, current_renter_id, default_monthly_rate, created_at, updated_at, dirty)
    VALUES
      (@id, @plate, @model_id, @year, @status_id, @mileage, @current_renter_id, @default_monthly_rate, @created_at, @updated_at, 0)
  `);
  const insertMany = db.transaction((items: Record<string, unknown>[]) => {
    for (const item of items) stmt.run(item);
  });
  insertMany(rows);
}

function upsertRentals(rows: Record<string, unknown>[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO rentals
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
      (id, user_id, vehicle_id, workshop_id, vehicle_plate, entry_date, completion_date, mechanic_name, description, type, cost, status, created_at, updated_at, dirty)
    VALUES
      (@id, @user_id, @vehicle_id, @workshop_id, @vehicle_plate, @entry_date, @completion_date, @mechanic_name, @description, @type, @cost, @status, @created_at, @updated_at, 0)
  `);
  const insertMany = db.transaction((items: Record<string, unknown>[]) => {
    for (const item of items) stmt.run(item);
  });
  insertMany(rows);
}

function upsertWorkshops(rows: Record<string, unknown>[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO workshops
      (id, name, address, status, created_at, updated_at, dirty)
    VALUES
      (@id, @name, @address, @status, @created_at, @updated_at, 0)
  `);
  const insertMany = db.transaction((items: Record<string, unknown>[]) => {
    for (const item of items) stmt.run(item);
  });
  insertMany(rows);
}

function upsertContracts(rows: Record<string, unknown>[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO contracts
      (id, rental_id, created_at, updated_at, dirty)
    VALUES
      (@id, @rental_id, @created_at, @updated_at, 0)
  `);
  const insertMany = db.transaction((items: Record<string, unknown>[]) => {
    for (const item of items) stmt.run(item);
  });
  insertMany(rows);
}

function upsertDocuments(rows: Record<string, unknown>[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO documents
      (id, parent_id, origin_type, file_url, created_at, updated_at, dirty)
    VALUES
      (@id, @parent_id, @origin_type, @file_url, @created_at, @updated_at, 0)
  `);
  const insertMany = db.transaction((items: Record<string, unknown>[]) => {
    for (const item of items) stmt.run(item);
  });
  insertMany(rows);
}

function upsertVehicleStatuses(rows: Record<string, unknown>[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO vehicle_statuses
      (id, name, color, is_default, created_at, updated_at, dirty)
    VALUES
      (@id, @name, @color, @is_default, @created_at, @updated_at, 0)
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
        countDirty('rentals') +
        countDirty('contracts') +
        countDirty('maintenance_records') +
        countDirty('workshops') +
        countDirty('documents') +
        countDirty('vehicle_statuses'),
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
  ipcMain.handle('db:workshops:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertWorkshops(args.rows);
  });
  ipcMain.handle('db:contracts:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertContracts(args.rows);
  });
  ipcMain.handle('db:documents:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertDocuments(args.rows);
  });
  ipcMain.handle('db:vehicleStatuses:upsertBatch', (_e, args: { rows: Record<string, unknown>[] }) => {
    upsertVehicleStatuses(args.rows);
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

  // ── Vehicle Models CRUD (shared, no user_id) ──
  ipcMain.handle('db:vehicleModels:getAll', () => {
    return db.prepare('SELECT * FROM vehicle_models WHERE deleted_at IS NULL ORDER BY name').all();
  });

  ipcMain.handle('db:vehicleModels:getById', (_e, args: { id: string }) => {
    return db.prepare('SELECT * FROM vehicle_models WHERE id = ? AND deleted_at IS NULL').get(args.id) ?? null;
  });

  ipcMain.handle('db:vehicleModels:create', (_e, args: Record<string, unknown>) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO vehicle_models (id, name, brand, image_url, status, created_at, updated_at, dirty)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id, args.name, args.brand, args.image_url ?? null, args.status ?? 'ACTIVE', now, now
    );
    return db.prepare('SELECT * FROM vehicle_models WHERE id = ?').get(id);
  });

  ipcMain.handle('db:vehicleModels:update', (_e, args: Record<string, unknown> & { id: string }) => {
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
    values.push(now, args.id);

    db.prepare(`UPDATE vehicle_models SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return db.prepare('SELECT * FROM vehicle_models WHERE id = ?').get(args.id);
  });

  ipcMain.handle('db:vehicleModels:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    db.prepare('UPDATE vehicle_models SET deleted_at = ?, dirty = 1 WHERE id = ?').run(now, args.id);
  });

  // ── Vehicles CRUD (shared, no user_id) ──
  ipcMain.handle('db:vehicles:getAll', () => {
    const rawVehicles = db.prepare('SELECT * FROM vehicles WHERE deleted_at IS NULL ORDER BY created_at DESC').all();
    const models = db.prepare('SELECT * FROM vehicle_models WHERE deleted_at IS NULL').all();
    const modelMap = new Map(models.map((m: any) => [m.id, m]));
    const statuses = db.prepare('SELECT * FROM vehicle_statuses WHERE deleted_at IS NULL').all();
    const statusMap = new Map(statuses.map((s: any) => [s.id, s]));
    return rawVehicles.map((v: any) => ({
      ...v,
      model: modelMap.get(v.model_id) || null,
      vehicleStatus: statusMap.get(v.status_id) || null,
    }));
  });

  ipcMain.handle('db:vehicles:getById', (_e, args: { id: string }) => {
    const v: any = db.prepare('SELECT * FROM vehicles WHERE id = ? AND deleted_at IS NULL').get(args.id);
    if (!v) return null;
    const model = db.prepare('SELECT * FROM vehicle_models WHERE id = ?').get(v.model_id) ?? null;
    const vehicleStatus = db.prepare('SELECT * FROM vehicle_statuses WHERE id = ?').get(v.status_id) ?? null;
    return { ...v, model, vehicleStatus };
  });

  ipcMain.handle('db:vehicles:create', (_e, args: Record<string, unknown>) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO vehicles (id, plate, model_id, year, status_id, mileage, current_renter_id, default_monthly_rate, created_at, updated_at, dirty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id, args.plate, args.model_id, args.year,
      args.status_id, args.mileage ?? 0, args.current_renter_id ?? null,
      args.default_monthly_rate ?? 0, now, now
    );
    const v: any = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    const model = db.prepare('SELECT * FROM vehicle_models WHERE id = ?').get(v.model_id) ?? null;
    const vehicleStatus = db.prepare('SELECT * FROM vehicle_statuses WHERE id = ?').get(v.status_id) ?? null;
    return { ...v, model, vehicleStatus };
  });

  ipcMain.handle('db:vehicles:update', (_e, args: Record<string, unknown> & { id: string }) => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];

    const updateable = ['plate', 'model_id', 'year', 'status_id', 'mileage', 'current_renter_id', 'default_monthly_rate'] as const;
    for (const field of updateable) {
      if (field in args) {
        fields.push(`${field} = ?`);
        values.push(args[field]);
      }
    }
    fields.push('updated_at = ?', 'dirty = 1');
    values.push(now, args.id);

    db.prepare(`UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const v: any = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(args.id);
    const model = db.prepare('SELECT * FROM vehicle_models WHERE id = ?').get(v.model_id) ?? null;
    const vehicleStatus = db.prepare('SELECT * FROM vehicle_statuses WHERE id = ?').get(v.status_id) ?? null;
    return { ...v, model, vehicleStatus };
  });

  ipcMain.handle('db:vehicles:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    db.prepare('UPDATE vehicles SET deleted_at = ?, dirty = 1 WHERE id = ?').run(now, args.id);
  });

  // ── Rentals CRUD ──
  ipcMain.handle('db:rentals:getAll', (_e, args: { userId: string }) => {
    return db.prepare('SELECT * FROM rentals WHERE user_id = ? AND deleted_at IS NULL ORDER BY start_date DESC').all(args.userId);
  });

  ipcMain.handle('db:rentals:getById', (_e, args: { id: string; userId: string }) => {
    return db.prepare('SELECT * FROM rentals WHERE id = ? AND user_id = ? AND deleted_at IS NULL').get(args.id, args.userId) ?? null;
  });

  ipcMain.handle('db:rentals:create', (_e, args: Record<string, unknown> & { userId: string }) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO rentals (id, user_id, vehicle_id, customer_id, start_date, end_date, monthly_rate, status, created_at, updated_at, dirty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id, args.userId, args.vehicle_id, args.customer_id, args.start_date,
      args.end_date ?? null, args.monthly_rate, args.status ?? 'ACTIVE', now, now
    );
    return db.prepare('SELECT * FROM rentals WHERE id = ?').get(id);
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

    db.prepare(`UPDATE rentals SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    return db.prepare('SELECT * FROM rentals WHERE id = ?').get(args.id);
  });

  ipcMain.handle('db:rentals:delete', (_e, args: { id: string; userId: string }) => {
    const now = new Date().toISOString();
    db.prepare('UPDATE rentals SET deleted_at = ?, dirty = 1 WHERE id = ? AND user_id = ?').run(now, args.id, args.userId);
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
        (id, user_id, vehicle_id, workshop_id, vehicle_plate, entry_date, completion_date, mechanic_name, description, type, cost, status, created_at, updated_at, dirty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id, args.userId, args.vehicle_id, args.workshop_id ?? null, args.vehicle_plate, args.entry_date,
      args.completion_date ?? null, args.mechanic_name, args.description, args.type,
      args.cost ?? 0, args.status ?? 'OPEN', now, now
    );
    return db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id);
  });

  ipcMain.handle('db:maintenance:update', (_e, args: Record<string, unknown> & { id: string; userId: string }) => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];

    const updateable = ['vehicle_id', 'workshop_id', 'vehicle_plate', 'entry_date', 'completion_date', 'mechanic_name', 'description', 'type', 'cost', 'status'] as const;
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

  // ── Workshops CRUD ──
  ipcMain.handle('db:workshops:getAll', () => {
    return db.prepare('SELECT * FROM workshops WHERE deleted_at IS NULL ORDER BY name').all();
  });

  ipcMain.handle('db:workshops:getById', (_e, args: { id: string }) => {
    return db.prepare('SELECT * FROM workshops WHERE id = ? AND deleted_at IS NULL').get(args.id) ?? null;
  });

  ipcMain.handle('db:workshops:create', (_e, args: Record<string, unknown>) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO workshops (id, name, address, status, created_at, updated_at, dirty)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(id, args.name, args.address ?? null, args.status ?? 'ACTIVE', now, now);
    return db.prepare('SELECT * FROM workshops WHERE id = ?').get(id);
  });

  ipcMain.handle('db:workshops:update', (_e, args: Record<string, unknown> & { id: string }) => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];
    const updateable = ['name', 'address', 'status'] as const;
    for (const field of updateable) {
      if (field in args) {
        fields.push(`${field} = ?`);
        values.push(args[field]);
      }
    }
    fields.push('updated_at = ?', 'dirty = 1');
    values.push(now, args.id);
    db.prepare(`UPDATE workshops SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return db.prepare('SELECT * FROM workshops WHERE id = ?').get(args.id);
  });

  ipcMain.handle('db:workshops:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    db.prepare('UPDATE workshops SET deleted_at = ?, dirty = 1 WHERE id = ?').run(now, args.id);
  });

  // ── Vehicle Statuses CRUD ──
  ipcMain.handle('db:vehicleStatuses:getAll', () => {
    return db.prepare('SELECT * FROM vehicle_statuses WHERE deleted_at IS NULL ORDER BY name').all();
  });

  ipcMain.handle('db:vehicleStatuses:getById', (_e, args: { id: string }) => {
    return db.prepare('SELECT * FROM vehicle_statuses WHERE id = ? AND deleted_at IS NULL').get(args.id) ?? null;
  });

  ipcMain.handle('db:vehicleStatuses:create', (_e, args: Record<string, unknown>) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO vehicle_statuses (id, name, color, is_default, created_at, updated_at, dirty)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(id, args.name, args.color ?? '#6b7280', args.is_default ? 1 : 0, now, now);
    return db.prepare('SELECT * FROM vehicle_statuses WHERE id = ?').get(id);
  });

  ipcMain.handle('db:vehicleStatuses:update', (_e, args: Record<string, unknown> & { id: string }) => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];
    const updateable = ['name', 'color', 'is_default'] as const;
    for (const field of updateable) {
      if (field in args) {
        fields.push(`${field} = ?`);
        values.push(field === 'is_default' ? (args[field] ? 1 : 0) : args[field]);
      }
    }
    fields.push('updated_at = ?', 'dirty = 1');
    values.push(now, args.id);
    db.prepare(`UPDATE vehicle_statuses SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return db.prepare('SELECT * FROM vehicle_statuses WHERE id = ?').get(args.id);
  });

  ipcMain.handle('db:vehicleStatuses:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    db.prepare('UPDATE vehicle_statuses SET deleted_at = ?, dirty = 1 WHERE id = ?').run(now, args.id);
  });

  // ── Contracts CRUD ──
  ipcMain.handle('db:contracts:getAll', () => {
    return db.prepare('SELECT * FROM contracts WHERE deleted_at IS NULL ORDER BY created_at DESC').all();
  });

  ipcMain.handle('db:contracts:getById', (_e, args: { id: string }) => {
    return db.prepare('SELECT * FROM contracts WHERE id = ? AND deleted_at IS NULL').get(args.id) ?? null;
  });

  ipcMain.handle('db:contracts:getByRental', (_e, args: { rentalId: string }) => {
    return db.prepare('SELECT * FROM contracts WHERE rental_id = ? AND deleted_at IS NULL').get(args.rentalId) ?? null;
  });

  ipcMain.handle('db:contracts:create', (_e, args: Record<string, unknown>) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO contracts (id, rental_id, created_at, updated_at, dirty)
      VALUES (?, ?, ?, ?, 1)
    `).run(id, args.rental_id, now, now);
    return db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
  });

  ipcMain.handle('db:contracts:update', (_e, args: Record<string, unknown> & { id: string }) => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];
    const updateable = ['rental_id'] as const;
    for (const field of updateable) {
      if (field in args) {
        fields.push(`${field} = ?`);
        values.push(args[field]);
      }
    }
    fields.push('updated_at = ?', 'dirty = 1');
    values.push(now, args.id);
    db.prepare(`UPDATE contracts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return db.prepare('SELECT * FROM contracts WHERE id = ?').get(args.id);
  });

  ipcMain.handle('db:contracts:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    db.prepare('UPDATE contracts SET deleted_at = ?, dirty = 1 WHERE id = ?').run(now, args.id);
  });

  // ── Documents CRUD ──
  ipcMain.handle('db:documents:getAll', () => {
    return db.prepare('SELECT * FROM documents WHERE deleted_at IS NULL ORDER BY created_at DESC').all();
  });

  ipcMain.handle('db:documents:getByParent', (_e, args: { parentId: string; originType: string }) => {
    return db.prepare('SELECT * FROM documents WHERE parent_id = ? AND origin_type = ? AND deleted_at IS NULL ORDER BY created_at DESC').all(args.parentId, args.originType);
  });

  ipcMain.handle('db:documents:create', (_e, args: Record<string, unknown>) => {
    const now = new Date().toISOString();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO documents (id, parent_id, origin_type, file_url, created_at, updated_at, dirty)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(id, args.parent_id, args.origin_type, args.file_url, now, now);
    return db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  });

  ipcMain.handle('db:documents:delete', (_e, args: { id: string }) => {
    const now = new Date().toISOString();
    db.prepare('UPDATE documents SET deleted_at = ?, dirty = 1 WHERE id = ?').run(now, args.id);
  });

  // ── Roles CRUD ──
  ipcMain.handle('db:roles:getAll', () => {
    return db.prepare("SELECT * FROM roles WHERE deleted_at IS NULL ORDER BY name").all()
      .map((r: any) => ({ ...r, permissions: JSON.parse(r.permissions) }));
  });

  ipcMain.handle('db:roles:create', (_e, args: any) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare("INSERT INTO roles (id, workshop_id, name, permissions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(
      id, args.workshop_id ?? null, args.name, JSON.stringify(args.permissions), now, now
    );
    const r: any = db.prepare("SELECT * FROM roles WHERE id = ?").get(id);
    return { ...r, permissions: JSON.parse(r.permissions) };
  });

  ipcMain.handle('db:roles:update', (_e, args: any) => {
    const now = new Date().toISOString();
    db.prepare("UPDATE roles SET workshop_id = ?, name = ?, permissions = ?, updated_at = ? WHERE id = ?").run(
      args.workshop_id ?? null, args.name, JSON.stringify(args.permissions), now, args.id
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
