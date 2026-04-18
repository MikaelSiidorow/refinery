UPDATE "content_idea"
SET "content" = CASE
	WHEN "notes" IS NOT NULL AND "notes" != '' AND "content" IS NOT NULL AND "content" != ''
		THEN "notes" || E'\n\n---\n\n' || "content"
	WHEN "notes" IS NOT NULL AND "notes" != ''
		THEN "notes"
	ELSE "content"
END
WHERE "notes" IS NOT NULL AND "notes" != '';

ALTER TABLE "content_idea" DROP COLUMN "notes";
