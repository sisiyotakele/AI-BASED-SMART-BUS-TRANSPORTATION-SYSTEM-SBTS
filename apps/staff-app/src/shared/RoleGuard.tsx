import type { AppLayoutRole } from './AppLayout';

export function RoleGuard(role: AppLayoutRole, allowedRole: AppLayoutRole) {
  return role === allowedRole;
}