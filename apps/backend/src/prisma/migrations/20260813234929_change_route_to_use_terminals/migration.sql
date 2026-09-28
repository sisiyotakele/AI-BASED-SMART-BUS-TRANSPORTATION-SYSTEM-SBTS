-- AlterTable routes: Change from stop-based to terminal-based
-- Step 1: Add new terminal columns (nullable initially)
ALTER TABLE "routes" ADD COLUMN "start_terminal_id" UUID;
ALTER TABLE "routes" ADD COLUMN "end_terminal_id" UUID;

-- Step 2: Migrate existing data - set terminal IDs from stops
UPDATE "routes" r
SET "start_terminal_id" = (
    SELECT s."terminal_id"
    FROM "stops" s
    WHERE s."id" = r."start_stop_id"
    LIMIT 1
),
"end_terminal_id" = (
    SELECT s."terminal_id"
    FROM "stops" s
    WHERE s."id" = r."end_stop_id"
    LIMIT 1
)
WHERE r."deleted_at" IS NULL;

-- Step 3: Make terminal columns NOT NULL
ALTER TABLE "routes" ALTER COLUMN "start_terminal_id" SET NOT NULL;
ALTER TABLE "routes" ALTER COLUMN "end_terminal_id" SET NOT NULL;

-- Step 4: Drop old stop columns
ALTER TABLE "routes" DROP COLUMN "start_stop_id";
ALTER TABLE "routes" DROP COLUMN "end_stop_id";

-- Step 5: Add foreign key constraints
ALTER TABLE "routes" ADD CONSTRAINT "routes_start_terminal_id_fkey" 
    FOREIGN KEY ("start_terminal_id") REFERENCES "terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "routes" ADD CONSTRAINT "routes_end_terminal_id_fkey" 
    FOREIGN KEY ("end_terminal_id") REFERENCES "terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: Add index for performance
CREATE INDEX "routes_start_terminal_id_idx" ON "routes"("start_terminal_id");
CREATE INDEX "routes_end_terminal_id_idx" ON "routes"("end_terminal_id");
