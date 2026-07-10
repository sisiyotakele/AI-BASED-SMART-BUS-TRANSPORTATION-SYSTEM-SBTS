import { Router } from 'express';

export const usersRoutes = Router();

usersRoutes.get('/', (_req, res) => {
  res.json({ module: 'users' });
});