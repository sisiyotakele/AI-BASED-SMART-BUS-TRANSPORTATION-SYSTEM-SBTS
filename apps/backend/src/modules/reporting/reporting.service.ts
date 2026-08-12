import { logger } from '@/common/logger';
import { ReportType, ReportStatus, ReportFormat, Prisma } from '@prisma/client';
import * as repository from './reporting.repository';

// ============================================================
// REPOSITORY INJECTION
// ============================================================

export function setPrismaClient(client: any) {
  repository.setPrismaClient(client);
}

// ============================================================
// EXISTING REPORT GENERATION (ON-THE-FLY)
// ============================================================

export async function generateTripReport(filters: { startDate?: Date; endDate?: Date; routeId?: string; driverId?: string } = {}) {
  const trips = await repository.getTripsForReport(filters);

  const stats = {
    totalTrips: trips.length,
    completed: trips.filter((t: any) => t.status === 'completed').length,
    cancelled: trips.filter((t: any) => t.status === 'cancelled').length,
    active: trips.filter((t: any) => t.status === 'active').length,
    scheduled: trips.filter((t: any) => t.status === 'scheduled').length,
    avgActualDuration: 0,
  };

  const durations = trips
    .filter((t: any) => t.actualStart && t.actualEnd)
    .map((t: any) => new Date(t.actualEnd).getTime() - new Date(t.actualStart).getTime());

  if (durations.length > 0) {
    stats.avgActualDuration = Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length / 60000);
  }

  return { trips, stats };
}

export async function generateIncidentReport(filters: { startDate?: Date; endDate?: Date; severity?: string } = {}) {
  const incidents = await repository.getIncidentsForReport(filters);

  const stats = {
    totalIncidents: incidents.length,
    bySeverity: {
      low: incidents.filter((i: any) => i.severity === 'low').length,
      medium: incidents.filter((i: any) => i.severity === 'medium').length,
      high: incidents.filter((i: any) => i.severity === 'high').length,
      critical: incidents.filter((i: any) => i.severity === 'critical').length,
    },
    resolved: incidents.filter((i: any) => i.status === 'resolved').length,
    pending: incidents.filter((i: any) => i.status === 'reported' || i.status === 'under_review').length,
  };

  return { incidents, stats };
}

export async function generateFleetReport() {
  const buses = await repository.getBusesForFleetReport();

  const stats = {
    totalBuses: buses.length,
    operational: buses.filter((b: any) => b.maintenanceStatus === 'operational').length,
    inMaintenance: buses.filter((b: any) => b.maintenanceStatus === 'in_maintenance').length,
    retired: buses.filter((b: any) => b.maintenanceStatus === 'retired').length,
    totalCapacity: buses.reduce((sum: number, b: any) => sum + (b.capacity || 0), 0),
  };

  return { buses, stats };
}

// ============================================================
// REPORT PERSISTENCE (NEW)
// ============================================================

export async function createReport(data: {
  reportType: ReportType;
  reportName: string;
  description?: string;
  filters?: any;
  format?: ReportFormat;
  isScheduled?: boolean;
  scheduleCron?: string;
  isPublic?: boolean;
  allowedRoles?: string[];
  createdBy: string;
}) {
  const report = await repository.createReportRecord({
    reportType: data.reportType,
    reportName: data.reportName,
    description: data.description,
    filters: data.filters ? JSON.parse(JSON.stringify(data.filters)) : undefined,
    format: data.format || ReportFormat.pdf,
    isScheduled: data.isScheduled || false,
    scheduleCron: data.scheduleCron,
    isPublic: data.isPublic || false,
    allowedRoles: data.allowedRoles || [],
    createdBy: data.createdBy,
    status: ReportStatus.generating,
  });

  logger.info(`Report created: ${report.id} (${report.reportName})`);
  return report;
}

export async function getReports(filters: {
  reportType?: ReportType;
  status?: ReportStatus;
  createdBy?: string;
  startDate?: Date;
  endDate?: Date;
  isScheduled?: boolean;
  limit?: number;
  offset?: number;
}) {
  const where: Prisma.ReportWhereInput = {
    deletedAt: null,
  };

  if (filters.reportType) where.reportType = filters.reportType;
  if (filters.status && (filters.status as string) !== 'all') where.status = filters.status;
  if (filters.createdBy) where.createdBy = filters.createdBy;
  if (filters.isScheduled !== undefined) where.isScheduled = filters.isScheduled;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const take = filters.limit || 50;
  const skip = filters.offset || 0;

  const [reports, total] = await Promise.all([
    repository.findReports(where, take, skip),
    repository.countReports(where),
  ]);

  return { reports, total };
}

export async function getReportById(id: string) {
  const report = await repository.findReportById(id);
  return report;
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
  data?: {
    fileUrl?: string;
    fileSizeBytes?: bigint;
    reportData?: any;
    errorMessage?: string;
    generationTimeMs?: number;
  }
) {
  const updateData: Prisma.ReportUpdateInput = {
    status,
    updatedAt: new Date(),
  };

  if (status === ReportStatus.completed) {
    updateData.generatedAt = new Date();
  }

  if (data?.fileUrl) updateData.fileUrl = data.fileUrl;
  if (data?.fileSizeBytes) updateData.fileSizeBytes = data.fileSizeBytes;
  if (data?.reportData) updateData.reportData = JSON.parse(JSON.stringify(data.reportData));
  if (data?.errorMessage) updateData.errorMessage = data.errorMessage;
  if (data?.generationTimeMs) updateData.generationTimeMs = data.generationTimeMs;

  const report = await repository.updateReportRecord(id, updateData);

  logger.info(`Report ${id} status updated to ${status}`);
  return report;
}

export async function scheduleReport(
  id: string,
  scheduleCron: string,
  nextRunAt: Date
) {
  const report = await repository.updateReportRecord(id, {
    isScheduled: true,
    scheduleCron,
    nextRunAt,
  });

  logger.info(`Report ${id} scheduled with cron: ${scheduleCron}`);
  return report;
}

export async function trackReportDownload(data: {
  reportId: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const download = await repository.createReportDownloadRecord({
    reportId: data.reportId,
    userId: data.userId,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });

  logger.info(`Report download tracked: ${download.reportId} by user ${download.userId}`);
  return download;
}

export async function getScheduledReports(dueDate?: Date) {
  const reports = await repository.findScheduledReports(dueDate);
  return reports;
}

export async function deleteReport(id: string) {
  const report = await repository.updateReportRecord(id, { deletedAt: new Date() });

  logger.info(`Report ${id} soft deleted`);
  return report;
}

export async function getReportStatistics(userId?: string) {
  const where: Prisma.ReportWhereInput = {
    deletedAt: null,
  };

  if (userId) where.createdBy = userId;

  const [
    totalReports,
    byStatus,
    byType,
    scheduledCount,
    totalDownloads,
  ] = await Promise.all([
    repository.countReports(where),
    repository.getReportGroupedByStatus(where),
    repository.getReportGroupedByType(where),
    repository.countReports({ ...where, isScheduled: true }),
    repository.countReportDownloads(userId),
  ]);

  return {
    totalReports,
    byStatus,
    byType,
    scheduledCount,
    totalDownloads,
  };
}
