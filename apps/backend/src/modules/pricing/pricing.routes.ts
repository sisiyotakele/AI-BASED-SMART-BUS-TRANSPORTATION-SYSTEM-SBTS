import { Router } from 'express';

export const pricingRoutes = Router();

pricingRoutes.get('/', (_req, res) => {
  res.json({ module: 'pricing' });
});