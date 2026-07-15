import { Router } from 'express';
import { login, register } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.validator.js';
import { validateRequest } from '../../common/validators/index.js';

const router = Router();

router.post('/login', validateRequest(loginSchema), login);
router.post('/register', validateRequest(registerSchema), register);

export default router;