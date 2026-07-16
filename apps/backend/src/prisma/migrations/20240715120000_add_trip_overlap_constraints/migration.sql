-- Migration: Add exclusion constraints to prevent trip overlaps
-- This prevents double-booking at the database level using PostgreSQL exclusion constraints

-- Enable btree_gist extension for exclusion constraints on timestamps
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Exclusion constraint: Prevent bus double-booking
-- A bus cannot have overlapping trips (same busId with overlapping time ranges)
ALTER TABLE trips
ADD CONSTRAINT trips_bus_no_overlap_excl
EXCLUDE USING GIST (
  bus_id WITH =,
  tstzrange(scheduled_start, scheduled_end, '[]') WITH &&
)
WHERE (deleted_at IS NULL AND status IN ('scheduled', 'in_progress'));

-- Exclusion constraint: Prevent driver double-booking
-- A driver cannot have overlapping trips (same driverId with overlapping time ranges)
ALTER TABLE trips
ADD CONSTRAINT trips_driver_no_overlap_excl
EXCLUDE USING GIST (
  driver_id WITH =,
  tstzrange(scheduled_start, scheduled_end, '[]') WITH &&
)
WHERE (deleted_at IS NULL AND status IN ('scheduled', 'in_progress'));

-- Comments for documentation
COMMENT ON CONSTRAINT trips_bus_no_overlap_excl ON trips IS 
'Exclusion constraint: Prevents a bus from being scheduled for overlapping trips';

COMMENT ON CONSTRAINT trips_driver_no_overlap_excl ON trips IS 
'Exclusion constraint: Prevents a driver from being scheduled for overlapping trips';
