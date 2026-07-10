import { Router } from 'express';

export const stopsRoutes = Router();

stopsRoutes.get('/', (_req, res) => {
  res.json({ module: 'stops' });
});