import { Router } from 'express';

export const authRoutes = Router();

authRoutes.get('/', (_req, res) => {
  res.json({ module: 'auth' });
});