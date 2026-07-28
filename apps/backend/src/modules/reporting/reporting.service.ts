// src/modules/reporting/reporting.service.ts

import { reportingRepository } from './reporting.repository';
import { ReportFilterDto } from './reporting.validation';

export class ReportingService {
  /**
   * Get dashboard statistics
   */
  async getDashboard(filters?: ReportFilterDto) {
    return reportingRepository.getDashboard(filters);
  }

  /**
   * Get trip report with pagination
   */
  async getTripReport(filters?: ReportFilterDto) {
    return reportingRepository.getTrips(filters);
  }

  /**
   * Get incident report with pagination
   */
  async getIncidentReport(filters?: ReportFilterDto) {
    return reportingRepository.getIncidents(filters);
  }

  /**
   * Get bus report with trip counts
   */
  async getBusReport() {
    return reportingRepository.getBusReport();
  }

  /**
   * Get driver report with trip counts
   */
  async getDriverReport() {
    return reportingRepository.getDriverReport();
  }

  /**
   * Get revenue report
   */
  async getRevenueReport() {
    return reportingRepository.getRevenueReport();
  }
}

export const reportingService = new ReportingService();