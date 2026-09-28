import { Prisma, ReportType, ReportStatus, ReportFormat } from '@prisma/client';
import { prisma as defaultPrisma } from '@/prisma/client';

let prisma = defaultPrisma;

export function setPrismaClient(client: any) {
  prisma = client;
}

// ============================================================
// DATA GATHERING FOR ON-THE-FLY REPORTS
// ============================================================

export async function getTripsForReport(filters: { startDate?: Date; endDate?: Date; routeId?: string; driverId?: string }) {
  const where: any = { deletedAt: null };
  if (filters.startDate || filters.endDate) {
    where.scheduledStart = {};
    if (filters.startDate) where.scheduledStart.gte = filters.startDate;
    if (filters.endDate) where.scheduledStart.lte = filters.endDate;
  }
  if (filters.routeId) {
    where.schedule = { routeId: filters.routeId };
  }
  if (filters.driverId) where.driverId = filters.driverId;

  return prisma.trip.findMany({
    where,
    include: {
      bus: { select: { plateNumber: true } },
      driver: { select: { fullName: true } },
      version: { include: { route: { select: { routeName: true } } } },
    },
    orderBy: { scheduledStart: 'desc' },
  });
}

export async function getIncidentsForReport(filters: { startDate?: Date; endDate?: Date; severity?: string }) {
  const where: any = { deletedAt: null };
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }
  if (filters.severity) where.severity = filters.severity;

  return prisma.incident.findMany({
    where,
    include: {
      bus: { select: { plateNumber: true } },
      driver: { select: { fullName: true } },
      trip: { select: { scheduledStart: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getBusesForFleetReport() {
  return prisma.bus.findMany({
    where: { deletedAt: null },
    include: { terminal: { select: { terminalName: true } } },
  });
}

// ============================================================
// REPORT PERSISTENCE
// ============================================================

export async function createReportRecord(data: Prisma.ReportUncheckedCreateInput) {
  return prisma.report.create({
    data,
    include: {
      creator: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });
}

export async function countReports(where: Prisma.ReportWhereInput) {
  return prisma.report.count({ where });
}

export async function findReports(where: Prisma.ReportWhereInput, take: number, skip: number) {
  return prisma.report.findMany({
    where,
    include: {
      creator: {
        select: { id: true, fullName: true, email: true },
      },
      downloads: {
        select: { id: true, downloadedAt: true },
        orderBy: { downloadedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take,
    skip,
  });
}

export async function findReportById(id: string) {
  return prisma.report.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, fullName: true, email: true },
      },
      downloads: {
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { downloadedAt: 'desc' },
      },
    },
  });
}

export async function updateReportRecord(id: string, data: Prisma.ReportUpdateInput) {
  return prisma.report.update({
    where: { id },
    data,
  });
}

export async function createReportDownloadRecord(data: Prisma.ReportDownloadUncheckedCreateInput) {
  return prisma.reportDownload.create({
    data,
    include: {
      report: {
        select: { id: true, reportName: true, reportType: true },
      },
      user: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });
}

export async function findScheduledReports(dueDate?: Date) {
  const where: Prisma.ReportWhereInput = {
    isScheduled: true,
    deletedAt: null,
  };
  if (dueDate) {
    where.nextRunAt = { lte: dueDate };
  }
  return prisma.report.findMany({
    where,
    include: {
      creator: {
        select: { id: true, fullName: true, email: true },
      },
    },
    orderBy: { nextRunAt: 'asc' },
  });
}

export async function getReportGroupedByStatus(where: Prisma.ReportWhereInput) {
  return prisma.report.groupBy({
    by: ['status'],
    where,
    _count: true,
  });
}

export async function getReportGroupedByType(where: Prisma.ReportWhereInput) {
  return prisma.report.groupBy({
    by: ['reportType'],
    where,
    _count: true,
  });
}

export async function countReportDownloads(userId?: string) {
  return prisma.reportDownload.count({
    where: userId ? { report: { createdBy: userId } } : undefined,
  });
}
