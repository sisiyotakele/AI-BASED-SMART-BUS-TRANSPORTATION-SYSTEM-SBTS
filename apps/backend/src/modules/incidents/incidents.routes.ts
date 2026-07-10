import { Router } from 'express';

export const incidentsRoutes = Router();

incidentsRoutes.get('/', (_req, res) => {
  res.json({ module: 'incidents' });
});