import { prisma } from '@/prisma/client';
import * as reportingService from '../reporting.service';
import { NotFoundError } from '@/common/errors';
import { createUser } from '@/common/test-utils/factories';
import { ReportType, ReportStatus, ReportFormat } from '@prisma/client';

describe('Reporting Service', () => {
    let adminUser: any;
    let user2: any;

    beforeAll(async () => {
        adminUser = await createUser({ email: 'admin@test.com' });
        user2 = await createUser({ email: 'user2@test.com' });
    });

    afterEach(async () => {
        await prisma.reportDownload.deleteMany({});
        await prisma.report.deleteMany({});
    });

    describe('createReport', () => {
        it('should create a report with valid data', async () => {
            const reportData = {
                reportType: ReportType.trip,
                reportName: 'Monthly Trip Report',
                description: 'Trip statistics for August 2026',
                filters: { month: '08', year: '2026' },
                format: ReportFormat.pdf,
                createdBy: adminUser.id,
            };

            const report = await reportingService.createReport(reportData);

            expect(report).toBeDefined();
            expect(report.reportType).toBe('trip');
            expect(report.reportName).toBe('Monthly Trip Report');
            expect(report.format).toBe('pdf');
            expect(report.status).toBe('generating');
            expect(report.creator).toBeDefined();
        });

        it('should create report with default values', async () => {
            const reportData = {
                reportType: ReportType.fleet,
                reportName: 'Fleet Report',
                createdBy: adminUser.id,
            };

            const report = await reportingService.createReport(reportData);

            expect(report.format).toBe('pdf'); // Default
            expect(report.isScheduled).toBe(false);
            expect(report.isPublic).toBe(false);
            expect(report.status).toBe('generating');
        });

        it('should create scheduled report', async () => {
            const reportData = {
                reportType: ReportType.revenue,
                reportName: 'Weekly Revenue Report',
                isScheduled: true,
                scheduleCron: '0 9 * * MON',
                createdBy: adminUser.id,
            };

            const report = await reportingService.createReport(reportData);

            expect(report.isScheduled).toBe(true);
            expect(report.scheduleCron).toBe('0 9 * * MON');
        });
    });

    describe('getReports', () => {
        beforeEach(async () => {
            await reportingService.createReport({
                reportType: ReportType.trip,
                reportName: 'Report 1',
                createdBy: adminUser.id,
            });

            await reportingService.createReport({
                reportType: ReportType.incident,
                reportName: 'Report 2',
                createdBy: user2.id,
            });

            await reportingService.createReport({
                reportType: ReportType.trip,
                reportName: 'Report 3',
                isScheduled: true,
                createdBy: adminUser.id,
            });
        });

        it('should list all reports', async () => {
            const { reports, total } = await reportingService.getReports({});

            expect(reports.length).toBeGreaterThanOrEqual(3);
            expect(total).toBeGreaterThanOrEqual(3);
            expect(reports[0].creator).toBeDefined();
        });

        it('should filter reports by type', async () => {
            const { reports } = await reportingService.getReports({
                reportType: ReportType.trip,
            });

            expect(reports.length).toBeGreaterThanOrEqual(2);
            expect(reports.every(r => r.reportType === 'trip')).toBe(true);
        });

        it('should filter reports by creator', async () => {
            const { reports } = await reportingService.getReports({
                createdBy: adminUser.id,
            });

            expect(reports.length).toBeGreaterThanOrEqual(2);
            expect(reports.every(r => r.createdBy === adminUser.id)).toBe(true);
        });

        it('should filter scheduled reports', async () => {
            const { reports } = await reportingService.getReports({
                isScheduled: true,
            });

            expect(reports.length).toBeGreaterThanOrEqual(1);
            expect(reports.every(r => r.isScheduled === true)).toBe(true);
        });

        it('should support pagination', async () => {
            const { reports } = await reportingService.getReports({
                limit: 2,
                offset: 0,
            });

            expect(reports).toHaveLength(2);
        });
    });

    describe('getReportById', () => {
        it('should get report by ID', async () => {
            const created = await reportingService.createReport({
                reportType: ReportType.fleet,
                reportName: 'Test Report',
                createdBy: adminUser.id,
            });

            const report = await reportingService.getReportById(created.id);

            expect(report).toBeDefined();
            expect(report!.id).toBe(created.id);
            expect(report!.creator).toBeDefined();
            expect(report!.downloads).toBeDefined();
        });

        it('should return null for non-existent report', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const report = await reportingService.getReportById(fakeId);

            expect(report).toBeNull();
        });
    });

    describe('updateReportStatus', () => {
        it('should update report status to completed', async () => {
            const report = await reportingService.createReport({
                reportType: ReportType.trip,
                reportName: 'Test Report',
                createdBy: adminUser.id,
            });

            const updated = await reportingService.updateReportStatus(
                report.id,
                ReportStatus.completed,
                {
                    fileUrl: 'https://storage.example.com/reports/report1.pdf',
                    fileSizeBytes: BigInt(1024000),
                    generationTimeMs: 5000,
                }
            );

            expect(updated.status).toBe('completed');
            expect(updated.fileUrl).toBe('https://storage.example.com/reports/report1.pdf');
            expect(updated.fileSizeBytes).toBe(BigInt(1024000));
            expect(updated.generationTimeMs).toBe(5000);
            expect(updated.generatedAt).toBeInstanceOf(Date);
        });

        it('should update report status to failed with error', async () => {
            const report = await reportingService.createReport({
                reportType: ReportType.incident,
                reportName: 'Test Report',
                createdBy: adminUser.id,
            });

            const updated = await reportingService.updateReportStatus(
                report.id,
                ReportStatus.failed,
                {
                    errorMessage: 'Database connection timeout',
                }
            );

            expect(updated.status).toBe('failed');
            expect(updated.errorMessage).toBe('Database connection timeout');
        });
    });

    describe('scheduleReport', () => {
        it('should schedule a report', async () => {
            const report = await reportingService.createReport({
                reportType: ReportType.revenue,
                reportName: 'Weekly Revenue',
                createdBy: adminUser.id,
            });

            const nextRun = new Date('2026-08-10T09:00:00Z');
            const scheduled = await reportingService.scheduleReport(
                report.id,
                '0 9 * * MON',
                nextRun
            );

            expect(scheduled.isScheduled).toBe(true);
            expect(scheduled.scheduleCron).toBe('0 9 * * MON');
            expect(scheduled.nextRunAt).toBeInstanceOf(Date);
        });
    });

    describe('trackReportDownload', () => {
        it('should track report download', async () => {
            const report = await reportingService.createReport({
                reportType: ReportType.trip,
                reportName: 'Test Report',
                createdBy: adminUser.id,
            });

            const download = await reportingService.trackReportDownload({
                reportId: report.id,
                userId: user2.id,
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0...',
            });

            expect(download).toBeDefined();
            expect(download.reportId).toBe(report.id);
            expect(download.userId).toBe(user2.id);
            expect(download.ipAddress).toBe('192.168.1.100');
            expect(download.report).toBeDefined();
            expect(download.user).toBeDefined();
        });
    });

    describe('getScheduledReports', () => {
        it('should get reports due for generation', async () => {
            const pastDate = new Date('2026-08-01T09:00:00Z');
            const futureDate = new Date('2026-08-30T09:00:00Z');

            const report1 = await reportingService.createReport({
                reportType: ReportType.revenue,
                reportName: 'Overdue Report',
                isScheduled: true,
                createdBy: adminUser.id,
            });
            await reportingService.scheduleReport(report1.id, '0 9 * * MON', pastDate);

            const report2 = await reportingService.createReport({
                reportType: ReportType.fleet,
                reportName: 'Future Report',
                isScheduled: true,
                createdBy: adminUser.id,
            });
            await reportingService.scheduleReport(report2.id, '0 9 * * FRI', futureDate);

            const dueReports = await reportingService.getScheduledReports(new Date('2026-08-15T00:00:00Z'));

            expect(dueReports.length).toBeGreaterThanOrEqual(1);
            expect(dueReports[0].isScheduled).toBe(true);
        });
    });

    describe('deleteReport', () => {
        it('should soft-delete a report', async () => {
            const report = await reportingService.createReport({
                reportType: ReportType.trip,
                reportName: 'To Delete',
                createdBy: adminUser.id,
            });

            const deleted = await reportingService.deleteReport(report.id);

            expect(deleted.deletedAt).not.toBeNull();
            expect(deleted.deletedAt).toBeInstanceOf(Date);

            const { reports } = await reportingService.getReports({});
            expect(reports.find(r => r.id === report.id)).toBeUndefined();
        });
    });

    describe('getReportStatistics', () => {
        beforeEach(async () => {
            const report1 = await reportingService.createReport({
                reportType: ReportType.trip,
                reportName: 'Report 1',
                createdBy: adminUser.id,
            });
            await reportingService.updateReportStatus(report1.id, ReportStatus.completed);

            const report2 = await reportingService.createReport({
                reportType: ReportType.incident,
                reportName: 'Report 2',
                createdBy: adminUser.id,
            });
            await reportingService.updateReportStatus(report2.id, ReportStatus.failed);

            await reportingService.createReport({
                reportType: ReportType.fleet,
                reportName: 'Report 3',
                isScheduled: true,
                createdBy: user2.id,
            });

            await reportingService.trackReportDownload({
                reportId: report1.id,
                userId: user2.id,
            });
        });

        it('should get overall statistics', async () => {
            const stats = await reportingService.getReportStatistics();

            expect(stats.totalReports).toBeGreaterThanOrEqual(3);
            expect(stats.byStatus).toBeDefined();
            expect(stats.byType).toBeDefined();
            expect(stats.scheduledCount).toBeGreaterThanOrEqual(1);
            expect(stats.totalDownloads).toBeGreaterThanOrEqual(1);
        });

        it('should get statistics for specific user', async () => {
            const stats = await reportingService.getReportStatistics(adminUser.id);

            expect(stats.totalReports).toBeGreaterThanOrEqual(2);
        });
    });
});
