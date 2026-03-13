CREATE TABLE `app_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`rental_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`dirty` integer DEFAULT 1 NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_contracts_rental_id` ON `contracts` (`rental_id`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`cpf` text,
	`active_contract` integer DEFAULT 0 NOT NULL,
	`balance_due` real DEFAULT 0 NOT NULL,
	`last_payment_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`dirty` integer DEFAULT 1 NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_customers_user_id` ON `customers` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_customers_cpf` ON `customers` (`cpf`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text NOT NULL,
	`origin_type` text NOT NULL,
	`file_url` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`dirty` integer DEFAULT 1 NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_documents_parent` ON `documents` (`parent_id`,`origin_type`);--> statement-breakpoint
CREATE TABLE `maintenance_records` (
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
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`dirty` integer DEFAULT 1 NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_maintenance_user_id` ON `maintenance_records` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_maintenance_vehicle_id` ON `maintenance_records` (`vehicle_id`);--> statement-breakpoint
CREATE INDEX `idx_maintenance_workshop_id` ON `maintenance_records` (`workshop_id`);--> statement-breakpoint
CREATE TABLE `rentals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`vehicle_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`monthly_rate` real NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`dirty` integer DEFAULT 1 NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_rentals_user_id` ON `rentals` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_rentals_vehicle_id` ON `rentals` (`vehicle_id`);--> statement-breakpoint
CREATE INDEX `idx_rentals_customer_id` ON `rentals` (`customer_id`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`workshop_id` text,
	`name` text NOT NULL,
	`permissions` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sync_metadata` (
	`table_name` text PRIMARY KEY NOT NULL,
	`last_sync_at` text
);
--> statement-breakpoint
CREATE TABLE `vehicle_models` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`brand` text NOT NULL,
	`image_url` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`dirty` integer DEFAULT 1 NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `vehicle_statuses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#6b7280' NOT NULL,
	`is_default` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`dirty` integer DEFAULT 1 NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`plate` text NOT NULL,
	`model_id` text,
	`year` integer NOT NULL,
	`status_id` text NOT NULL,
	`mileage` integer DEFAULT 0 NOT NULL,
	`current_renter_id` text,
	`default_monthly_rate` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`dirty` integer DEFAULT 1 NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`model_id`) REFERENCES `vehicle_models`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`status_id`) REFERENCES `vehicle_statuses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`current_renter_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_vehicles_plate` ON `vehicles` (`plate`);--> statement-breakpoint
CREATE INDEX `idx_vehicles_status_id` ON `vehicles` (`status_id`);--> statement-breakpoint
CREATE TABLE `workshops` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`dirty` integer DEFAULT 1 NOT NULL,
	`deleted_at` text
);
