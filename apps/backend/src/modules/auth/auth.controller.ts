import { Request, Response } from 'express';
import { loginUser, registerUser } from './auth.service.js';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';

    return res.status(400).json({
      success: false,
      message,
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    const result = await registerUser({ email, password, name, role });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';

    return res.status(400).json({
      success: false,
      message,
    });
  }
};