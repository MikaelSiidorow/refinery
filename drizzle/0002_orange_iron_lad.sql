ALTER TABLE "content_artifact" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "content_idea" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "content_idea" ALTER COLUMN "content" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "content_idea" ALTER COLUMN "notes" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "content_idea" ALTER COLUMN "tags" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "content_settings" ALTER COLUMN "target_audience" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "content_settings" ALTER COLUMN "brand_voice" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "content_settings" ALTER COLUMN "content_pillars" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "content_settings" ALTER COLUMN "unique_perspective" DROP DEFAULT;