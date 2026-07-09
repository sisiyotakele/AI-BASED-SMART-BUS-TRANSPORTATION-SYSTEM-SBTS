import { Router } from 'express';

export const terminalsRoutes = Router();

terminalsRoutes.get('/', (_req, res) => {
  res.json({ module: 'terminals' });
});