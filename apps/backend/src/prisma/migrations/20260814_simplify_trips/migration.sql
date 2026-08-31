-- Simplify Trip System Migration
-- Make scheduleId optional (we can create trips directly without schedules)
-- Add notes and estimated duration fields

-- Step 1: Make scheduleId nullable
ALTER TABLE trips ALTER COLUMN schedule_id DROP NOT NULL;

-- Step 2: Add new optional fields
ALTER TABLE trips ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER DEFAULT 120;

-- Step 3: Add helpful comment
COMMENT ON COLUMN trips.schedule_id IS 'Optional: Can create trips directly without a schedule template';
COMMENT ON COLUMN trips.notes IS 'Optional notes for the trip (e.g., VIP transport, express route)';
COMMENT ON COLUMN trips.estimated_duration_minutes IS 'Estimated trip duration in minutes (default 2 hours)';
