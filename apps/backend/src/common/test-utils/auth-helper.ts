import jwt from 'jsonwebtoken';
import { config } from '@/config';

export function generateTestToken(payload: {
  userId: string;
  email: string;
  roles?: { roleId: string; roleName: string; permissions: string[] }[];
}): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles || [],
    },
    config.jwt.secret,
    { expiresIn: '1h' } as any
  );
}

export const testAdminToken = generateTestToken({
  userId: '00000000-0000-0000-0000-000000000001',
  email: 'admin@test.com',
  roles: [
    {
      roleId: '00000000-0000-0000-0000-000000000010',
      roleName: 'admin',
      permissions: ['manage_roles', 'view_roles', 'manage_fleet', 'view_fleet', 'create_trip', 'start_trip', 'end_trip', 'report_incident', 'resolve_incident', 'manage_assignments', 'view_assignments', 'manage_shifts', 'view_shifts', 'manage_routes', 'view_routes', 'manage_drivers', 'view_drivers', 'manage_pricing', 'view_pricing', 'manage_schedules', 'view_schedules', 'manage_terminals', 'view_terminals', 'manage_key_handovers', 'view_key_handovers', 'cancel_trip', 'view_trips', 'view_incidents', 'manage_notifications', 'manage_ai_models', 'view_predictions', 'generate_report', 'view_reports', 'view_audit_logs'],
    },
  ],
});

export const testDriverToken = generateTestToken({
  userId: '00000000-0000-0000-0000-000000000002',
  email: 'driver@test.com',
  roles: [
    {
      roleId: '00000000-0000-0000-0000-000000000020',
      roleName: 'driver',
      permissions: ['view_fleet', 'view_terminals', 'view_routes', 'view_shifts', 'view_schedules', 'view_assignments', 'view_key_handovers', 'start_trip', 'end_trip', 'view_trips', 'report_incident', 'view_incidents', 'view_predictions', 'view_pricing'],
    },
  ],
});

export const testPassengerToken = generateTestToken({
  userId: '00000000-0000-0000-0000-000000000003',
  email: 'passenger@test.com',
  roles: [
    {
      roleId: '00000000-0000-0000-0000-000000000030',
      roleName: 'passenger',
      permissions: ['view_routes', 'view_terminals', 'view_schedules', 'view_pricing', 'view_predictions'],
    },
  ],
});
