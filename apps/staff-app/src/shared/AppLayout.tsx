export type AppLayoutRole = 'driver' | 'admin';

export function AppLayout(role: AppLayoutRole) {
  return role === 'admin' ? 'admin-layout' : 'driver-layout';
}