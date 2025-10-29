CREATE TABLE "connected_account" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"username" text,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_artifact" ADD COLUMN "imported_from" text;--> statement-breakpoint
ALTER TABLE "content_artifact" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "connected_account" ADD CONSTRAINT "connected_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;