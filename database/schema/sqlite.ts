import { foreignKey, index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// config — chave/valor para credenciais Supabase e configurações locais
// ---------------------------------------------------------------------------
export const config = sqliteTable('config', {
  key: text().primaryKey(),
  value: text().notNull(),
});

// ---------------------------------------------------------------------------
// sync_metadata — controla o último timestamp de pull por tabela
// ---------------------------------------------------------------------------
export const syncMetadata = sqliteTable('sync_metadata', {
  table_name: text('table_name').primaryKey(),
  last_sync_at: text('last_sync_at'),
});

// Helper para colunas de metadados de sync
const syncMetadataColumns = {
  created_at: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  updated_at: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  updated_by: text('updated_by'),
  device_id: text('device_id').notNull(),
  version: integer('version').notNull().default(1),
  is_deleted: integer('is_deleted').notNull().default(0),
  sync_status: text('sync_status').notNull().default('pending'),
};

// ---------------------------------------------------------------------------
// workshops — oficinas (compartilhado entre usuários)
// ---------------------------------------------------------------------------
export const workshops = sqliteTable('workshops', {
  id: text('id').primaryKey(),
  name: text().notNull(),
  address: text(),
  status: text().notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE'
  ...syncMetadataColumns,
});

// ---------------------------------------------------------------------------
// vehicle_statuses — status de veículos configuráveis
// ---------------------------------------------------------------------------
export const vehicleStatuses = sqliteTable('vehicle_statuses', {
  id: text('id').primaryKey(),
  name: text().notNull(),
  color: text().notNull().default('#6b7280'),
  is_default: integer('is_default').notNull().default(0), // 0 | 1 (boolean)
  ...syncMetadataColumns,
});

// ---------------------------------------------------------------------------
// roles — perfis de acesso (pode ser vinculado a uma oficina)
// ---------------------------------------------------------------------------
export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(),
  workshop_id: text('workshop_id'),
  name: text().notNull(),
  permissions: text().notNull(), // JSON.stringify(string[])
  ...syncMetadataColumns,
}, (table) => [
  foreignKey({ columns: [table.workshop_id], foreignColumns: [workshops.id] }),
]);

// ---------------------------------------------------------------------------
// app_users — usuários locais (senha armazenada localmente, NÃO sincronizada)
// ---------------------------------------------------------------------------
export const appUsers = sqliteTable('app_users', {
  id: text('id').primaryKey(),
  name: text().notNull(),
  email: text().notNull(),
  password: text().notNull(),
  role_id: text('role_id').notNull(),
  ...syncMetadataColumns,
}, (table) => [
  foreignKey({ columns: [table.role_id], foreignColumns: [roles.id] }),
]);

// ---------------------------------------------------------------------------
// customers — clientes (isolado por user_id)
// ---------------------------------------------------------------------------
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  name: text().notNull(),
  phone: text(),
  cpf: text(),
  active_contract: integer('active_contract').notNull().default(0), // 0 | 1 (boolean)
  balance_due: real('balance_due').notNull().default(0),
  last_payment_date: text('last_payment_date'),
  ...syncMetadataColumns,
}, (table) => [
  index('idx_customers_user_id').on(table.user_id),
  index('idx_customers_cpf').on(table.cpf),
]);

// ---------------------------------------------------------------------------
// vehicle_models — modelos de veículos (compartilhado)
// ---------------------------------------------------------------------------
export const vehicleModels = sqliteTable('vehicle_models', {
  id: text('id').primaryKey(),
  name: text().notNull(),
  brand: text().notNull(),
  image_url: text('image_url'),
  status: text().notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE'
  ...syncMetadataColumns,
});

