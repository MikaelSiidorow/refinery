-- Merge notes into content field (preserve both if both exist)
-- If both notes and content exist, concatenate them with a separator
-- If only notes exists, move it to content
-- If only content exists, leave it as is
UPDATE "content_idea"
SET "content" = CASE
  -- Both notes and content have data: merge them
  WHEN "notes" IS NOT NULL AND "notes" != '' AND "content" IS NOT NULL AND "content" != ''
  THEN "notes" || E'\n\n---\n\n' || "content"
  -- Only notes has data: move it to content
  WHEN "notes" IS NOT NULL AND "notes" != ''
  THEN "notes"
  -- Only content has data or both are empty: keep content as is
  ELSE "content"
END
WHERE "notes" IS NOT NULL AND "notes" != '';

-- Now safe to drop the notes column
ALTER TABLE "content_idea" DROP COLUMN "notes";