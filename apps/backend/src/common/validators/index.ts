import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

export const validateRequest = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Validation error';
      res.status(400).json({
        status: 'fail',
        error: details,
      });
    }
  };
};