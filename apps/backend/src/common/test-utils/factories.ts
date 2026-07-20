import bcrypt from 'bcryptjs';
import { prismaTest } from './test-db';

export async function createRole(data: Partial<{ roleName: string; description: string }> = {}) {
  return prismaTest.role.create({
    data: {
      roleName: data.roleName || `role_${Date.now()}`,
      description: data.description || 'Test role',
    },
  });
}

export async function createPermission(data: Partial<{ permissionName: string; resource: string; action: string }> = {}) {
  return prismaTest.permission.create({
    data: {
      permissionName: data.permissionName || `perm_${Date.now()}`,
      resource: data.resource || 'test',
      action: data.action || 'read',
    },
  });
}

export async function createUser(data: Partial<{ fullName: string; email: string; phone: string; password: string; isActive: boolean; licenseNumber: string; licenseExpiry: Date }> = {}) {
  const passwordHash = await bcrypt.hash(data.password || 'password123', 10);
  return prismaTest.user.create({
    data: {
      fullName: data.fullName || 'Test User',
      email: data.email || `user_${Date.now()}@test.com`,
      phone: data.phone || `+2519${Math.floor(Math.random() * 100000000)}`,
      passwordHash,
      isActive: data.isActive !== undefined ? data.isActive : true,
      licenseNumber: data.licenseNumber || null,
      licenseExpiry: data.licenseExpiry || null,
    },
  });
}

export async function createTerminal(data: Partial<{ terminalName: string; address: string; latitude: number; longitude: number }> = {}) {
  return prismaTest.terminal.create({
    data: {
      terminalName: data.terminalName || `Terminal ${Date.now()}`,
      address: data.address || 'Test Address',
      latitude: data.latitude ?? 9.03,
      longitude: data.longitude ?? 38.74,
    },
  });
}

export async function createBus(data: Partial<{ plateNumber: string; model: string; capacity: number; maintenanceStatus: string; terminalId: string }> = {}) {
  return prismaTest.bus.create({
    data: {
      plateNumber: data.plateNumber || `plate_${Date.now()}`,
      model: data.model || 'Toyota Coaster',
      capacity: data.capacity ?? 50,
      maintenanceStatus: (data.maintenanceStatus as any) || 'operational',
      terminalId: data.terminalId || null,
    },
  });
}

export async function createStop(data: Partial<{ stopName: string; stopCode: string; latitude: number; longitude: number; terminalId: string }> = {}) {
  return prismaTest.stop.create({
    data: {
      stopName: data.stopName || `Stop ${Date.now()}`,
      stopCode: data.stopCode || `STOP${Date.now()}`,
      latitude: data.latitude ?? 9.03,
      longitude: data.longitude ?? 38.74,
      terminalId: data.terminalId || null,
    },
  });
}

export async function createRoute(data: Partial<{ routeName: string; startStopId: string; endStopId: string }> = {}) {
  return prismaTest.route.create({
    data: {
      routeName: data.routeName || `Route ${Date.now()}`,
      startStopId: data.startStopId!,
      endStopId: data.endStopId!,
    },
  });
}

export async function createRouteVersion(data: Partial<{ routeId: string; versionNumber: number; isActive: boolean }> = {}) {
  return prismaTest.routeVersion.create({
    data: {
      routeId: data.routeId!,
      versionNumber: data.versionNumber ?? 1,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
}

export async function createShift(data: Partial<{ driverId: string; shiftName: string; shiftDate: Date; shiftStart: Date; shiftEnd: Date }> = {}) {
  const baseDate = data.shiftDate || new Date();
  return prismaTest.shift.create({
    data: {
      driverId: data.driverId!,
      shiftName: data.shiftName || 'Morning Shift',
      shiftDate: baseDate,
      shiftStart: data.shiftStart || new Date(baseDate.setHours(6, 0, 0, 0)),
      shiftEnd: data.shiftEnd || new Date(baseDate.setHours(14, 0, 0, 0)),
    },
  });
}

export async function createSchedule(data: Partial<{ routeId: string; versionId: string; scheduleName: string; dayOfWeek: string; departureTime: Date }> = {}) {
  return prismaTest.schedule.create({
    data: {
      routeId: data.routeId!,
      versionId: data.versionId!,
      scheduleName: data.scheduleName || 'Test Schedule',
      dayOfWeek: (data.dayOfWeek as any) || 'monday',
      departureTime: data.departureTime || new Date(2024, 0, 1, 8, 0, 0),
    },
  });
}

export async function createTrip(data: Partial<{ busId: string; driverId: string; versionId: string; scheduleId: string; scheduledStart: Date; scheduledEnd: Date; status: string }> = {}) {
  return prismaTest.trip.create({
    data: {
      busId: data.busId!,
      driverId: data.driverId!,
      versionId: data.versionId!,
      scheduleId: data.scheduleId!,
      scheduledStart: data.scheduledStart || new Date(Date.now() + 3600000),
      scheduledEnd: data.scheduledEnd || new Date(Date.now() + 7200000),
      status: (data.status as any) || 'scheduled',
    },
  });
}
