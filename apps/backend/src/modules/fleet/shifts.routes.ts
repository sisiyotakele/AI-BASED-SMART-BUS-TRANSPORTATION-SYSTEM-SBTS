import { Router } from 'express';

export const shiftsRoutes = Router();

shiftsRoutes.get('/', (_req, res) => {
  res.json({ module: 'shifts' });
});