ALTER TABLE "maintenance_records" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "image_url" text;