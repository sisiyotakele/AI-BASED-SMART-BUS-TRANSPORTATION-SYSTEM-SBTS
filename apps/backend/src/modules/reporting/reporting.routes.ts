// src/modules/reporting/reporting.routes.ts

import { Router } from 'express';
import { reportingController } from './reporting.controller';

const router = Router();

/**
 * ============================================================
 * Reporting Routes
 * Base URL: /api/reports
 * ============================================================
 */

// ─── Routes ──────────────────────────────────────────────────────

// GET /api/reports/dashboard - Dashboard statistics
router.get('/dashboard', reportingController.dashboard.bind(reportingController));

// GET /api/reports/trips - Trip report with pagination
router.get('/trips', reportingController.trips.bind(reportingController));

// GET /api/reports/incidents - Incident report with pagination
router.get('/incidents', reportingController.incidents.bind(reportingController));

// GET /api/reports/buses - Bus report
router.get('/buses', reportingController.buses.bind(reportingController));

// GET /api/reports/drivers - Driver report
router.get('/drivers', reportingController.drivers.bind(reportingController));

// GET /api/reports/revenue - Revenue report
router.get('/revenue', reportingController.revenue.bind(reportingController));

export default router;