-- Add widgetKey and allowedDomains columns
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "widgetKey" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "allowedDomains" TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

-- Backfill widgetKey for existing projects
UPDATE "Project" SET "widgetKey" = 'wgt_' || encode(gen_random_bytes(16), 'hex') WHERE "widgetKey" IS NULL;

-- Make widgetKey NOT NULL and UNIQUE after backfill
ALTER TABLE "Project" ALTER COLUMN "widgetKey" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Project_widgetKey_key" ON "Project"("widgetKey");
