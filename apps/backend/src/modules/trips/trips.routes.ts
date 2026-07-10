import { Router } from 'express';

export const tripsRoutes = Router();

tripsRoutes.get('/', (_req, res) => {
  res.json({ module: 'trips' });
});