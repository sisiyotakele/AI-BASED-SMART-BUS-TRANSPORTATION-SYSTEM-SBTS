import express from 'express';
import authRoutes from './modules/auth/auth.routes.js';

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sbts-backend' });
});

app.use('/api/auth', authRoutes);

export default app;
