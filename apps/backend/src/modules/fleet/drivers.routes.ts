import { Router } from 'express';

export const driversRoutes = Router();

driversRoutes.get('/', (_req, res) => {
  res.json({ module: 'drivers' });
});