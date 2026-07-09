import { Router } from 'express';

export const predictionsRoutes = Router();

predictionsRoutes.get('/', (_req, res) => {
  res.json({ module: 'predictions' });
});