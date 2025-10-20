CREATE TYPE "public"."artifact_status" AS ENUM('draft', 'ready', 'published');--> statement-breakpoint
CREATE TYPE "public"."artifact_type" AS ENUM('blog-post', 'thread', 'carousel', 'newsletter', 'email', 'short-post', 'comment');--> statement-breakpoint
CREATE TYPE "public"."idea_status" AS ENUM('inbox', 'developing', 'ready', 'published', 'archived', 'cancelled');--> statement-breakpoint
CREATE TABLE "content_artifact" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"idea_id" uuid NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"artifact_type" "artifact_type" NOT NULL,
	"platform" text,
	"status" "artifact_status" DEFAULT 'draft' NOT NULL,
	"planned_publish_date" timestamp,
	"published_at" timestamp,
	"published_url" text,
	"impressions" integer,
	"likes" integer,
	"comments" integer,
	"shares" integer,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_idea" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"one_liner" text NOT NULL,
	"status" "idea_status" DEFAULT 'inbox' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"target_audience" text DEFAULT '' NOT NULL,
	"brand_voice" text DEFAULT '' NOT NULL,
	"content_pillars" text DEFAULT '' NOT NULL,
	"unique_perspective" text DEFAULT '' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "content_settings_userId_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"github_id" integer NOT NULL,
	"username" text NOT NULL,
	"email" text,
	"avatar_url" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_githubId_unique" UNIQUE("github_id")
);
--> statement-breakpoint
ALTER TABLE "content_artifact" ADD CONSTRAINT "content_artifact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_artifact" ADD CONSTRAINT "content_artifact_idea_id_content_idea_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."content_idea"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_idea" ADD CONSTRAINT "content_idea_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_settings" ADD CONSTRAINT "content_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;