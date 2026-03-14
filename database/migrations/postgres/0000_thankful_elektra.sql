CREATE TABLE "app_users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"rental_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"cpf" text,
	"active_contract" boolean DEFAULT false NOT NULL,
	"balance_due" numeric(10, 2) DEFAULT '0' NOT NULL,
	"last_payment_date" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"parent_id" bigint NOT NULL,
	"origin_type" text NOT NULL,
	"file_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"vehicle_id" bigint NOT NULL,
	"workshop_id" bigint,
	"vehicle_plate" text NOT NULL,
	"entry_date" text NOT NULL,
	"completion_date" text,
	"mechanic_name" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rentals" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"vehicle_id" bigint NOT NULL,
	"customer_id" bigint NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"monthly_rate" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"workshop_id" bigint,
	"name" text NOT NULL,
	"permissions" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_metadata" (
	"table_name" text PRIMARY KEY NOT NULL,
	"last_sync_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vehicle_models" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"image_url" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_statuses" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6b7280' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"plate" text NOT NULL,
	"model_id" bigint,
	"year" numeric NOT NULL,
	"status_id" bigint NOT NULL,
	"mileage" numeric DEFAULT '0' NOT NULL,
	"current_renter_id" bigint,
	"default_monthly_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workshops" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_users" ADD CONSTRAINT "app_users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_model_id_vehicle_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_status_id_vehicle_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."vehicle_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_current_renter_id_customers_id_fk" FOREIGN KEY ("current_renter_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_contracts_rental_id" ON "contracts" USING btree ("rental_id");--> statement-breakpoint
CREATE INDEX "idx_customers_user_id" ON "customers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_customers_cpf" ON "customers" USING btree ("cpf");--> statement-breakpoint
CREATE INDEX "idx_documents_parent" ON "documents" USING btree ("parent_id","origin_type");--> statement-breakpoint
CREATE INDEX "idx_maintenance_user_id" ON "maintenance_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_maintenance_vehicle_id" ON "maintenance_records" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_maintenance_workshop_id" ON "maintenance_records" USING btree ("workshop_id");--> statement-breakpoint
CREATE INDEX "idx_rentals_user_id" ON "rentals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_rentals_vehicle_id" ON "rentals" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_rentals_customer_id" ON "rentals" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_vehicles_plate" ON "vehicles" USING btree ("plate");--> statement-breakpoint
CREATE INDEX "idx_vehicles_status_id" ON "vehicles" USING btree ("status_id");