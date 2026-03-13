import { bigint, bigserial, boolean, foreignKey, index, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Schema PostgreSQL (Supabase) — gerado pelo drizzle-kit para migrações
//
// IMPORTANTE: Mantenha os nomes de tabela e coluna idênticos ao database/schema/sqlite.ts.
// Diferenças de tipo são esperadas (ex: boolean vs integer, timestamp vs text).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// config
// ---------------------------------------------------------------------------
export const config = pgTable('config', {
  key: text().primaryKey(),
  value: text().notNull(),
});

// ---------------------------------------------------------------------------
// sync_metadata
// ---------------------------------------------------------------------------
export const syncMetadata = pgTable('sync_metadata', {
  tableName: text('table_name').primaryKey(),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// workshops
// ---------------------------------------------------------------------------
export const workshops = pgTable('workshops', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE'
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// vehicle_statuses
// ---------------------------------------------------------------------------
export const vehicleStatuses = pgTable('vehicle_statuses', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6b7280'),
  is_default: boolean('is_default').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// roles
// ---------------------------------------------------------------------------
export const roles = pgTable('roles', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  workshop_id: bigint('workshop_id', { mode: 'number' }),
  name: text('name').notNull(),
  permissions: text('permissions').notNull(), // JSON.stringify(string[])
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.workshop_id], foreignColumns: [workshops.id] }),
]);

// ---------------------------------------------------------------------------
// app_users — sem campo password (autenticação via Supabase Auth)
// ---------------------------------------------------------------------------
export const appUsers = pgTable('app_users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  password: text('password').notNull(),
  role_id: bigint('role_id', { mode: 'number' }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.role_id], foreignColumns: [roles.id] }),
]);

// ---------------------------------------------------------------------------
// customers
// ---------------------------------------------------------------------------
export const customers = pgTable('customers', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  user_id: bigint('user_id', { mode: 'number' }).notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  cpf: text('cpf'),
  active_contract: boolean('active_contract').notNull().default(false),
  balance_due: numeric('balance_due', { precision: 10, scale: 2 }).notNull().default('0'),
  last_payment_date: text('last_payment_date'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_customers_user_id').on(table.user_id),
  index('idx_customers_cpf').on(table.cpf),
]);

// ---------------------------------------------------------------------------
// vehicle_models
// ---------------------------------------------------------------------------
export const vehicleModels = pgTable('vehicle_models', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  image_url: text('image_url'),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE'
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// vehicles
// ---------------------------------------------------------------------------
export const vehicles = pgTable('vehicles', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  plate: text('plate').notNull(),
  model_id: bigint('model_id', { mode: 'number' }),
  year: numeric('year').notNull(),
  status_id: bigint('status_id', { mode: 'number' }).notNull(),
  mileage: numeric('mileage').notNull().default('0'),
  current_renter_id: bigint('current_renter_id', { mode: 'number' }),
  default_monthly_rate: numeric('default_monthly_rate', { precision: 10, scale: 2 }).notNull().default('0'),
  image_url: text('image_url'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_vehicles_plate').on(table.plate),
  index('idx_vehicles_status_id').on(table.status_id),
  foreignKey({ columns: [table.model_id], foreignColumns: [vehicleModels.id] }),
  foreignKey({ columns: [table.status_id], foreignColumns: [vehicleStatuses.id] }),
  foreignKey({ columns: [table.current_renter_id], foreignColumns: [customers.id] }),
]);

// ---------------------------------------------------------------------------
// rentals
// ---------------------------------------------------------------------------
export const rentals = pgTable('rentals', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  user_id: bigint('user_id', { mode: 'number' }).notNull(),
  vehicle_id: bigint('vehicle_id', { mode: 'number' }).notNull(),
  customer_id: bigint('customer_id', { mode: 'number' }).notNull(),
  start_date: text('start_date').notNull(),
  end_date: text('end_date'),
  monthly_rate: numeric('monthly_rate', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'ENDED'
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_rentals_user_id').on(table.user_id),
  index('idx_rentals_vehicle_id').on(table.vehicle_id),
  index('idx_rentals_customer_id').on(table.customer_id),
  foreignKey({ columns: [table.vehicle_id], foreignColumns: [vehicles.id] }),
  foreignKey({ columns: [table.customer_id], foreignColumns: [customers.id] }),
]);

// ---------------------------------------------------------------------------
// contracts
// ---------------------------------------------------------------------------
export const contracts = pgTable('contracts', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  rental_id: bigint('rental_id', { mode: 'number' }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_contracts_rental_id').on(table.rental_id),
  foreignKey({ columns: [table.rental_id], foreignColumns: [rentals.id] }),
]);

// ---------------------------------------------------------------------------
// maintenance_records
// ---------------------------------------------------------------------------
export const maintenanceRecords = pgTable('maintenance_records', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  user_id: bigint('user_id', { mode: 'number' }),
  vehicle_id: bigint('vehicle_id', { mode: 'number' }).notNull(),
  workshop_id: bigint('workshop_id', { mode: 'number' }),
  vehicle_plate: text('vehicle_plate').notNull(),
  entry_date: text('entry_date').notNull(),
  completion_date: text('completion_date'),
  mechanic_name: text('mechanic_name').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('OPEN'), // 'OPEN' | 'COMPLETED'
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull(),
}, (table) => [
  index('idx_maintenance_user_id').on(table.user_id),
  index('idx_maintenance_vehicle_id').on(table.vehicle_id),
  index('idx_maintenance_workshop_id').on(table.workshop_id),
  foreignKey({ columns: [table.vehicle_id], foreignColumns: [vehicles.id] }),
  foreignKey({ columns: [table.workshop_id], foreignColumns: [workshops.id] }),
]);

// ---------------------------------------------------------------------------
// documents
// ---------------------------------------------------------------------------
export const documents = pgTable('documents', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  parent_id: bigint('parent_id', { mode: 'number' }).notNull(),
  origin_type: text('origin_type').notNull(), // 'CONTRACT' | 'WORKSHOP'
  file_url: text('file_url').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_documents_parent').on(table.parent_id, table.origin_type),
]);
