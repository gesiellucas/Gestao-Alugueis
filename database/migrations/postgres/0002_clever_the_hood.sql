ALTER TABLE "app_users" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "app_users" ALTER COLUMN "role_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "rental_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "parent_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "maintenance_records" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "maintenance_records" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "maintenance_records" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "maintenance_records" ALTER COLUMN "vehicle_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "maintenance_records" ALTER COLUMN "workshop_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "maintenance_records" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "vehicle_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "rentals" ALTER COLUMN "customer_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "workshop_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "vehicle_models" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "vehicle_statuses" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "model_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "status_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "current_renter_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workshops" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "device_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "is_deleted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "sync_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "device_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "is_deleted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "sync_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "device_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "is_deleted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "sync_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "device_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "is_deleted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "sync_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "device_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "is_deleted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD COLUMN "sync_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "device_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "is_deleted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "sync_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "device_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "is_deleted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "sync_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle_models" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "vehicle_models" ADD COLUMN "device_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle_models" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle_models" ADD COLUMN "is_deleted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle_models" ADD COLUMN "sync_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle_statuses" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "vehicle_statuses" ADD COLUMN "device_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle_statuses" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle_statuses" ADD COLUMN "is_deleted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle_statuses" ADD COLUMN "sync_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "device_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "is_deleted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "sync_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "workshops" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "workshops" ADD COLUMN "device_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workshops" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "workshops" ADD COLUMN "is_deleted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "workshops" ADD COLUMN "sync_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "app_users" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "contracts" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "maintenance_records" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "rentals" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "vehicle_models" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "vehicle_statuses" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "vehicles" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "workshops" DROP COLUMN "deleted_at";