-- CreateEnum
CREATE TYPE "BusMaintenanceStatus" AS ENUM ('operational', 'in_maintenance', 'retired');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('scheduled', 'in_progress', 'paused', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('reported', 'investigating', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "KeyHandoverStatus" AS ENUM ('pending', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('trip', 'incident', 'fleet', 'revenue', 'driver_performance', 'route_analytics', 'maintenance', 'custom');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('generating', 'completed', 'failed', 'expired');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('pdf', 'excel', 'csv', 'json');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- CreateEnum
CREATE TYPE "TrafficLevel" AS ENUM ('low', 'moderate', 'high', 'severe');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('active', 'inactive', 'cancelled');

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "permission_name" VARCHAR(255) NOT NULL,
    "resource" VARCHAR(255) NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "role_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMPTZ(6),
    "replaced_by" UUID,
    "ip_address" VARCHAR(255),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "home_terminal_id" UUID,
    "license_number" VARCHAR(255),
    "license_expiry" DATE,
    "preferred_language" VARCHAR(50),
    "department" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_by" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terminals" (
    "id" UUID NOT NULL,
    "terminal_name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "capacity" INTEGER,
    "facilities" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "phone_number" VARCHAR(20),
    "manager_name" VARCHAR(255),
    "email" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "terminals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buses" (
    "id" UUID NOT NULL,
    "terminal_id" UUID,
    "plate_number" VARCHAR(255) NOT NULL,
    "model" VARCHAR(255) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "maintenance_status" "BusMaintenanceStatus" NOT NULL DEFAULT 'operational',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "buses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" UUID NOT NULL,
    "route_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "start_stop_id" UUID NOT NULL,
    "end_stop_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_versions" (
    "id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "effective_from" TIMESTAMPTZ(6),
    "effective_until" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "route_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stops" (
    "id" UUID NOT NULL,
    "terminal_id" UUID,
    "stop_name" VARCHAR(255) NOT NULL,
    "stop_code" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "address" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stops" (
    "id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "stop_id" UUID NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "estimated_minutes" INTEGER,
    "distance_km" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices" (
    "id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "from_stop_id" UUID NOT NULL,
    "to_stop_id" UUID NOT NULL,
    "base_price" DECIMAL(10,2) NOT NULL,
    "peak_price" DECIMAL(10,2),
    "off_peak_price" DECIMAL(10,2),
    "effective_from" TIMESTAMPTZ(6),
    "effective_until" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "schedule_name" VARCHAR(255) NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "departure_time" TIME NOT NULL,
    "frequency_minutes" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" DATE,
    "effective_until" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "shift_name" VARCHAR(255) NOT NULL,
    "shift_start" TIME NOT NULL,
    "shift_end" TIME NOT NULL,
    "shift_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_driver_assignments" (
    "id" UUID NOT NULL,
    "bus_id" UUID NOT NULL,
    "shift_id" UUID NOT NULL,
    "assigned_date" DATE NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "bus_driver_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_handovers" (
    "id" UUID NOT NULL,
    "bus_id" UUID NOT NULL,
    "terminal_id" UUID NOT NULL,
    "from_shift_id" UUID,
    "to_shift_id" UUID NOT NULL,
    "handover_time" TIMESTAMPTZ(6) NOT NULL,
    "status" "KeyHandoverStatus" NOT NULL DEFAULT 'pending',
    "confirmed_by_from" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_by_to" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "key_handovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_route_assignments" (
    "id" UUID NOT NULL,
    "bus_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "assigned_date" DATE NOT NULL,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "bus_route_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "bus_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "key_handover_id" UUID,
    "scheduled_start" TIMESTAMPTZ(6) NOT NULL,
    "scheduled_end" TIMESTAMPTZ(6) NOT NULL,
    "actual_start" TIMESTAMPTZ(6),
    "actual_end" TIMESTAMPTZ(6),
    "status" "TripStatus" NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_gps_logs" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "terminal_id" UUID,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "speed" DECIMAL(5,2),
    "direction" DECIMAL(5,2),
    "altitude" DECIMAL(7,2),
    "recorded_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trip_gps_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_live_locations" (
    "id" UUID NOT NULL,
    "bus_id" UUID NOT NULL,
    "trip_id" UUID,
    "driver_id" UUID,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "speed" DECIMAL(5,2),
    "direction" DECIMAL(5,2),
    "altitude" DECIMAL(7,2),
    "recorded_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bus_live_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "bus_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "incident_type" VARCHAR(255) NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "description" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "photo_url" VARCHAR(500),
    "status" "IncidentStatus" NOT NULL DEFAULT 'reported',
    "resolution_notes" TEXT,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "notification_type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_users" (
    "id" UUID NOT NULL,
    "notification_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "delivery_status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "failure_reason" TEXT,
    "delivery_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "report_type" "ReportType" NOT NULL,
    "report_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "filters" JSONB,
    "status" "ReportStatus" NOT NULL DEFAULT 'generating',
    "format" "ReportFormat" NOT NULL DEFAULT 'pdf',
    "file_url" VARCHAR(500),
    "file_size_bytes" BIGINT,
    "report_data" JSONB,
    "is_scheduled" BOOLEAN NOT NULL DEFAULT false,
    "schedule_cron" VARCHAR(100),
    "next_run_at" TIMESTAMPTZ(6),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "allowed_roles" TEXT[],
    "generated_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "error_message" TEXT,
    "generation_time_ms" INTEGER,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_downloads" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "downloaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,

    CONSTRAINT "report_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_models" (
    "id" UUID NOT NULL,
    "version" VARCHAR(255) NOT NULL,
    "accuracy" DECIMAL(5,2),
    "trained_at" TIMESTAMPTZ(6),
    "dataset_size" INTEGER,
    "model_parameters" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traffic_predictions" (
    "id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "prediction_time" TIMESTAMPTZ(6) NOT NULL,
    "traffic_level" "TrafficLevel" NOT NULL,
    "predicted_delay_minutes" INTEGER,
    "confidence" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traffic_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_history" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "ip_address" VARCHAR(255),
    "user_agent" TEXT,
    "device_info" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(255) NOT NULL,
    "entity_name" VARCHAR(255) NOT NULL,
    "entity_id" UUID,
    "old_values" TEXT,
    "new_values" TEXT,
    "description" TEXT,
    "ip_address" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_name_key" ON "permissions"("permission_name");

-- CreateIndex
CREATE INDEX "permissions_deleted_at_idx" ON "permissions"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE INDEX "roles_deleted_at_idx" ON "roles"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_unique" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_license_number_key" ON "users"("license_number");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_unique" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "terminals_terminal_name_key" ON "terminals"("terminal_name");

-- CreateIndex
CREATE UNIQUE INDEX "buses_plate_number_key" ON "buses"("plate_number");

-- CreateIndex
CREATE INDEX "buses_terminal_idx" ON "buses"("terminal_id");

-- CreateIndex
CREATE INDEX "buses_maintenance_status_idx" ON "buses"("maintenance_status");

-- CreateIndex
CREATE INDEX "buses_deleted_at_idx" ON "buses"("deleted_at");

-- CreateIndex
CREATE INDEX "routes_deleted_at_idx" ON "routes"("deleted_at");

-- CreateIndex
CREATE INDEX "route_versions_route_id_idx" ON "route_versions"("route_id");

-- CreateIndex
CREATE UNIQUE INDEX "stops_stop_code_key" ON "stops"("stop_code");

-- CreateIndex
CREATE INDEX "route_stops_version_id_sequence_number_idx" ON "route_stops"("version_id", "sequence_number");

-- CreateIndex
CREATE INDEX "prices_route_from_to_idx" ON "prices"("route_id", "from_stop_id", "to_stop_id");

-- CreateIndex
CREATE INDEX "schedules_route_active_idx" ON "schedules"("route_id", "is_active");

-- CreateIndex
CREATE INDEX "schedules_day_idx" ON "schedules"("day_of_week");

-- CreateIndex
CREATE INDEX "schedules_deleted_at_idx" ON "schedules"("deleted_at");

-- CreateIndex
CREATE INDEX "shifts_driver_id_shift_date_idx" ON "shifts"("driver_id", "shift_date");

-- CreateIndex
CREATE INDEX "bus_driver_assignments_bus_date_idx" ON "bus_driver_assignments"("bus_id", "assigned_date");

-- CreateIndex
CREATE INDEX "bus_driver_assignments_shift_date_idx" ON "bus_driver_assignments"("shift_id", "assigned_date");

-- CreateIndex
CREATE INDEX "bus_driver_assignments_status_idx" ON "bus_driver_assignments"("status");

-- CreateIndex
CREATE INDEX "key_handovers_bus_handover_time_idx" ON "key_handovers"("bus_id", "handover_time");

-- CreateIndex
CREATE INDEX "key_handovers_to_shift_handover_time_idx" ON "key_handovers"("to_shift_id", "handover_time");

-- CreateIndex
CREATE INDEX "key_handovers_status_idx" ON "key_handovers"("status");

-- CreateIndex
CREATE INDEX "bus_route_assignments_bus_date_idx" ON "bus_route_assignments"("bus_id", "assigned_date");

-- CreateIndex
CREATE INDEX "trips_status_idx" ON "trips"("status");

-- CreateIndex
CREATE INDEX "trips_driver_status_idx" ON "trips"("driver_id", "status");

-- CreateIndex
CREATE INDEX "trips_bus_status_idx" ON "trips"("bus_id", "status");

-- CreateIndex
CREATE INDEX "trips_deleted_at_idx" ON "trips"("deleted_at");

-- CreateIndex
CREATE INDEX "trips_scheduled_start_idx" ON "trips"("scheduled_start");

-- CreateIndex
CREATE INDEX "trip_gps_logs_trip_recorded_idx" ON "trip_gps_logs"("trip_id", "recorded_at");

-- CreateIndex
CREATE INDEX "trip_gps_logs_driver_recorded_idx" ON "trip_gps_logs"("driver_id", "recorded_at");

-- CreateIndex
CREATE INDEX "bus_live_locations_bus_recorded_idx" ON "bus_live_locations"("bus_id", "recorded_at");

-- CreateIndex
CREATE INDEX "bus_live_locations_trip_recorded_idx" ON "bus_live_locations"("trip_id", "recorded_at");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_severity_idx" ON "incidents"("severity");

-- CreateIndex
CREATE INDEX "incidents_deleted_at_idx" ON "incidents"("deleted_at");

-- CreateIndex
CREATE INDEX "incidents_trip_idx" ON "incidents"("trip_id");

-- CreateIndex
CREATE INDEX "notifications_priority_idx" ON "notifications"("priority");

-- CreateIndex
CREATE INDEX "notifications_deleted_at_idx" ON "notifications"("deleted_at");

-- CreateIndex
CREATE INDEX "notification_users_user_read_idx" ON "notification_users"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notification_users_delivery_status_idx" ON "notification_users"("delivery_status");

-- CreateIndex
CREATE INDEX "notification_users_failed_idx" ON "notification_users"("delivery_status", "last_attempt_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_users_notification_user_unique" ON "notification_users"("notification_id", "user_id");

-- CreateIndex
CREATE INDEX "reports_type_idx" ON "reports"("report_type");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_created_by_idx" ON "reports"("created_by");

-- CreateIndex
CREATE INDEX "reports_created_at_idx" ON "reports"("created_at" DESC);

-- CreateIndex
CREATE INDEX "reports_deleted_at_idx" ON "reports"("deleted_at");

-- CreateIndex
CREATE INDEX "reports_expires_at_idx" ON "reports"("expires_at");

-- CreateIndex
CREATE INDEX "reports_scheduled_idx" ON "reports"("is_scheduled", "next_run_at");

-- CreateIndex
CREATE INDEX "reports_user_recent_idx" ON "reports"("created_by", "created_at" DESC);

-- CreateIndex
CREATE INDEX "report_downloads_report_idx" ON "report_downloads"("report_id");

-- CreateIndex
CREATE INDEX "report_downloads_user_idx" ON "report_downloads"("user_id");

-- CreateIndex
CREATE INDEX "report_downloads_downloaded_at_idx" ON "report_downloads"("downloaded_at" DESC);

-- CreateIndex
CREATE INDEX "traffic_predictions_route_time_idx" ON "traffic_predictions"("route_id", "prediction_time");

-- CreateIndex
CREATE INDEX "traffic_predictions_version_time_idx" ON "traffic_predictions"("version_id", "prediction_time");

-- CreateIndex
CREATE INDEX "login_history_user_created_idx" ON "login_history"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity_name", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_created_idx" ON "audit_logs"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_home_terminal_id_fkey" FOREIGN KEY ("home_terminal_id") REFERENCES "terminals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buses" ADD CONSTRAINT "buses_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "terminals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_start_stop_id_fkey" FOREIGN KEY ("start_stop_id") REFERENCES "stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_end_stop_id_fkey" FOREIGN KEY ("end_stop_id") REFERENCES "stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_versions" ADD CONSTRAINT "route_versions_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stops" ADD CONSTRAINT "stops_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "terminals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "route_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_from_stop_id_fkey" FOREIGN KEY ("from_stop_id") REFERENCES "stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_to_stop_id_fkey" FOREIGN KEY ("to_stop_id") REFERENCES "stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "route_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_driver_assignments" ADD CONSTRAINT "bus_driver_assignments_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_driver_assignments" ADD CONSTRAINT "bus_driver_assignments_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_handovers" ADD CONSTRAINT "key_handovers_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_handovers" ADD CONSTRAINT "key_handovers_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_handovers" ADD CONSTRAINT "key_handovers_from_shift_id_fkey" FOREIGN KEY ("from_shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_handovers" ADD CONSTRAINT "key_handovers_to_shift_id_fkey" FOREIGN KEY ("to_shift_id") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_route_assignments" ADD CONSTRAINT "bus_route_assignments_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_route_assignments" ADD CONSTRAINT "bus_route_assignments_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "route_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_key_handover_id_fkey" FOREIGN KEY ("key_handover_id") REFERENCES "key_handovers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_gps_logs" ADD CONSTRAINT "trip_gps_logs_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_gps_logs" ADD CONSTRAINT "trip_gps_logs_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_gps_logs" ADD CONSTRAINT "trip_gps_logs_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "terminals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_live_locations" ADD CONSTRAINT "bus_live_locations_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_live_locations" ADD CONSTRAINT "bus_live_locations_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_live_locations" ADD CONSTRAINT "bus_live_locations_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_users" ADD CONSTRAINT "notification_users_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_users" ADD CONSTRAINT "notification_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_downloads" ADD CONSTRAINT "report_downloads_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_downloads" ADD CONSTRAINT "report_downloads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traffic_predictions" ADD CONSTRAINT "traffic_predictions_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "ai_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traffic_predictions" ADD CONSTRAINT "traffic_predictions_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traffic_predictions" ADD CONSTRAINT "traffic_predictions_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "route_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
