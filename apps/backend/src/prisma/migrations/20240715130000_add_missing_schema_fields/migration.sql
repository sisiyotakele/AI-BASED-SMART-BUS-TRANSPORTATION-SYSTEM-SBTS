-- Migration: Add missing schema fields for notifications and reports
-- Part 1: Add delivery tracking to notifications
-- Part 2: Add reports table for report persistence

-- ============================================================
-- PART 1: NOTIFICATIONS - Add Delivery Status Tracking
-- ============================================================

-- Create enum for notification delivery status
CREATE TYPE "NotificationDeliveryStatus" AS ENUM (
  'pending',
  'sent',
  'delivered',
  'failed',
  'bounced'
);

-- Add delivery tracking fields to notification_users table
ALTER TABLE notification_users
  ADD COLUMN delivery_status "NotificationDeliveryStatus" DEFAULT 'pending',
  ADD COLUMN sent_at TIMESTAMPTZ(6),
  ADD COLUMN delivered_at TIMESTAMPTZ(6),
  ADD COLUMN failed_at TIMESTAMPTZ(6),
  ADD COLUMN failure_reason TEXT,
  ADD COLUMN delivery_attempts INT DEFAULT 0,
  ADD COLUMN last_attempt_at TIMESTAMPTZ(6);

-- Add index for delivery status queries
CREATE INDEX notification_users_delivery_status_idx 
  ON notification_users(delivery_status);

-- Add index for failed deliveries
CREATE INDEX notification_users_failed_idx 
  ON notification_users(delivery_status, last_attempt_at) 
  WHERE delivery_status = 'failed';

-- Comments for documentation
COMMENT ON COLUMN notification_users.delivery_status IS 
  'Tracks the delivery status of the notification: pending, sent, delivered, failed, bounced';

COMMENT ON COLUMN notification_users.sent_at IS 
  'Timestamp when the notification was sent (pushed to delivery service)';

COMMENT ON COLUMN notification_users.delivered_at IS 
  'Timestamp when the notification was confirmed delivered to user device';

COMMENT ON COLUMN notification_users.failed_at IS 
  'Timestamp when the notification delivery failed';

COMMENT ON COLUMN notification_users.failure_reason IS 
  'Reason for delivery failure (e.g., invalid token, network error)';

COMMENT ON COLUMN notification_users.delivery_attempts IS 
  'Number of delivery attempts made';

-- ============================================================
-- PART 2: REPORTS - Add Report Persistence Table
-- ============================================================

-- Create enum for report type
CREATE TYPE "ReportType" AS ENUM (
  'trip',
  'incident',
  'fleet',
  'revenue',
  'driver_performance',
  'route_analytics',
  'maintenance',
  'custom'
);

-- Create enum for report status
CREATE TYPE "ReportStatus" AS ENUM (
  'generating',
  'completed',
  'failed',
  'expired'
);

-- Create enum for report format
CREATE TYPE "ReportFormat" AS ENUM (
  'pdf',
  'excel',
  'csv',
  'json'
);

-- Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type "ReportType" NOT NULL,
  report_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Filters/parameters used to generate the report (stored as JSON)
  filters JSONB,
  
  -- Report metadata
  status "ReportStatus" DEFAULT 'generating',
  format "ReportFormat" DEFAULT 'pdf',
  
  -- File storage
  file_url VARCHAR(500),
  file_size_bytes BIGINT,
  
  -- Report data (for JSON format or small reports)
  report_data JSONB,
  
  -- Scheduling
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_cron VARCHAR(100),
  next_run_at TIMESTAMPTZ(6),
  
  -- Access control
  is_public BOOLEAN DEFAULT FALSE,
  allowed_roles TEXT[],
  
  -- Lifecycle
  generated_at TIMESTAMPTZ(6),
  expires_at TIMESTAMPTZ(6),
  
  -- Audit fields
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW(),
  deleted_at TIMESTAMPTZ(6),
  
  -- Error tracking
  error_message TEXT,
  generation_time_ms INT
);

-- Indexes for reports table
CREATE INDEX reports_type_idx ON reports(report_type);
CREATE INDEX reports_status_idx ON reports(status);
CREATE INDEX reports_created_by_idx ON reports(created_by);
CREATE INDEX reports_created_at_idx ON reports(created_at DESC);
CREATE INDEX reports_deleted_at_idx ON reports(deleted_at);
CREATE INDEX reports_expires_at_idx ON reports(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX reports_scheduled_idx ON reports(is_scheduled, next_run_at) WHERE is_scheduled = TRUE;

-- Composite index for user's recent reports
CREATE INDEX reports_user_recent_idx 
  ON reports(created_by, created_at DESC) 
  WHERE deleted_at IS NULL;

-- Comments for documentation
COMMENT ON TABLE reports IS 
  'Stores generated reports with metadata, filters, and optional file storage';

COMMENT ON COLUMN reports.filters IS 
  'JSON object containing the filters/parameters used to generate this report';

COMMENT ON COLUMN reports.report_data IS 
  'JSON object containing the actual report data (for JSON format or when file storage is not used)';

COMMENT ON COLUMN reports.schedule_cron IS 
  'Cron expression for scheduled reports (e.g., "0 9 * * MON" for every Monday at 9am)';

COMMENT ON COLUMN reports.allowed_roles IS 
  'Array of role names that can access this report (empty = creator only, unless is_public = true)';

COMMENT ON COLUMN reports.generation_time_ms IS 
  'Time taken to generate the report in milliseconds (for performance monitoring)';

-- Create report_downloads table to track who downloaded what
CREATE TABLE report_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ(6) DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Indexes for report_downloads
CREATE INDEX report_downloads_report_idx ON report_downloads(report_id);
CREATE INDEX report_downloads_user_idx ON report_downloads(user_id);
CREATE INDEX report_downloads_downloaded_at_idx ON report_downloads(downloaded_at DESC);

COMMENT ON TABLE report_downloads IS 
  'Tracks report downloads for audit and analytics purposes';
