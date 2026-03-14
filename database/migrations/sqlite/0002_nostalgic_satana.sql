PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_app_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role_id` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_by` text,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_app_users`("id", "name", "email", "password", "role_id", "created_at", "updated_at", "device_id") SELECT CAST("id" AS TEXT), "name", "email", "password", CAST("role_id" AS TEXT), "created_at", "updated_at", 'migration' FROM `app_users`;--> statement-breakpoint
DROP TABLE `app_users`;--> statement-breakpoint
ALTER TABLE `__new_app_users` RENAME TO `app_users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`rental_id` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_by` text,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_contracts`("id", "rental_id", "created_at", "updated_at", "device_id") SELECT CAST("id" AS TEXT), CAST("rental_id" AS TEXT), "created_at", "updated_at", 'migration' FROM `contracts`;--> statement-breakpoint
DROP TABLE `contracts`;--> statement-breakpoint
ALTER TABLE `__new_contracts` RENAME TO `contracts`;--> statement-breakpoint
CREATE INDEX `idx_contracts_rental_id` ON `contracts` (`rental_id`);--> statement-breakpoint
CREATE TABLE `__new_customers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`cpf` text,
	`active_contract` integer DEFAULT 0 NOT NULL,
	`balance_due` real DEFAULT 0 NOT NULL,
	`last_payment_date` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_by` text,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_customers`("id", "user_id", "name", "phone", "cpf", "active_contract", "balance_due", "last_payment_date", "created_at", "updated_at", "device_id") SELECT CAST("id" AS TEXT), CAST("user_id" AS TEXT), "name", "phone", "cpf", "active_contract", "balance_due", "last_payment_date", "created_at", "updated_at", 'migration' FROM `customers`;--> statement-breakpoint
DROP TABLE `customers`;--> statement-breakpoint
ALTER TABLE `__new_customers` RENAME TO `customers`;--> statement-breakpoint
CREATE INDEX `idx_customers_user_id` ON `customers` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_customers_cpf` ON `customers` (`cpf`);--> statement-breakpoint
CREATE TABLE `__new_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text NOT NULL,
	`origin_type` text NOT NULL,
	`file_url` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_by` text,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_documents`("id", "parent_id", "origin_type", "file_url", "created_at", "updated_at", "device_id") SELECT CAST("id" AS TEXT), CAST("parent_id" AS TEXT), "origin_type", "file_url", "created_at", "updated_at", 'migration' FROM `documents`;--> statement-breakpoint
DROP TABLE `documents`;--> statement-breakpoint
ALTER TABLE `__new_documents` RENAME TO `documents`;--> statement-breakpoint
CREATE INDEX `idx_documents_parent` ON `documents` (`parent_id`,`origin_type`);--> statement-breakpoint
CREATE TABLE `__new_maintenance_records` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`vehicle_id` text NOT NULL,
	`workshop_id` text,
	`vehicle_plate` text NOT NULL,
	`entry_date` text NOT NULL,
	`completion_date` text,
	`mechanic_name` text NOT NULL,
	`description` text NOT NULL,
	`type` text NOT NULL,
	`cost` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_by` text,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_maintenance_records`("id", "user_id", "vehicle_id", "workshop_id", "vehicle_plate", "entry_date", "completion_date", "mechanic_name", "description", "type", "cost", "status", "created_at", "updated_at", "device_id") SELECT CAST("id" AS TEXT), CAST("user_id" AS TEXT), CAST("vehicle_id" AS TEXT), CAST("workshop_id" AS TEXT), "vehicle_plate", "entry_date", "completion_date", "mechanic_name", "description", "type", "cost", "status", "created_at", "updated_at", 'migration' FROM `maintenance_records`;--> statement-breakpoint
DROP TABLE `maintenance_records`;--> statement-breakpoint
ALTER TABLE `__new_maintenance_records` RENAME TO `maintenance_records`;--> statement-breakpoint
CREATE INDEX `idx_maintenance_user_id` ON `maintenance_records` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_maintenance_vehicle_id` ON `maintenance_records` (`vehicle_id`);--> statement-breakpoint
CREATE INDEX `idx_maintenance_workshop_id` ON `maintenance_records` (`workshop_id`);--> statement-breakpoint
CREATE TABLE `__new_rentals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`vehicle_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`monthly_rate` real NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_by` text,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_rentals`("id", "user_id", "vehicle_id", "customer_id", "start_date", "end_date", "monthly_rate", "status", "created_at", "updated_at", "device_id") SELECT CAST("id" AS TEXT), CAST("user_id" AS TEXT), CAST("vehicle_id" AS TEXT), CAST("customer_id" AS TEXT), "start_date", "end_date", "monthly_rate", "status", "created_at", "updated_at", 'migration' FROM `rentals`;--> statement-breakpoint
DROP TABLE `rentals`;--> statement-breakpoint
ALTER TABLE `__new_rentals` RENAME TO `rentals`;--> statement-breakpoint
CREATE INDEX `idx_rentals_user_id` ON `rentals` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_rentals_vehicle_id` ON `rentals` (`vehicle_id`);--> statement-breakpoint
CREATE INDEX `idx_rentals_customer_id` ON `rentals` (`customer_id`);--> statement-breakpoint
CREATE TABLE `__new_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`workshop_id` text,
	`name` text NOT NULL,
	`permissions` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_by` text,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_roles`("id", "workshop_id", "name", "permissions", "created_at", "updated_at", "device_id") SELECT CAST("id" AS TEXT), CAST("workshop_id" AS TEXT), "name", "permissions", "created_at", "updated_at", 'migration' FROM `roles`;--> statement-breakpoint
