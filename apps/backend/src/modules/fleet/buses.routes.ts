import { Router } from 'express';

export const busesRoutes = Router();

busesRoutes.get('/', (_req, res) => {
  res.json({ module: 'buses' });
});