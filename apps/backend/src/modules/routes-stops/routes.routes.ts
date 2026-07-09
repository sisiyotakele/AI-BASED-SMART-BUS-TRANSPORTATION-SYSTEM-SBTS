import { Router } from 'express';

export const routesRoutes = Router();

routesRoutes.get('/', (_req, res) => {
  res.json({ module: 'routes' });
});