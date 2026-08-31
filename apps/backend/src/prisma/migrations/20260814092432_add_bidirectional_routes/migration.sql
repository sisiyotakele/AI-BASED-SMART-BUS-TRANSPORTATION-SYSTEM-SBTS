-- Add bidirectional route support to route_versions
-- This migration adds direction and isPrimary fields to support bidirectional routes

-- Step 1: Add new columns (nullable first for existing data)
ALTER TABLE "route_versions" ADD COLUMN "direction" VARCHAR(20);
ALTER TABLE "route_versions" ADD COLUMN "is_primary" BOOLEAN;

-- Step 2: Set default values for existing rows
-- All existing route versions are considered "forward" direction
UPDATE "route_versions" 
SET "direction" = 'forward', "is_primary" = false
WHERE "deleted_at" IS NULL;

-- Step 3: Mark the first version (versionNumber = 1) of each route as primary
UPDATE "route_versions" rv
SET "is_primary" = true
WHERE "version_number" = 1 
  AND "deleted_at" IS NULL
  AND "direction" = 'forward';

-- Step 4: Make columns NOT NULL with defaults
ALTER TABLE "route_versions" ALTER COLUMN "direction" SET NOT NULL;
ALTER TABLE "route_versions" ALTER COLUMN "direction" SET DEFAULT 'forward';
ALTER TABLE "route_versions" ALTER COLUMN "is_primary" SET NOT NULL;
ALTER TABLE "route_versions" ALTER COLUMN "is_primary" SET DEFAULT false;

-- Step 5: Add indexes for performance
CREATE INDEX "route_versions_direction_idx" ON "route_versions"("direction");
CREATE INDEX "route_versions_is_primary_idx" ON "route_versions"("is_primary");

-- Step 6: Create backward direction routes for existing routes
-- For each route, create a primary backward route (initially empty/inactive)
INSERT INTO "route_versions" (
  "id",
  "route_id", 
  "version_number", 
  "version_name",
  "direction", 
  "is_primary", 
  "is_active",
  "created_at",
  "updated_at"
)
SELECT 
  gen_random_uuid() as id,
  rv."route_id",
  1 as version_number,
  'Route 1' as version_name,
  'backward' as direction,
  true as is_primary,
  false as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM "route_versions" rv
WHERE rv."version_number" = 1 
  AND rv."direction" = 'forward'
  AND rv."deleted_at" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "route_versions" rv2
    WHERE rv2."route_id" = rv."route_id"
      AND rv2."direction" = 'backward'
      AND rv2."deleted_at" IS NULL
  )
GROUP BY rv."route_id";

-- Step 7: Update route names to bidirectional format (A ↔ B)
UPDATE "routes" r
SET "route_name" = 
  COALESCE(
    (SELECT t.terminal_name FROM "terminals" t WHERE t.id = r.start_terminal_id),
    'Unknown'
  ) || 
  ' ↔ ' || 
  COALESCE(
    (SELECT t.terminal_name FROM "terminals" t WHERE t.id = r.end_terminal_id),
    'Unknown'
  )
WHERE r."deleted_at" IS NULL
  AND r."route_name" NOT LIKE '%↔%'; -- Only update if not already bidirectional

-- Step 8: Add comment for documentation
COMMENT ON COLUMN "route_versions"."direction" IS 'Direction of route: forward (start→end) or backward (end→start)';
COMMENT ON COLUMN "route_versions"."is_primary" IS 'Marks if this is the primary/main route for this direction (Route 1)';
