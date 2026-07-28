// src/modules/reporting/reporting.repository.ts

import { prisma } from '@/prisma/client';
import { TripStatus } from '@prisma/client';
import { ReportFilterDto } from './reporting.validation';

export class ReportingRepository {
  /**
   * Build date filter for queries
   */
  private buildDateFilter(filters?: ReportFilterDto) {
    const where: any = {};

    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    return where;
  }

  /**
   * Get pagination parameters
   */
  private getPagination(page: number = 1, limit: number = 20) {
    return { skip: (page - 1) * limit, take: limit };
  }

  // ─── Dashboard ──────────────────────────────────────────────────

  /**
   * Get dashboard statistics
   */
  async getDashboard(filters?: ReportFilterDto) {
    const dateFilter = this.buildDateFilter(filters);

    const [users, buses, routes, trips, schedules, incidents, notifications] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.bus.count({ where: { deletedAt: null } }),
      prisma.route.count({ where: { deletedAt: null } }),
      prisma.trip.count({ where: { ...dateFilter, deletedAt: null } }),
      prisma.schedule.count({ where: { deletedAt: null } }),
      prisma.incident.count({ where: { ...dateFilter, deletedAt: null } }),
      prisma.notification.count({ where: { ...dateFilter, deletedAt: null } }),
    ]);

    return { users, buses, routes, trips, schedules, incidents, notifications };
  }

  // ─── Trip Report ────────────────────────────────────────────────

  /**
   * Get trip report with pagination and filters
   */
  async getTrips(filters?: ReportFilterDto) {
    const { page = 1, limit = 20 } = filters || {};
    const { skip, take } = this.getPagination(page, limit);

    const where: any = { deletedAt: null };

    if (filters?.driverId) where.driverId = filters.driverId;
    if (filters?.busId) where.busId = filters.busId;

    if (filters?.routeId) {
      where.version = {
        is: {
          routeId: filters.routeId,
        },
      };
    }

    if (filters?.from || filters?.to) {
      where.scheduledStart = {};
      if (filters.from) where.scheduledStart.gte = new Date(filters.from);
      if (filters.to) where.scheduledStart.lte = new Date(filters.to);
    }

    const [data, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: {
          bus: { select: { id: true, plateNumber: true, model: true } },
          driver: { select: { id: true, fullName: true, email: true } },
          version: { include: { route: { select: { routeName: true } } } },
        },
        orderBy: { scheduledStart: 'desc' },
        skip,
        take,
      }),
      prisma.trip.count({ where }),
    ]);

    return {
      data: data.map((trip) => ({
        id: trip.id,
        status: trip.status,
        scheduledStart: trip.scheduledStart,
        actualStart: trip.actualStart,
        actualEnd: trip.actualEnd,
        createdAt: trip.createdAt,
        bus: trip.bus,
        driver: trip.driver,
        routeName: trip.version?.route?.routeName || 'Unknown',
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Incident Report ────────────────────────────────────────────

  /**
   * Get incident report with pagination and filters
   */
  async getIncidents(filters?: ReportFilterDto) {
    const { page = 1, limit = 20 } = filters || {};
    const { skip, take } = this.getPagination(page, limit);

    const where: any = { deletedAt: null };

    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const [data, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        include: {
          bus: { select: { plateNumber: true } },
          driver: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.incident.count({ where }),
    ]);

    return {
      data: data.map((incident) => ({
        id: incident.id,
        incidentType: incident.incidentType,
        severity: incident.severity,
        status: incident.status,
        description: incident.description,
        createdAt: incident.createdAt,
        resolvedAt: incident.resolvedAt,
        busPlate: incident.bus?.plateNumber || null,
        driverName: incident.driver?.fullName || null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Bus Report ─────────────────────────────────────────────────

  /**
   * Get bus report with completed trip counts
   */
  async getBusReport() {
    const buses = await prisma.bus.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        plateNumber: true,
        model: true,
        capacity: true,
        maintenanceStatus: true,
        trips: {
          where: { status: TripStatus.completed },
          select: { id: true },
        },
      },
    });

    return buses.map((bus) => ({
      id: bus.id,
      plateNumber: bus.plateNumber,
      model: bus.model,
      capacity: bus.capacity,
      maintenanceStatus: bus.maintenanceStatus,
      totalTrips: bus.trips.length,
    }));
  }

  // ─── Driver Report ──────────────────────────────────────────────

  /**
   * Get driver report with trip counts
   */
  async getDriverReport() {
    const drivers = await prisma.user.findMany({
      where: {
        deletedAt: null,
        userRoles: {
          some: {
            role: {
              roleName: 'Driver',
            },
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        tripsAsDriver: {
          where: { deletedAt: null },
          select: { id: true, status: true },
        },
      },
    });

    return drivers.map((driver) => {
      const trips = driver.tripsAsDriver || [];
      return {
        id: driver.id,
        fullName: driver.fullName,
        email: driver.email,
        phone: driver.phone || 'N/A',
        totalTrips: trips.length,
        activeTrips: trips.filter((t) => t.status === TripStatus.in_progress).length,
        completedTrips: trips.filter((t) => t.status === TripStatus.completed).length,
      };
    });
  }

  // ─── Revenue Report ─────────────────────────────────────────────

  /**
   * Get revenue report from completed trips
   */
  async getRevenueReport() {
    const now = new Date();

    const trips = await prisma.trip.findMany({
      where: { status: TripStatus.completed, deletedAt: null },
      include: {
        version: {
          include: {
            route: {
              include: {
                prices: {
                  where: {
                    effectiveFrom: { lte: now },
                    OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: now } }],
                  },
                },
              },
            },
          },
        },
      },
    });

    let totalRevenue = 0;
    for (const trip of trips) {
      const price = trip.version?.route?.prices?.[0];
      if (price) {
        totalRevenue += Number(price.basePrice);
      }
    }

    return {
      totalRevenue,
      totalTrips: trips.length,
      averageRevenue: trips.length === 0 ? 0 : totalRevenue / trips.length,
    };
  }
}

export const reportingRepository = new ReportingRepository();