import { Router } from 'express';

export const schedulesRoutes = Router();

schedulesRoutes.get('/', (_req, res) => {
  res.json({ module: 'schedules' });
});