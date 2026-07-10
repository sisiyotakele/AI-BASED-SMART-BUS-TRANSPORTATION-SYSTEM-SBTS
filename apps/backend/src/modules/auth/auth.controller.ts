import { Request, Response, NextFunction } from 'express';
import { loginUser } from './auth.service';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Call the service layer logic
    const result = await loginUser({ email, password });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};