// ---------------------------------------------------------------------------
// vehicles — veículos (compartilhado, sem user_id)
// ---------------------------------------------------------------------------
export const vehicles = sqliteTable('vehicles', {
  id: text('id').primaryKey(),
  plate: text().notNull(),
  model_id: text('model_id'),
  year: integer().notNull(),
  status_id: text('status_id').notNull(),
  mileage: integer().notNull().default(0),
  current_renter_id: text('current_renter_id'),
  default_monthly_rate: real('default_monthly_rate').notNull().default(0),
  ...syncMetadataColumns,
}, (table) => [
  index('idx_vehicles_plate').on(table.plate),
  index('idx_vehicles_status_id').on(table.status_id),
  foreignKey({ columns: [table.model_id], foreignColumns: [vehicleModels.id] }),
  foreignKey({ columns: [table.status_id], foreignColumns: [vehicleStatuses.id] }),
  foreignKey({ columns: [table.current_renter_id], foreignColumns: [customers.id] }),
]);

// ---------------------------------------------------------------------------
// rentals — contratos de aluguel (isolado por user_id)
// ---------------------------------------------------------------------------
export const rentals = sqliteTable('rentals', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  vehicle_id: text('vehicle_id').notNull(),
  customer_id: text('customer_id').notNull(),
  start_date: text('start_date').notNull(),
  end_date: text('end_date'),
  monthly_rate: real('monthly_rate').notNull(),
  status: text().notNull().default('ACTIVE'), // 'ACTIVE' | 'ENDED'
  ...syncMetadataColumns,
}, (table) => [
  index('idx_rentals_user_id').on(table.user_id),
  index('idx_rentals_vehicle_id').on(table.vehicle_id),
  index('idx_rentals_customer_id').on(table.customer_id),
  foreignKey({ columns: [table.vehicle_id], foreignColumns: [vehicles.id] }),
  foreignKey({ columns: [table.customer_id], foreignColumns: [customers.id] }),
]);

// ---------------------------------------------------------------------------
// contracts — documentos de contrato (1:0..1 com rentals)
// ---------------------------------------------------------------------------
export const contracts = sqliteTable('contracts', {
  id: text('id').primaryKey(),
  rental_id: text('rental_id').notNull(),
  ...syncMetadataColumns,
}, (table) => [
  index('idx_contracts_rental_id').on(table.rental_id),
  foreignKey({ columns: [table.rental_id], foreignColumns: [rentals.id] }),
]);

// ---------------------------------------------------------------------------
// maintenance_records — registros de manutenção (isolado por user_id)
// ---------------------------------------------------------------------------
export const maintenanceRecords = sqliteTable('maintenance_records', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull(),
  vehicle_id: text('vehicle_id').notNull(),
  workshop_id: text('workshop_id'),
  vehicle_plate: text('vehicle_plate').notNull(),
  entry_date: text('entry_date').notNull(),
  completion_date: text('completion_date'),
  mechanic_name: text('mechanic_name').notNull(),
  description: text().notNull(),
  type: text().notNull(),
  cost: real().notNull().default(0),
  status: text().notNull().default('OPEN'), // 'OPEN' | 'COMPLETED'
  ...syncMetadataColumns,
}, (table) => [
  index('idx_maintenance_user_id').on(table.user_id),
  index('idx_maintenance_vehicle_id').on(table.vehicle_id),
  index('idx_maintenance_workshop_id').on(table.workshop_id),
  foreignKey({ columns: [table.vehicle_id], foreignColumns: [vehicles.id] }),
  foreignKey({ columns: [table.workshop_id], foreignColumns: [workshops.id] }),
]);

// ---------------------------------------------------------------------------
// documents — arquivos anexados a contratos ou oficinas (polimórfico)
// ---------------------------------------------------------------------------
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  parent_id: text('parent_id').notNull(),
  origin_type: text('origin_type').notNull(), // 'CONTRACT' | 'WORKSHOP'
  file_url: text('file_url').notNull(),
  ...syncMetadataColumns,
}, (table) => [
  index('idx_documents_parent').on(table.parent_id, table.origin_type),
]);

