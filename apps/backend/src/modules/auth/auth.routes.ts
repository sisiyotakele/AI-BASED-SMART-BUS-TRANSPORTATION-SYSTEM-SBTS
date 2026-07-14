import { Router } from 'express';
import { login } from './auth.controller.js';
import { loginSchema } from './auth.validator.js';
import { validateRequest } from '../../common/validators/index.js';

const router = Router();

router.post('/login', validateRequest(loginSchema), login);

export default router;