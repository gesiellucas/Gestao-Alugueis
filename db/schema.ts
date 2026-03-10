import { foreignKey, index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
  tableName: text('table_name').primaryKey(),
  lastSyncAt: text('last_sync_at'),
});

// ---------------------------------------------------------------------------
// workshops — oficinas (compartilhado entre usuários)
// ---------------------------------------------------------------------------
export const workshops = sqliteTable('workshops', {
  id: text().primaryKey(),
  name: text().notNull(),
  address: text(),
  status: text().notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  dirty: integer().notNull().default(1),
  deletedAt: text('deleted_at'),
});

// ---------------------------------------------------------------------------
// vehicle_statuses — status de veículos configuráveis
// ---------------------------------------------------------------------------
export const vehicleStatuses = sqliteTable('vehicle_statuses', {
  id: text().primaryKey(),
  name: text().notNull(),
  color: text().notNull().default('#6b7280'),
  isDefault: integer('is_default').notNull().default(0), // 0 | 1 (boolean)
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  dirty: integer().notNull().default(1),
  deletedAt: text('deleted_at'),
});

// ---------------------------------------------------------------------------
// roles — perfis de acesso (pode ser vinculado a uma oficina)
// ---------------------------------------------------------------------------
export const roles = sqliteTable('roles', {
  id: text().primaryKey(),
  workshopId: text('workshop_id'),
  name: text().notNull(),
  permissions: text().notNull(), // JSON.stringify(string[])
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
}, (table) => [
  foreignKey({ columns: [table.workshopId], foreignColumns: [workshops.id] }),
]);

// ---------------------------------------------------------------------------
// app_users — usuários locais (senha armazenada localmente, NÃO sincronizada)
// ---------------------------------------------------------------------------
export const appUsers = sqliteTable('app_users', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull(),
  password: text().notNull(),
  roleId: text('role_id').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
}, (table) => [
  foreignKey({ columns: [table.roleId], foreignColumns: [roles.id] }),
]);

// ---------------------------------------------------------------------------
// customers — clientes (isolado por user_id)
// ---------------------------------------------------------------------------
export const customers = sqliteTable('customers', {
  id: text().primaryKey(),
  userId: text('user_id').notNull(),
  name: text().notNull(),
  phone: text(),
  cpf: text(),
  activeContract: integer('active_contract').notNull().default(0), // 0 | 1 (boolean)
  balanceDue: real('balance_due').notNull().default(0),
  lastPaymentDate: text('last_payment_date'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  dirty: integer().notNull().default(1),
  deletedAt: text('deleted_at'),
}, (table) => [
  index('idx_customers_user_id').on(table.userId),
  index('idx_customers_cpf').on(table.cpf),
]);

// ---------------------------------------------------------------------------
// vehicle_models — modelos de veículos (compartilhado)
// ---------------------------------------------------------------------------
export const vehicleModels = sqliteTable('vehicle_models', {
  id: text().primaryKey(),
  name: text().notNull(),
  brand: text().notNull(),
  imageUrl: text('image_url'),
  status: text().notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  dirty: integer().notNull().default(1),
  deletedAt: text('deleted_at'),
});

// ---------------------------------------------------------------------------
// vehicles — veículos (compartilhado, sem user_id)
// ---------------------------------------------------------------------------
export const vehicles = sqliteTable('vehicles', {
  id: text().primaryKey(),
  plate: text().notNull(),
  modelId: text('model_id'),
  year: integer().notNull(),
  statusId: text('status_id').notNull(),
  mileage: integer().notNull().default(0),
  currentRenterId: text('current_renter_id'),
  defaultMonthlyRate: real('default_monthly_rate').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  dirty: integer().notNull().default(1),
  deletedAt: text('deleted_at'),
}, (table) => [
  index('idx_vehicles_plate').on(table.plate),
  index('idx_vehicles_status_id').on(table.statusId),
  foreignKey({ columns: [table.modelId], foreignColumns: [vehicleModels.id] }),
  foreignKey({ columns: [table.statusId], foreignColumns: [vehicleStatuses.id] }),
  foreignKey({ columns: [table.currentRenterId], foreignColumns: [customers.id] }),
]);

// ---------------------------------------------------------------------------
// rentals — contratos de aluguel (isolado por user_id)
// ---------------------------------------------------------------------------
export const rentals = sqliteTable('rentals', {
  id: text().primaryKey(),
  userId: text('user_id').notNull(),
  vehicleId: text('vehicle_id').notNull(),
  customerId: text('customer_id').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  monthlyRate: real('monthly_rate').notNull(),
  status: text().notNull().default('ACTIVE'), // 'ACTIVE' | 'ENDED'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  dirty: integer().notNull().default(1),
  deletedAt: text('deleted_at'),
}, (table) => [
  index('idx_rentals_user_id').on(table.userId),
  index('idx_rentals_vehicle_id').on(table.vehicleId),
  index('idx_rentals_customer_id').on(table.customerId),
  foreignKey({ columns: [table.vehicleId], foreignColumns: [vehicles.id] }),
  foreignKey({ columns: [table.customerId], foreignColumns: [customers.id] }),
]);

// ---------------------------------------------------------------------------
// contracts — documentos de contrato (1:0..1 com rentals)
// ---------------------------------------------------------------------------
export const contracts = sqliteTable('contracts', {
  id: text().primaryKey(),
  rentalId: text('rental_id').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  dirty: integer().notNull().default(1),
  deletedAt: text('deleted_at'),
}, (table) => [
  index('idx_contracts_rental_id').on(table.rentalId),
  foreignKey({ columns: [table.rentalId], foreignColumns: [rentals.id] }),
]);

// ---------------------------------------------------------------------------
// maintenance_records — registros de manutenção (isolado por user_id)
// ---------------------------------------------------------------------------
export const maintenanceRecords = sqliteTable('maintenance_records', {
  id: text().primaryKey(),
  userId: text('user_id').notNull(),
  vehicleId: text('vehicle_id').notNull(),
  workshopId: text('workshop_id'),
  vehiclePlate: text('vehicle_plate').notNull(),
  entryDate: text('entry_date').notNull(),
  completionDate: text('completion_date'),
  mechanicName: text('mechanic_name').notNull(),
  description: text().notNull(),
  type: text().notNull(),
  cost: real().notNull().default(0),
  status: text().notNull().default('OPEN'), // 'OPEN' | 'COMPLETED'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  dirty: integer().notNull().default(1),
  deletedAt: text('deleted_at'),
}, (table) => [
  index('idx_maintenance_user_id').on(table.userId),
  index('idx_maintenance_vehicle_id').on(table.vehicleId),
  index('idx_maintenance_workshop_id').on(table.workshopId),
  foreignKey({ columns: [table.vehicleId], foreignColumns: [vehicles.id] }),
  foreignKey({ columns: [table.workshopId], foreignColumns: [workshops.id] }),
]);

// ---------------------------------------------------------------------------
// documents — arquivos anexados a contratos ou oficinas (polimórfico)
// ---------------------------------------------------------------------------
export const documents = sqliteTable('documents', {
  id: text().primaryKey(),
  parentId: text('parent_id').notNull(),
  originType: text('origin_type').notNull(), // 'CONTRACT' | 'WORKSHOP'
  fileUrl: text('file_url').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  dirty: integer().notNull().default(1),
  deletedAt: text('deleted_at'),
}, (table) => [
  index('idx_documents_parent').on(table.parentId, table.originType),
]);