DROP TABLE `roles`;--> statement-breakpoint
ALTER TABLE `__new_roles` RENAME TO `roles`;--> statement-breakpoint
CREATE TABLE `__new_vehicle_models` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`brand` text NOT NULL,
	`image_url` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_by` text,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_vehicle_models`("id", "name", "brand", "image_url", "status", "created_at", "updated_at", "device_id") SELECT CAST("id" AS TEXT), "name", "brand", "image_url", "status", "created_at", "updated_at", 'migration' FROM `vehicle_models`;--> statement-breakpoint
DROP TABLE `vehicle_models`;--> statement-breakpoint
ALTER TABLE `__new_vehicle_models` RENAME TO `vehicle_models`;--> statement-breakpoint
CREATE TABLE `__new_vehicle_statuses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#6b7280' NOT NULL,
	`is_default` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_by` text,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_vehicle_statuses`("id", "name", "color", "is_default", "created_at", "updated_at", "device_id") SELECT CAST("id" AS TEXT), "name", "color", "is_default", "created_at", "updated_at", 'migration' FROM `vehicle_statuses`;--> statement-breakpoint
DROP TABLE `vehicle_statuses`;--> statement-breakpoint
ALTER TABLE `__new_vehicle_statuses` RENAME TO `vehicle_statuses`;--> statement-breakpoint
CREATE TABLE `__new_vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`plate` text NOT NULL,
	`model_id` text,
	`year` integer NOT NULL,
	`status_id` text NOT NULL,
	`mileage` integer DEFAULT 0 NOT NULL,
	`current_renter_id` text,
	`default_monthly_rate` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_by` text,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `vehicle_models`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`status_id`) REFERENCES `vehicle_statuses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`current_renter_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_vehicles`("id", "plate", "model_id", "year", "status_id", "mileage", "current_renter_id", "default_monthly_rate", "created_at", "updated_at", "device_id") SELECT CAST("id" AS TEXT), "plate", CAST("model_id" AS TEXT), "year", CAST("status_id" AS TEXT), "mileage", CAST("current_renter_id" AS TEXT), "default_monthly_rate", "created_at", "updated_at", 'migration' FROM `vehicles`;--> statement-breakpoint
DROP TABLE `vehicles`;--> statement-breakpoint
ALTER TABLE `__new_vehicles` RENAME TO `vehicles`;--> statement-breakpoint
CREATE INDEX `idx_vehicles_plate` ON `vehicles` (`plate`);--> statement-breakpoint
CREATE INDEX `idx_vehicles_status_id` ON `vehicles` (`status_id`);--> statement-breakpoint
CREATE TABLE `__new_workshops` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_by` text,
	`device_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_deleted` integer DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_workshops`("id", "name", "address", "status", "created_at", "updated_at", "device_id") SELECT CAST("id" AS TEXT), "name", "address", "status", "created_at", "updated_at", 'migration' FROM `workshops`;--> statement-breakpoint
DROP TABLE `workshops`;--> statement-breakpoint
ALTER TABLE `__new_workshops` RENAME TO `workshops`;