import { Router } from 'express';

export const notificationsRoutes = Router();

notificationsRoutes.get('/', (_req, res) => {
  res.json({ module: 'notifications' });
});