-- DropIndex (if exists)
DROP INDEX IF EXISTS "routes_end_terminal_id_idx";

-- DropIndex (if exists)
DROP INDEX IF EXISTS "routes_start_terminal_id_idx";

-- AlterTable
ALTER TABLE "route_versions" ADD COLUMN IF NOT EXISTS "version_name" VARCHAR(255);

-- AlterTable
ALTER TABLE "routes" ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) NOT NULL DEFAULT 'active';
