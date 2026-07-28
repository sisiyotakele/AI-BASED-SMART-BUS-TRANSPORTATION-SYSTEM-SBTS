// src/modules/reporting/test/reporting.service.test.ts

import { ReportingService } from '../reporting.service';
import { reportingRepository } from '../reporting.repository';
import { TripStatus } from '@prisma/client';

// Mock the repository
jest.mock('../reporting.repository');

describe('ReportingService', () => {
  let reportingService: ReportingService;

  beforeEach(() => {
    reportingService = new ReportingService();
    jest.clearAllMocks();
  });

  // ─── Dashboard Tests ──────────────────────────────────────────

  describe('getDashboard', () => {
    it('should return dashboard statistics', async () => {
      const mockData = {
        users: 150,
        buses: 25,
        routes: 12,
        trips: 340,
        schedules: 48,
        incidents: 7,
        notifications: 89,
      };

      (reportingRepository.getDashboard as jest.Mock).mockResolvedValue(mockData);

      const result = await reportingService.getDashboard();

      expect(reportingRepository.getDashboard).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should pass filters to repository', async () => {
      const filters = {
        from: '2024-01-01',
        to: '2024-01-31',
      };

      await reportingService.getDashboard(filters);

      expect(reportingRepository.getDashboard).toHaveBeenCalledWith(filters);
    });
  });

  // ─── Trip Report Tests ────────────────────────────────────────

  describe('getTripReport', () => {
    it('should return paginated trip report', async () => {
      const mockResult = {
        data: [
          {
            id: 'trip-1',
            status: TripStatus.completed,
            scheduledStart: new Date(),
            actualStart: new Date(),
            actualEnd: new Date(),
            createdAt: new Date(),
            bus: { id: 'bus-1', plateNumber: 'AA-1234', model: 'Yutong' },
            driver: { id: 'driver-1', fullName: 'John Driver', email: 'john@example.com' },
            routeName: 'Bole - Piassa',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      (reportingRepository.getTrips as jest.Mock).mockResolvedValue(mockResult);

      const result = await reportingService.getTripReport();

      expect(reportingRepository.getTrips).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should pass filters to repository', async () => {
      const filters = {
        from: '2024-01-01',
        to: '2024-01-31',
        routeId: 'route-123',
        driverId: 'driver-456',
        busId: 'bus-789',
        page: 2,
        limit: 10,
      };

      await reportingService.getTripReport(filters);

      expect(reportingRepository.getTrips).toHaveBeenCalledWith(filters);
    });
  });

  // ─── Incident Report Tests ────────────────────────────────────

  describe('getIncidentReport', () => {
    it('should return paginated incident report', async () => {
      const mockResult = {
        data: [
          {
            id: 'incident-1',
            incidentType: 'breakdown',
            severity: 'high',
            status: 'resolved',
            description: 'Engine failure',
            createdAt: new Date(),
            resolvedAt: new Date(),
            busPlate: 'AA-1234',
            driverName: 'John Driver',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      (reportingRepository.getIncidents as jest.Mock).mockResolvedValue(mockResult);

      const result = await reportingService.getIncidentReport();

      expect(reportingRepository.getIncidents).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should pass filters to repository', async () => {
      const filters = {
        from: '2024-01-01',
        to: '2024-01-31',
        page: 1,
        limit: 20,
      };

      await reportingService.getIncidentReport(filters);

      expect(reportingRepository.getIncidents).toHaveBeenCalledWith(filters);
    });
  });

  // ─── Bus Report Tests ─────────────────────────────────────────

  describe('getBusReport', () => {
    it('should return bus report with trip counts', async () => {
      const mockData = [
        {
          id: 'bus-1',
          plateNumber: 'AA-1234',
          model: 'Yutong ZK6128H',
          capacity: 70,
          maintenanceStatus: 'operational',
          totalTrips: 45,
        },
        {
          id: 'bus-2',
          plateNumber: 'AA-5678',
          model: 'Isuzu NQR',
          capacity: 50,
          maintenanceStatus: 'in_maintenance',
          totalTrips: 12,
        },
      ];

      (reportingRepository.getBusReport as jest.Mock).mockResolvedValue(mockData);

      const result = await reportingService.getBusReport();

      expect(reportingRepository.getBusReport).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  // ─── Driver Report Tests ──────────────────────────────────────

  describe('getDriverReport', () => {
    it('should return driver report with trip counts', async () => {
      const mockData = [
        {
          id: 'driver-1',
          fullName: 'John Driver',
          email: 'john@example.com',
          phone: '+251911111111',
          totalTrips: 30,
          activeTrips: 2,
          completedTrips: 28,
        },
        {
          id: 'driver-2',
          fullName: 'Sarah Driver',
          email: 'sarah@example.com',
          phone: '+251911222222',
          totalTrips: 25,
          activeTrips: 1,
          completedTrips: 24,
        },
      ];

      (reportingRepository.getDriverReport as jest.Mock).mockResolvedValue(mockData);

      const result = await reportingService.getDriverReport();

      expect(reportingRepository.getDriverReport).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  // ─── Revenue Report Tests ─────────────────────────────────────

  describe('getRevenueReport', () => {
    it('should return revenue report', async () => {
      const mockData = {
        totalRevenue: 45000,
        totalTrips: 150,
        averageRevenue: 300,
      };

      (reportingRepository.getRevenueReport as jest.Mock).mockResolvedValue(mockData);

      const result = await reportingService.getRevenueReport();

      expect(reportingRepository.getRevenueReport).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });
});