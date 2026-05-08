import { boolean, foreignKey, index, integer, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Schema PostgreSQL (Supabase) — gerado pelo drizzle-kit para migrações
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

// Helper para colunas de metadados de sync
const syncMetadataColumns = {
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updated_by: text('updated_by'),
  device_id: text('device_id').notNull(),
  version: integer('version').notNull().default(1),
  is_deleted: integer('is_deleted').notNull().default(0),
  sync_status: text('sync_status').notNull().default('pending'),
};

// ---------------------------------------------------------------------------
// workshops
// ---------------------------------------------------------------------------
export const workshops = pgTable('workshops', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE'
  ...syncMetadataColumns,
});

// ---------------------------------------------------------------------------
// vehicle_statuses
// ---------------------------------------------------------------------------
export const vehicleStatuses = pgTable('vehicle_statuses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().default(''),
  color: text('color').notNull().default('#6b7280'),
  is_default: boolean('is_default').notNull().default(false),
  ...syncMetadataColumns,
});

// ---------------------------------------------------------------------------
// roles
// ---------------------------------------------------------------------------
export const roles = pgTable('roles', {
  id: text('id').primaryKey(),
  workshop_id: text('workshop_id'),
  name: text('name').notNull(),
  permissions: text('permissions').notNull(), // JSON.stringify(string[])
  ...syncMetadataColumns,
}, (table) => [
  foreignKey({ columns: [table.workshop_id], foreignColumns: [workshops.id] }),
]);

// ---------------------------------------------------------------------------
// app_users — sem campo password (autenticação via Supabase Auth)
// ---------------------------------------------------------------------------
export const appUsers = pgTable('app_users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  password: text('password').notNull(),
  role_id: text('role_id').notNull(),
  ...syncMetadataColumns,
}, (table) => [
  foreignKey({ columns: [table.role_id], foreignColumns: [roles.id] }),
]);

// ---------------------------------------------------------------------------
// customers
// ---------------------------------------------------------------------------
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  cpf: text('cpf'),
  active_contract: boolean('active_contract').notNull().default(false),
  balance_due: numeric('balance_due', { precision: 10, scale: 2 }).notNull().default('0'),
  last_payment_date: text('last_payment_date'),
  ...syncMetadataColumns,
}, (table) => [
  index('idx_customers_user_id').on(table.user_id),
  index('idx_customers_cpf').on(table.cpf),
]);

// ---------------------------------------------------------------------------
// vehicle_models
// ---------------------------------------------------------------------------
export const vehicleModels = pgTable('vehicle_models', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  image_url: text('image_url'),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE'
  ...syncMetadataColumns,
});

// ---------------------------------------------------------------------------
// vehicles
// ---------------------------------------------------------------------------
export const vehicles = pgTable('vehicles', {
  id: text('id').primaryKey(),
  plate: text('plate').notNull(),
  model_id: text('model_id'),
  year: numeric('year').notNull(),
  status_id: text('status_id').notNull(),
  mileage: numeric('mileage').notNull().default('0'),
  current_renter_id: text('current_renter_id'),
  default_monthly_rate: numeric('default_monthly_rate', { precision: 10, scale: 2 }).notNull().default('0'),
  image_url: text('image_url'),
  ...syncMetadataColumns,
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
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  vehicle_id: text('vehicle_id').notNull(),
  customer_id: text('customer_id').notNull(),
  start_date: text('start_date').notNull(),
  end_date: text('end_date'),
  monthly_rate: numeric('monthly_rate', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'ENDED'
  ...syncMetadataColumns,
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
  id: text('id').primaryKey(),
  rental_id: text('rental_id').notNull(),
  ...syncMetadataColumns,
}, (table) => [
  index('idx_contracts_rental_id').on(table.rental_id),
  foreignKey({ columns: [table.rental_id], foreignColumns: [rentals.id] }),
]);

// ---------------------------------------------------------------------------
// maintenance_records
// ---------------------------------------------------------------------------
export const maintenanceRecords = pgTable('maintenance_records', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  vehicle_id: text('vehicle_id').notNull(),
  workshop_id: text('workshop_id'),
  vehicle_plate: text('vehicle_plate').notNull(),
  entry_date: text('entry_date').notNull(),
  completion_date: text('completion_date'),
  mechanic_name: text('mechanic_name').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('OPEN'), // 'OPEN' | 'COMPLETED'
  service_order_url: text('service_order_url'),
  ...syncMetadataColumns,
}, (table) => [
  index('idx_maintenance_user_id').on(table.user_id),
  index('idx_maintenance_vehicle_id').on(table.vehicle_id),
  index('idx_maintenance_workshop_id').on(table.workshop_id),
  foreignKey({ columns: [table.vehicle_id], foreignColumns: [vehicles.id] }),
  foreignKey({ columns: [table.workshop_id], foreignColumns: [workshops.id] }),
]);

// ---------------------------------------------------------------------------
// unavailable_vehicles
// ---------------------------------------------------------------------------
export const unavailableVehicles = pgTable('unavailable_vehicles', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  vehicle_id: text('vehicle_id').notNull(),
  status_type: text('status_type').notNull(), // 'STOLEN' | 'TOTAL_LOSS'
  reason: text('reason').notNull(),
  ...syncMetadataColumns,
}, (table) => [
  index('idx_unavailable_vehicles_user_id').on(table.user_id),
  index('idx_unavailable_vehicles_vehicle_id').on(table.vehicle_id),
  foreignKey({ columns: [table.vehicle_id], foreignColumns: [vehicles.id] }),
]);

// ---------------------------------------------------------------------------
// documents
// ---------------------------------------------------------------------------
export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  parent_id: text('parent_id').notNull(),
  origin_type: text('origin_type').notNull(), // 'CONTRACT' | 'WORKSHOP' | 'UNAVAILABLE_VEHICLE'
  file_url: text('file_url').notNull(),
  ...syncMetadataColumns,
}, (table) => [
  index('idx_documents_parent').on(table.parent_id, table.origin_type),
]);

