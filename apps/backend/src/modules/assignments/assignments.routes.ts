import { Router } from 'express';

export const assignmentsRoutes = Router();

assignmentsRoutes.get('/', (_req, res) => {
  res.json({ module: 'assignments' });
});