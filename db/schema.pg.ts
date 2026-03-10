import { boolean, foreignKey, index, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Schema PostgreSQL (Supabase) — gerado pelo drizzle-kit para migrações
//
// IMPORTANTE: Mantenha os nomes de tabela e coluna idênticos ao db/schema.ts.
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
  id: text().primaryKey(),
  name: text().notNull(),
  address: text(),
  status: text().notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// vehicle_statuses
// ---------------------------------------------------------------------------
export const vehicleStatuses = pgTable('vehicle_statuses', {
  id: text().primaryKey(),
  name: text().notNull(),
  color: text().notNull().default('#6b7280'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// roles
// ---------------------------------------------------------------------------
export const roles = pgTable('roles', {
  id: text().primaryKey(),
  workshopId: text('workshop_id'),
  name: text().notNull(),
  permissions: text().notNull(), // JSON.stringify(string[])
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  foreignKey({ columns: [table.workshopId], foreignColumns: [workshops.id] }),
]);

// ---------------------------------------------------------------------------
// app_users — sem campo password (autenticação via Supabase Auth)
// ---------------------------------------------------------------------------
export const appUsers = pgTable('app_users', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  roleId: text('role_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  foreignKey({ columns: [table.roleId], foreignColumns: [roles.id] }),
]);

// ---------------------------------------------------------------------------
// customers
// ---------------------------------------------------------------------------
export const customers = pgTable('customers', {
  id: text().primaryKey(),
  userId: text('user_id').notNull(),
  name: text().notNull(),
  phone: text(),
  cpf: text().unique(),
  activeContract: boolean('active_contract').notNull().default(false),
  balanceDue: numeric('balance_due', { precision: 10, scale: 2 }).notNull().default('0'),
  lastPaymentDate: text('last_payment_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_customers_user_id').on(table.userId),
  index('idx_customers_cpf').on(table.cpf),
]);

// ---------------------------------------------------------------------------
// vehicle_models
// ---------------------------------------------------------------------------
export const vehicleModels = pgTable('vehicle_models', {
  id: text().primaryKey(),
  name: text().notNull(),
  brand: text().notNull(),
  imageUrl: text('image_url'),
  status: text().notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// vehicles
// ---------------------------------------------------------------------------
export const vehicles = pgTable('vehicles', {
  id: text().primaryKey(),
  plate: text().notNull().unique(),
  modelId: text('model_id'),
  year: numeric('year').notNull(),
  statusId: text('status_id').notNull(),
  mileage: numeric().notNull().default('0'),
  currentRenterId: text('current_renter_id'),
  defaultMonthlyRate: numeric('default_monthly_rate', { precision: 10, scale: 2 }).notNull().default('0'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_vehicles_plate').on(table.plate),
  index('idx_vehicles_status_id').on(table.statusId),
  foreignKey({ columns: [table.modelId], foreignColumns: [vehicleModels.id] }),
  foreignKey({ columns: [table.statusId], foreignColumns: [vehicleStatuses.id] }),
  foreignKey({ columns: [table.currentRenterId], foreignColumns: [customers.id] }),
]);

// ---------------------------------------------------------------------------
// rentals
// ---------------------------------------------------------------------------
export const rentals = pgTable('rentals', {
  id: text().primaryKey(),
  userId: text('user_id').notNull(),
  vehicleId: text('vehicle_id').notNull(),
  customerId: text('customer_id').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  monthlyRate: numeric('monthly_rate', { precision: 10, scale: 2 }).notNull(),
  status: text().notNull().default('ACTIVE'), // 'ACTIVE' | 'ENDED'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_rentals_user_id').on(table.userId),
  index('idx_rentals_vehicle_id').on(table.vehicleId),
  index('idx_rentals_customer_id').on(table.customerId),
  foreignKey({ columns: [table.vehicleId], foreignColumns: [vehicles.id] }),
  foreignKey({ columns: [table.customerId], foreignColumns: [customers.id] }),
]);

// ---------------------------------------------------------------------------
// contracts
// ---------------------------------------------------------------------------
export const contracts = pgTable('contracts', {
  id: text().primaryKey(),
  rentalId: text('rental_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_contracts_rental_id').on(table.rentalId),
  foreignKey({ columns: [table.rentalId], foreignColumns: [rentals.id] }),
]);

// ---------------------------------------------------------------------------
// maintenance_records
// ---------------------------------------------------------------------------
export const maintenanceRecords = pgTable('maintenance_records', {
  id: text().primaryKey(),
  userId: text('user_id'),
  vehicleId: text('vehicle_id').notNull(),
  workshopId: text('workshop_id'),
  vehiclePlate: text('vehicle_plate').notNull(),
  entryDate: text('entry_date').notNull(),
  completionDate: text('completion_date'),
  mechanicName: text('mechanic_name').notNull(),
  description: text().notNull(),
  type: text().notNull(),
  cost: numeric({ precision: 10, scale: 2 }).notNull().default('0'),
  status: text().notNull().default('OPEN'), // 'OPEN' | 'COMPLETED'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_maintenance_user_id').on(table.userId),
  index('idx_maintenance_vehicle_id').on(table.vehicleId),
  index('idx_maintenance_workshop_id').on(table.workshopId),
  foreignKey({ columns: [table.vehicleId], foreignColumns: [vehicles.id] }),
  foreignKey({ columns: [table.workshopId], foreignColumns: [workshops.id] }),
]);

// ---------------------------------------------------------------------------
// documents
// ---------------------------------------------------------------------------
export const documents = pgTable('documents', {
  id: text().primaryKey(),
  parentId: text('parent_id').notNull(),
  originType: text('origin_type').notNull(), // 'CONTRACT' | 'WORKSHOP'
  fileUrl: text('file_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_documents_parent').on(table.parentId, table.originType),
]);
