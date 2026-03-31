CREATE TABLE "unavailable_vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"vehicle_id" text NOT NULL,
	"status_type" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	"device_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_deleted" integer DEFAULT 0 NOT NULL,
	"sync_status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "unavailable_vehicles" ADD CONSTRAINT "unavailable_vehicles_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_unavailable_vehicles_user_id" ON "unavailable_vehicles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_unavailable_vehicles_vehicle_id" ON "unavailable_vehicles" USING btree ("vehicle_id");