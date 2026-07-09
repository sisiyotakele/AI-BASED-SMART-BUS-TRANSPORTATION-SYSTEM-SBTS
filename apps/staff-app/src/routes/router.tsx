export type StaffRole = 'driver' | 'admin';

export function createStaffRouter(role: StaffRole) {
  return role === 'admin' ? ['admin-routes'] : ['driver-routes'];
}