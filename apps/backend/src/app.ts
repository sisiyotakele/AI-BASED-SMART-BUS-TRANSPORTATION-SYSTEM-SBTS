import express from 'express';
import { authRoutes } from './modules/auth/auth.routes';
import { assignmentsRoutes } from './modules/assignments/assignments.routes';
import { busesRoutes } from './modules/fleet/buses.routes';
import { driversRoutes } from './modules/fleet/drivers.routes';
import { shiftsRoutes } from './modules/fleet/shifts.routes';
import { terminalsRoutes } from './modules/fleet/terminals.routes';
import { incidentsRoutes } from './modules/incidents/incidents.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { predictionsRoutes } from './modules/predictions/predictions.routes';
import { pricingRoutes } from './modules/pricing/pricing.routes';
import { routesRoutes } from './modules/routes-stops/routes.routes';
import { stopsRoutes } from './modules/routes-stops/stops.routes';
import { schedulesRoutes } from './modules/schedules/schedules.routes';
import { tripsRoutes } from './modules/trips/trips.routes';
import { usersRoutes } from './modules/users/users.routes';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/auth', authRoutes);
  app.use('/users', usersRoutes);
  app.use('/trips', tripsRoutes);
  app.use('/assignments', assignmentsRoutes);
  app.use('/routes', routesRoutes);
  app.use('/stops', stopsRoutes);
  app.use('/pricing', pricingRoutes);
  app.use('/schedules', schedulesRoutes);
  app.use('/buses', busesRoutes);
  app.use('/drivers', driversRoutes);
  app.use('/terminals', terminalsRoutes);
  app.use('/shifts', shiftsRoutes);
  app.use('/notifications', notificationsRoutes);
  app.use('/incidents', incidentsRoutes);
  app.use('/predictions', predictionsRoutes);

  return app;
}