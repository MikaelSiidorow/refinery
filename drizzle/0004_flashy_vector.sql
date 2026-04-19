CREATE TYPE "public"."access_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "access_status" "access_status";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "access_requested_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "access_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "access_reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_super_admin" boolean;--> statement-breakpoint
UPDATE "user"
SET
	"access_status" = 'approved',
	"access_requested_at" = COALESCE("created_at", CURRENT_TIMESTAMP),
	"access_reviewed_at" = COALESCE("updated_at", "created_at", CURRENT_TIMESTAMP),
	"is_super_admin" = false
WHERE "access_status" IS NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "access_status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "access_requested_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "is_super_admin" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_access_reviewed_by_user_id_fk" FOREIGN KEY ("access_reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
